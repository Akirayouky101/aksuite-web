'use client'

import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'
import {
  KDF_ALGORITHM, KDF_ITERATIONS, MAX_KDF_ITERATIONS, MIN_KDF_ITERATIONS, VaultCryptoError, VaultField,
  FieldKey, decodeLegacySecret, decryptField, deriveMasterKek, deriveRecoveryKek, encryptField, formatRecoveryKey,
  fromBase64, generateUserKeyPair, importFieldKey, importPrivateKey, parseRecoveryKey, publicKeyFingerprint,
  randomBytes, toBase64, unwrapPrivateKey, unwrapVaultKey, validateNewMasterPassword, wipe, wrapPrivateKey,
  wrapVaultKeyForRecipient,
} from './crypto'

export type VaultStatus = 'signed-out' | 'loading' | 'unavailable' | 'needs-enrollment' | 'pending' | 'locked' | 'unlocked' | 'error'

export interface VaultSnapshot {
  status: VaultStatus
  userId: string | null
  vaultExists: boolean
  fingerprint: string | null
  error: string | null
  dataVersion: number
}

export interface VaultDirectoryEntry {
  userId: string
  email: string | null
  fullName: string | null
  publicKey: string
  fingerprint: string
  hasAccess: boolean
}

export interface PreparedRecoveryKey {
  recoveryKey: string
  commit: () => Promise<void>
  discard: () => void
}

interface VaultRow { key_id: string; created_by: string; format_version: number }
interface MemberRow {
  user_id: string
  format_version: number
  public_key: string
  kdf_algorithm: string
  kdf_iterations: number
  kdf_salt: string
  private_key_master: string
  recovery_salt: string
  private_key_recovery: string
}
interface GrantRow { user_id: string; key_id: string; recipient_public_key: string; ephemeral_public_key: string; wrapped_vault_key: string; format_version: number }

const IDLE_LOCK_MS = 10 * 60 * 1000
const MEMBER_COLUMNS = 'user_id, format_version, public_key, kdf_algorithm, kdf_iterations, kdf_salt, private_key_master, recovery_salt, private_key_recovery'

const initialSnapshot: VaultSnapshot = { status: 'signed-out', userId: null, vaultExists: false, fingerprint: null, error: null, dataVersion: 0 }
let snapshot: VaultSnapshot = initialSnapshot
const listeners = new Set<() => void>()
let rows: { vault: VaultRow | null; member: MemberRow | null; grant: GrantRow | null } = { vault: null, member: null, grant: null }
let unlocked: { userId: string; fieldKey: FieldKey; rawVaultKey: Uint8Array } | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let refreshSequence = 0
let lockVersion = 0

function emit(next: Partial<VaultSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getVaultSnapshot() { return snapshot }

export function usePasswordVault() {
  return useSyncExternalStore(subscribe, getVaultSnapshot, () => initialSnapshot)
}

export function describeVaultError(error: unknown, action = 'completare l’operazione'): string {
  if (error instanceof VaultCryptoError) return error.message
  const candidate = error as { code?: string; message?: string } | null
  if (candidate?.code === 'P0001' && candidate.message) return candidate.message
  if (candidate?.code === '42501') return `Permesso negato: impossibile ${action}.`
  if (candidate?.code === '42P01' || candidate?.code === 'PGRST205' || candidate?.code === '42883' || candidate?.code === 'PGRST202') return 'La cassaforte password non è ancora configurata sul database (migrazione mancante).'
  return `Impossibile ${action}. Riprova.`
}

function isMissingSchema(error: { code?: string } | null) {
  return Boolean(error && ['42P01', 'PGRST205', '42703', 'PGRST204'].includes(error.code || ''))
}

function scheduleIdleLock() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => lockVault(), IDLE_LOCK_MS)
}

function requireUnlocked(): { userId: string; fieldKey: FieldKey; rawVaultKey: Uint8Array } {
  if (!unlocked || unlocked.userId !== snapshot.userId) throw new VaultCryptoError('locked', 'Sblocca la cassaforte con la master password per continuare.')
  scheduleIdleLock()
  return unlocked
}

function requireMember(): MemberRow {
  const member = rows.member
  if (!member || member.user_id !== snapshot.userId) throw new VaultCryptoError('locked', 'Configura prima la tua master password.')
  if (member.format_version !== 1 || member.kdf_algorithm !== KDF_ALGORITHM) throw new VaultCryptoError('invalid-format', 'Formato delle chiavi non supportato da questa versione dell’app.')
  return member
}

function grantIsUsable(vault: VaultRow | null, member: MemberRow | null, grant: GrantRow | null) {
  return Boolean(vault && member && grant && grant.format_version === 1 && grant.key_id === vault.key_id && grant.recipient_public_key === member.public_key)
}

export function lockVault() {
  lockVersion++
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
  if (unlocked) { wipe(unlocked.rawVaultKey); unlocked = null }
  if (snapshot.status === 'unlocked') emit({ status: grantIsUsable(rows.vault, rows.member, rows.grant) ? 'locked' : 'pending' })
}

export function clearVaultSession() {
  refreshSequence++
  lockVault()
  rows = { vault: null, member: null, grant: null }
  emit({ ...initialSnapshot, dataVersion: snapshot.dataVersion })
}

export async function refreshVault(userId: string | null | undefined) {
  const sequence = ++refreshSequence
  if (!userId) {
    clearVaultSession()
    return
  }
  if (snapshot.userId !== userId) {
    lockVault()
    rows = { vault: null, member: null, grant: null }
    emit({ status: 'loading', userId, vaultExists: false, fingerprint: null, error: null })
  } else if (snapshot.status === 'unlocked') {
    return
  } else {
    emit({ status: 'loading', error: null })
  }

  const [vaultResult, memberResult, grantResult] = await Promise.all([
    supabase.from('password_vault').select('key_id, created_by, format_version').maybeSingle(),
    supabase.from('password_vault_members').select(MEMBER_COLUMNS).eq('user_id', userId).maybeSingle(),
    supabase.from('password_vault_grants').select('user_id, key_id, recipient_public_key, ephemeral_public_key, wrapped_vault_key, format_version').eq('user_id', userId).maybeSingle(),
  ])
  if (sequence !== refreshSequence) return
  const failure = vaultResult.error || memberResult.error || grantResult.error
  if (failure) {
    emit({ status: isMissingSchema(failure) ? 'unavailable' : 'error', error: describeVaultError(failure, 'caricare la cassaforte') })
    return
  }
  rows = { vault: vaultResult.data as VaultRow | null, member: memberResult.data as MemberRow | null, grant: grantResult.data as GrantRow | null }
  let fingerprint: string | null = null
  if (rows.member) {
    try {
      fingerprint = await publicKeyFingerprint(fromBase64(rows.member.public_key, 65))
    } catch (error) {
      if (sequence !== refreshSequence) return
      emit({ status: 'error', error: describeVaultError(error, 'verificare le chiavi della cassaforte') })
      return
    }
  }
  if (sequence !== refreshSequence) return
  const status: VaultStatus = !rows.member ? 'needs-enrollment' : grantIsUsable(rows.vault, rows.member, rows.grant) ? 'locked' : 'pending'
  emit({ status, vaultExists: Boolean(rows.vault), fingerprint, error: null })
}

async function reload() {
  const userId = snapshot.userId
  if (snapshot.status === 'unlocked') return
  await refreshVault(userId)
}

async function createRecoveryWrapping(privateKeyX963: Uint8Array, userId: string) {
  const secret = randomBytes(32)
  const salt = randomBytes(16)
  const kek = await deriveRecoveryKek(secret, salt)
  const wrapped = await wrapPrivateKey(privateKeyX963, kek, userId, 'recovery')
  const recoveryKey = formatRecoveryKey(secret)
  wipe(kek); wipe(secret)
  return { recoveryKey, recovery_salt: toBase64(salt), private_key_recovery: wrapped }
}

async function createMasterWrapping(privateKeyX963: Uint8Array, userId: string, password: string) {
  const salt = randomBytes(16)
  const kek = await deriveMasterKek(password, salt, KDF_ITERATIONS)
  const wrapped = await wrapPrivateKey(privateKeyX963, kek, userId, 'master')
  wipe(kek)
  return { kdf_algorithm: KDF_ALGORITHM, kdf_iterations: KDF_ITERATIONS, kdf_salt: toBase64(salt), private_key_master: wrapped }
}

async function openPrivateKeyWithMaster(member: MemberRow, password: string) {
  if (member.kdf_iterations < MIN_KDF_ITERATIONS || member.kdf_iterations > MAX_KDF_ITERATIONS) throw new VaultCryptoError('invalid-format', 'Parametri di derivazione non supportati.')
  const kek = await deriveMasterKek(password, fromBase64(member.kdf_salt, 16), member.kdf_iterations)
  try {
    return await unwrapPrivateKey(member.private_key_master, kek, member.user_id, 'master', fromBase64(member.public_key, 65))
  } finally { wipe(kek) }
}

async function openPrivateKeyWithRecovery(member: MemberRow, recoveryKeyText: string) {
  const secret = parseRecoveryKey(recoveryKeyText)
  const kek = await deriveRecoveryKek(secret, fromBase64(member.recovery_salt, 16))
  wipe(secret)
  try {
    return await unwrapPrivateKey(member.private_key_recovery, kek, member.user_id, 'recovery', fromBase64(member.public_key, 65))
  } finally { wipe(kek) }
}

async function finishUnlock(member: MemberRow, privateKeyX963: Uint8Array, version: number) {
  const vault = rows.vault, grant = rows.grant
  if (!grantIsUsable(vault, member, grant) || !vault || !grant) { emit({ status: 'pending' }); return }
  const privateKey = await importPrivateKey(privateKeyX963)
  const rawVaultKey = await unwrapVaultKey(privateKey, fromBase64(member.public_key, 65), grant.ephemeral_public_key, grant.wrapped_vault_key, vault.key_id, member.user_id)
  let fieldKey: FieldKey
  try {
    fieldKey = await importFieldKey(rawVaultKey, vault.key_id)
    if (version !== lockVersion || snapshot.userId !== member.user_id || rows.member?.public_key !== member.public_key) {
      throw new VaultCryptoError('locked', 'Sessione cambiata o cassaforte bloccata. Riprova lo sblocco.')
    }
  } catch (error) {
    wipe(rawVaultKey)
    throw error
  }
  unlocked = { userId: member.user_id, fieldKey, rawVaultKey }
  scheduleIdleLock()
  emit({ status: 'unlocked', error: null })
}

export async function prepareEnrollment(masterPassword: string, confirmation: string): Promise<PreparedRecoveryKey> {
  const userId = snapshot.userId
  if (!userId) throw new VaultCryptoError('locked', 'Accedi per configurare la cassaforte.')
  const invalid = validateNewMasterPassword(masterPassword, confirmation)
  if (invalid) throw new VaultCryptoError('invalid-format', invalid)
  const pair = await generateUserKeyPair()
  try {
    const master = await createMasterWrapping(pair.privateKeyX963, userId, masterPassword)
    const recovery = await createRecoveryWrapping(pair.privateKeyX963, userId)
    const publicKey = toBase64(pair.publicKey)
    let used = false
    return {
      recoveryKey: recovery.recoveryKey,
      discard: () => { used = true },
      commit: async () => {
        if (used || snapshot.userId !== userId) throw new VaultCryptoError('locked', 'Configurazione scaduta. Ricomincia.')
        used = true
        const { error } = await supabase.from('password_vault_members').insert({
          user_id: userId, format_version: 1, public_key: publicKey, ...master,
          recovery_salt: recovery.recovery_salt, private_key_recovery: recovery.private_key_recovery,
        })
        if (error) throw error
        await reload()
      },
    }
  } finally { wipe(pair.privateKeyX963) }
}

// Admin-only (enforced by the password_vault_bootstrap RPC). Creates the single shared vault key.
export async function createSharedVault() {
  const member = requireMember()
  if (rows.vault) throw new VaultCryptoError('invalid-format', 'La cassaforte condivisa esiste già.')
  const keyId = globalThis.crypto.randomUUID().toLowerCase()
  const rawVaultKey = randomBytes(32)
  try {
    const grant = await wrapVaultKeyForRecipient(rawVaultKey, fromBase64(member.public_key, 65), keyId, member.user_id)
    const { error } = await supabase.rpc('password_vault_bootstrap', { p_key_id: keyId, p_recipient_public_key: member.public_key, p_ephemeral_public_key: grant.ephemeralPublicKey, p_wrapped_vault_key: grant.wrappedVaultKey })
    if (error) throw error
  } finally { wipe(rawVaultKey) }
  await refreshVault(member.user_id)
}

export async function unlockVault(masterPassword: string) {
  const version = lockVersion
  const member = requireMember()
  const x963 = await openPrivateKeyWithMaster(member, masterPassword)
  try { await finishUnlock(member, x963, version) } finally { wipe(x963) }
}

export async function prepareRecovery(recoveryKeyText: string, newPassword: string, confirmation: string): Promise<PreparedRecoveryKey> {
  const version = lockVersion
  const member = requireMember()
  const invalid = validateNewMasterPassword(newPassword, confirmation)
  if (invalid) throw new VaultCryptoError('invalid-format', invalid)
  const x963 = await openPrivateKeyWithRecovery(member, recoveryKeyText)
  let master, recovery
  try {
    master = await createMasterWrapping(x963, member.user_id, newPassword)
    recovery = await createRecoveryWrapping(x963, member.user_id)
  } catch (error) { wipe(x963); throw error }
  let used = false
  return {
    recoveryKey: recovery.recoveryKey,
    discard: () => { used = true; wipe(x963) },
    commit: async () => {
      if (used || version !== lockVersion || snapshot.userId !== member.user_id) throw new VaultCryptoError('locked', 'Procedura scaduta. Ricomincia.')
      used = true
      try {
        const { data, error } = await supabase.from('password_vault_members')
          .update({ ...master, recovery_salt: recovery.recovery_salt, private_key_recovery: recovery.private_key_recovery })
          .eq('user_id', member.user_id).eq('public_key', member.public_key).select(MEMBER_COLUMNS)
        if (error) throw error
        if (!data || data.length !== 1) throw new VaultCryptoError('integrity', 'Le tue chiavi sono cambiate nel frattempo. Ricarica e riprova.')
        rows = { ...rows, member: data[0] as MemberRow }
        await finishUnlock(rows.member!, x963, version)
      } finally { wipe(x963) }
    },
  }
}

export async function changeMasterPassword(currentPassword: string, newPassword: string, confirmation: string) {
  const member = requireMember()
  const invalid = validateNewMasterPassword(newPassword, confirmation)
  if (invalid) throw new VaultCryptoError('invalid-format', invalid)
  const x963 = await openPrivateKeyWithMaster(member, currentPassword)
  try {
    const master = await createMasterWrapping(x963, member.user_id, newPassword)
    const { data, error } = await supabase.from('password_vault_members').update(master)
      .eq('user_id', member.user_id).eq('public_key', member.public_key).select(MEMBER_COLUMNS)
    if (error) throw error
    if (!data || data.length !== 1) throw new VaultCryptoError('integrity', 'Le tue chiavi sono cambiate nel frattempo. Ricarica e riprova.')
    rows = { ...rows, member: data[0] as MemberRow }
  } finally { wipe(x963) }
}

export async function prepareRecoveryKeyRotation(masterPassword: string): Promise<PreparedRecoveryKey> {
  const member = requireMember()
  const x963 = await openPrivateKeyWithMaster(member, masterPassword)
  let recovery
  try { recovery = await createRecoveryWrapping(x963, member.user_id) } finally { wipe(x963) }
  let used = false
  return {
    recoveryKey: recovery.recoveryKey,
    discard: () => { used = true },
    commit: async () => {
      if (used) throw new VaultCryptoError('locked', 'Procedura scaduta. Ricomincia.')
      used = true
      const { data, error } = await supabase.from('password_vault_members')
        .update({ recovery_salt: recovery.recovery_salt, private_key_recovery: recovery.private_key_recovery })
        .eq('user_id', member.user_id).eq('public_key', member.public_key).select(MEMBER_COLUMNS)
      if (error) throw error
      if (!data || data.length !== 1) throw new VaultCryptoError('integrity', 'Le tue chiavi sono cambiate nel frattempo. Ricarica e riprova.')
      rows = { ...rows, member: data[0] as MemberRow }
    },
  }
}

// Last resort when both master password and recovery key are lost: removes this user's keys and grant.
export async function resetMyVaultKeys() {
  const userId = snapshot.userId
  if (!userId) return
  lockVault()
  const { error } = await supabase.from('password_vault_members').delete().eq('user_id', userId)
  if (error) throw error
  await refreshVault(userId)
}

export async function loadVaultDirectory(): Promise<VaultDirectoryEntry[]> {
  requireUnlocked()
  const { data, error } = await supabase.rpc('password_vault_directory')
  if (error) throw error
  const entries = (data || []) as { user_id: string; email: string | null; full_name: string | null; public_key: string; has_access: boolean }[]
  return Promise.all(entries.map(async entry => ({
    userId: entry.user_id,
    email: entry.email,
    fullName: entry.full_name,
    publicKey: entry.public_key,
    hasAccess: entry.has_access,
    fingerprint: await publicKeyFingerprint(fromBase64(entry.public_key, 65)),
  })))
}

export async function grantVaultAccess(entry: VaultDirectoryEntry) {
  const session = requireUnlocked()
  const grant = await wrapVaultKeyForRecipient(session.rawVaultKey, fromBase64(entry.publicKey, 65), session.fieldKey.keyId, entry.userId)
  const { error } = await supabase.rpc('password_vault_grant', {
    p_user_id: entry.userId, p_key_id: session.fieldKey.keyId, p_recipient_public_key: entry.publicKey,
    p_ephemeral_public_key: grant.ephemeralPublicKey, p_wrapped_vault_key: grant.wrappedVaultKey,
  })
  if (error) throw error
}

export function isVaultUnlocked() {
  return Boolean(unlocked && unlocked.userId === snapshot.userId)
}

export async function encryptVaultField(rowId: string, field: VaultField, plaintext: string) {
  return encryptField(requireUnlocked().fieldKey, rowId, field, plaintext)
}

export async function decryptVaultField(rowId: string, field: VaultField, envelope: string) {
  const session = requireUnlocked()
  const plaintext = await decryptField(session.fieldKey, rowId, field, envelope)
  if (unlocked !== session) throw new VaultCryptoError('locked', 'Cassaforte bloccata durante la decifratura.')
  return plaintext
}

export interface LegacyMigrationResult { migrated: number; skipped: number; failed: number }

// Explicit, user-triggered migration of legacy (Base64 / plaintext PIN) rows to format v1.
// Each row is verified by round-trip decryption and updated only if it is still unchanged.
export async function migrateLegacyPasswords(): Promise<LegacyMigrationResult> {
  requireUnlocked()
  const { data, error } = await supabase.from('passwords').select('id, encrypted_password, pin_code').eq('vault_format', 0)
  if (error) throw error
  const result: LegacyMigrationResult = { migrated: 0, skipped: 0, failed: 0 }
  for (const row of (data || []) as { id: string; encrypted_password: string; pin_code: string | null }[]) {
    try {
      const password = decodeLegacySecret(row.encrypted_password)
      const pin = row.pin_code || ''
      const encryptedPassword = await encryptVaultField(row.id, 'password', password)
      const encryptedPin = pin ? await encryptVaultField(row.id, 'pin', pin) : null
      if (await decryptVaultField(row.id, 'password', encryptedPassword) !== password) throw new Error('verify')
      if (encryptedPin && await decryptVaultField(row.id, 'pin', encryptedPin) !== pin) throw new Error('verify')
      let query = supabase.from('passwords')
        .update({ encrypted_password: encryptedPassword, encrypted_pin_code: encryptedPin, pin_code: null, vault_format: 1, updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('vault_format', 0).eq('encrypted_password', row.encrypted_password)
      query = row.pin_code === null ? query.is('pin_code', null) : query.eq('pin_code', row.pin_code)
      const { data: updated, error: updateError } = await query.select('id')
      if (updateError) throw updateError
      if (updated && updated.length === 1) result.migrated++
      else result.skipped++
    } catch {
      result.failed++
    }
  }
  emit({ dataVersion: snapshot.dataVersion + 1 })
  return result
}
