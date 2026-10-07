// AK Suite password vault, format v1. Must stay byte-compatible with
// platforms/MobileNative/AKSuite/Features/Passwords/PasswordVaultCrypto.swift
// and docs/password-vault.md.

export const VAULT_FORMAT_VERSION = 1
export const KDF_ALGORITHM = 'PBKDF2-HMAC-SHA256'
export const KDF_ITERATIONS = 600_000
export const MIN_KDF_ITERATIONS = 600_000
export const MAX_KDF_ITERATIONS = 10_000_000
export const MIN_MASTER_PASSWORD_LENGTH = 12
export const FIELD_PREFIX = 'akv1.'
const RECOVERY_PREFIX = 'AKR1'
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

export type VaultField = 'password' | 'pin'

export type VaultErrorCode =
  | 'unsupported'
  | 'invalid-format'
  | 'wrong-secret'
  | 'integrity'
  | 'unknown-key'
  | 'locked'

export class VaultCryptoError extends Error {
  constructor(public code: VaultErrorCode, message: string) {
    super(message)
    this.name = 'VaultCryptoError'
  }
}

const encoder = new TextEncoder()

function subtle(): SubtleCrypto {
  const value = typeof globalThis !== 'undefined' ? globalThis.crypto?.subtle : undefined
  if (!value) throw new VaultCryptoError('unsupported', 'Questo browser non supporta la crittografia necessaria (serve HTTPS e un browser aggiornato).')
  return value
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return copy.buffer
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

export function wipe(bytes: Uint8Array | null | undefined) {
  if (bytes) bytes.fill(0)
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  let length = 0
  for (let i = 0; i < parts.length; i++) length += parts[i].length
  const out = new Uint8Array(length)
  let offset = 0
  for (let i = 0; i < parts.length; i++) { out.set(parts[i], offset); offset += parts[i].length }
  return out
}

export function bytesEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function fromBase64(value: string, expectedLength?: number): Uint8Array {
  if (!BASE64_PATTERN.test(value)) throw new VaultCryptoError('invalid-format', 'Dato cifrato non valido.')
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  if (expectedLength !== undefined && bytes.length !== expectedLength) throw new VaultCryptoError('invalid-format', 'Dato cifrato con lunghezza inattesa.')
  return bytes
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  return fromBase64(padded)
}

function bytesToBase64Url(bytes: Uint8Array) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function normalizeUuid(value: string) {
  const lower = value.toLowerCase()
  if (!UUID_PATTERN.test(lower)) throw new VaultCryptoError('invalid-format', 'Identificativo non valido.')
  return lower
}

// AES-256-GCM, 96-bit random nonce, 128-bit tag. Output: nonce || ciphertext || tag.
async function aesKey(raw: Uint8Array, usages: KeyUsage[] = ['encrypt', 'decrypt']) {
  if (raw.length !== 32) throw new VaultCryptoError('invalid-format', 'Chiave con lunghezza non valida.')
  return subtle().importKey('raw', toBuffer(raw), { name: 'AES-GCM' }, false, usages)
}

async function seal(key: CryptoKey, plaintext: Uint8Array, aad: string): Promise<Uint8Array> {
  const nonce = randomBytes(12)
  const sealed = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: toBuffer(nonce), additionalData: toBuffer(encoder.encode(aad)), tagLength: 128 }, key, toBuffer(plaintext)))
  return concatBytes(nonce, sealed)
}

async function open(key: CryptoKey, combined: Uint8Array, aad: string, failure: VaultErrorCode, message: string): Promise<Uint8Array> {
  if (combined.length < 12 + 16) throw new VaultCryptoError('invalid-format', 'Dato cifrato troncato.')
  try {
    const plain = await subtle().decrypt({ name: 'AES-GCM', iv: toBuffer(combined.subarray(0, 12)), additionalData: toBuffer(encoder.encode(aad)), tagLength: 128 }, key, toBuffer(combined.subarray(12)))
    return new Uint8Array(plain)
  } catch {
    throw new VaultCryptoError(failure, message)
  }
}

export async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: string, length = 32): Promise<Uint8Array> {
  const base = await subtle().importKey('raw', toBuffer(ikm), 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await subtle().deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: toBuffer(salt), info: toBuffer(encoder.encode(info)) }, base, length * 8))
}

export async function sha256(bytes: Uint8Array) {
  return new Uint8Array(await subtle().digest('SHA-256', toBuffer(bytes)))
}

// ── Master password ─────────────────────────────────────────────────────────

export function normalizeMasterPassword(password: string) {
  return password.normalize('NFC')
}

export function validateNewMasterPassword(password: string, confirmation: string): string | null {
  const normalized = normalizeMasterPassword(password)
  if (Array.from(normalized).length < MIN_MASTER_PASSWORD_LENGTH) return `La master password deve contenere almeno ${MIN_MASTER_PASSWORD_LENGTH} caratteri.`
  if (normalized !== normalizeMasterPassword(confirmation)) return 'Le due master password non coincidono.'
  return null
}

export async function deriveMasterKek(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  if (!Number.isInteger(iterations) || iterations < MIN_KDF_ITERATIONS || iterations > MAX_KDF_ITERATIONS) throw new VaultCryptoError('invalid-format', 'Parametri di derivazione non supportati.')
  if (salt.length !== 16) throw new VaultCryptoError('invalid-format', 'Salt non valido.')
  const passwordBytes = encoder.encode(normalizeMasterPassword(password))
  const base = await subtle().importKey('raw', toBuffer(passwordBytes), 'PBKDF2', false, ['deriveBits'])
  wipe(passwordBytes)
  return new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: toBuffer(salt), iterations }, base, 256))
}

// ── Recovery key ────────────────────────────────────────────────────────────

function base32Encode(bytes: Uint8Array) {
  let bits = 0, value = 0, out = ''
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) { out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(text: string) {
  let bits = 0, value = 0
  const out: number[] = []
  for (let i = 0; i < text.length; i++) {
    const index = BASE32_ALPHABET.indexOf(text[i])
    if (index < 0) throw new VaultCryptoError('invalid-format', 'La recovery key contiene caratteri non validi.')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) throw new VaultCryptoError('invalid-format', 'Recovery key non valida.')
  return new Uint8Array(out)
}

export function formatRecoveryKey(bytes: Uint8Array) {
  const encoded = base32Encode(bytes)
  const groups: string[] = [RECOVERY_PREFIX]
  for (let i = 0; i < encoded.length; i += 4) groups.push(encoded.slice(i, i + 4))
  return groups.join('-')
}

export function parseRecoveryKey(text: string): Uint8Array {
  let compact = text.toUpperCase().replace(/[\s-]/g, '')
  if (compact.startsWith(RECOVERY_PREFIX)) compact = compact.slice(RECOVERY_PREFIX.length)
  if (compact.length !== 52) throw new VaultCryptoError('invalid-format', 'La recovery key deve contenere 52 caratteri dopo il prefisso AKR1.')
  const bytes = base32Decode(compact)
  if (bytes.length !== 32) throw new VaultCryptoError('invalid-format', 'Recovery key non valida.')
  return bytes
}

export function deriveRecoveryKek(recoveryKey: Uint8Array, salt: Uint8Array) {
  if (recoveryKey.length !== 32 || salt.length !== 16) throw new VaultCryptoError('invalid-format', 'Recovery key non valida.')
  return hkdf(recoveryKey, salt, 'aksuite.vault.v1.recovery-kek')
}

// ── User key pair (ECDH P-256) ──────────────────────────────────────────────

export interface UserKeyPair {
  publicKey: Uint8Array // 65 byte uncompressed SEC1 point
  privateKeyX963: Uint8Array // 0x04 || X || Y || D (97 bytes)
}

export async function generateUserKeyPair(): Promise<UserKeyPair> {
  const pair = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair
  const publicKey = new Uint8Array(await subtle().exportKey('raw', pair.publicKey))
  const jwk = await subtle().exportKey('jwk', pair.privateKey)
  if (!jwk.x || !jwk.y || !jwk.d) throw new VaultCryptoError('unsupported', 'Impossibile esportare la chiave privata.')
  const privateKeyX963 = concatBytes(new Uint8Array([4]), base64UrlToBytes(jwk.x), base64UrlToBytes(jwk.y), base64UrlToBytes(jwk.d))
  if (publicKey.length !== 65 || privateKeyX963.length !== 97) throw new VaultCryptoError('unsupported', 'Formato chiave non supportato.')
  return { publicKey, privateKeyX963 }
}

export async function importPrivateKey(x963: Uint8Array): Promise<CryptoKey> {
  if (x963.length !== 97 || x963[0] !== 4) throw new VaultCryptoError('invalid-format', 'Chiave privata non valida.')
  const jwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256', ext: false,
    x: bytesToBase64Url(x963.subarray(1, 33)),
    y: bytesToBase64Url(x963.subarray(33, 65)),
    d: bytesToBase64Url(x963.subarray(65, 97)),
  }
  return subtle().importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])
}

export async function importPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  if (raw.length !== 65 || raw[0] !== 4) throw new VaultCryptoError('invalid-format', 'Chiave pubblica non valida.')
  return subtle().importKey('raw', toBuffer(raw), { name: 'ECDH', namedCurve: 'P-256' }, false, [])
}

export async function publicKeyFingerprint(publicKey: Uint8Array) {
  const digest = await sha256(publicKey)
  let hex = ''
  for (let i = 0; i < 10; i++) hex += digest[i].toString(16).padStart(2, '0')
  return hex.toUpperCase().match(/.{4}/g)!.join(' ')
}

function privateKeyAad(userId: string, purpose: 'master' | 'recovery') {
  return `aksuite.vault.v1|user-private-key|${normalizeUuid(userId)}|${purpose}`
}

export async function wrapPrivateKey(privateKeyX963: Uint8Array, kek: Uint8Array, userId: string, purpose: 'master' | 'recovery') {
  return toBase64(await seal(await aesKey(kek, ['encrypt']), privateKeyX963, privateKeyAad(userId, purpose)))
}

export async function unwrapPrivateKey(wrapped: string, kek: Uint8Array, userId: string, purpose: 'master' | 'recovery', expectedPublicKey: Uint8Array) {
  const message = purpose === 'master' ? 'Master password errata.' : 'Recovery key errata.'
  const x963 = await open(await aesKey(kek, ['decrypt']), fromBase64(wrapped, 12 + 97 + 16), privateKeyAad(userId, purpose), 'wrong-secret', message)
  if (x963.length !== 97 || !bytesEqual(x963.subarray(0, 65), expectedPublicKey)) {
    wipe(x963)
    throw new VaultCryptoError('integrity', 'La chiave privata non corrisponde alla chiave pubblica registrata.')
  }
  return x963
}

// ── Vault key grants (ECDH P-256 + HKDF-SHA256 + AES-256-GCM) ───────────────

function grantInfo(keyId: string, recipientUserId: string) {
  return `aksuite.vault.v1.grant|${normalizeUuid(keyId)}|${normalizeUuid(recipientUserId)}`
}

export async function wrapVaultKeyForRecipient(vaultKey: Uint8Array, recipientPublicKey: Uint8Array, keyId: string, recipientUserId: string) {
  if (vaultKey.length !== 32) throw new VaultCryptoError('invalid-format', 'Chiave della cassaforte non valida.')
  const recipient = await importPublicKey(recipientPublicKey)
  const ephemeral = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']) as CryptoKeyPair
  const ephemeralPublicKey = new Uint8Array(await subtle().exportKey('raw', ephemeral.publicKey))
  const shared = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: recipient }, ephemeral.privateKey, 256))
  const info = grantInfo(keyId, recipientUserId)
  const kek = await hkdf(shared, concatBytes(ephemeralPublicKey, recipientPublicKey), info)
  wipe(shared)
  const wrapped = await seal(await aesKey(kek, ['encrypt']), vaultKey, info)
  wipe(kek)
  return { ephemeralPublicKey: toBase64(ephemeralPublicKey), wrappedVaultKey: toBase64(wrapped) }
}

export async function unwrapVaultKey(privateKey: CryptoKey, ownPublicKey: Uint8Array, ephemeralPublicKeyB64: string, wrappedVaultKeyB64: string, keyId: string, userId: string) {
  const ephemeralPublicKey = fromBase64(ephemeralPublicKeyB64, 65)
  const ephemeral = await importPublicKey(ephemeralPublicKey)
  const shared = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: ephemeral }, privateKey, 256))
  const info = grantInfo(keyId, userId)
  const kek = await hkdf(shared, concatBytes(ephemeralPublicKey, ownPublicKey), info)
  wipe(shared)
  const vaultKey = await open(await aesKey(kek, ['decrypt']), fromBase64(wrappedVaultKeyB64, 12 + 32 + 16), info, 'integrity', 'L’accesso alla cassaforte non è valido. Chiedi a un membro di concederlo di nuovo.')
  wipe(kek)
  if (vaultKey.length !== 32) throw new VaultCryptoError('integrity', 'Chiave della cassaforte non valida.')
  return vaultKey
}

// ── Field encryption ────────────────────────────────────────────────────────

export interface FieldKey {
  keyId: string
  key: CryptoKey
}

export async function importFieldKey(vaultKey: Uint8Array, keyId: string): Promise<FieldKey> {
  return { keyId: normalizeUuid(keyId), key: await aesKey(vaultKey) }
}

function fieldAad(keyId: string, rowId: string, field: VaultField) {
  return `aksuite.vault.v1|${keyId}|passwords|${normalizeUuid(rowId)}|${field}`
}

export function isVaultEnvelope(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(FIELD_PREFIX)
}

export async function encryptField(fieldKey: FieldKey, rowId: string, field: VaultField, plaintext: string) {
  const sealed = await seal(fieldKey.key, encoder.encode(plaintext), fieldAad(fieldKey.keyId, rowId, field))
  return `${FIELD_PREFIX}${fieldKey.keyId}.${toBase64(sealed)}`
}

export async function decryptField(fieldKey: FieldKey, rowId: string, field: VaultField, envelope: string) {
  const parts = envelope.split('.')
  if (parts.length !== 3 || `${parts[0]}.` !== FIELD_PREFIX) throw new VaultCryptoError('invalid-format', 'Formato cifrato non riconosciuto.')
  const keyId = normalizeUuid(parts[1])
  if (keyId !== fieldKey.keyId) throw new VaultCryptoError('unknown-key', 'Questa voce è cifrata con una chiave diversa da quella della cassaforte.')
  const plain = await open(fieldKey.key, fromBase64(parts[2]), fieldAad(keyId, rowId, field), 'integrity', 'Verifica di integrità fallita: il dato cifrato è stato alterato o non appartiene a questa voce.')
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(plain)
  } catch {
    throw new VaultCryptoError('integrity', 'Il dato decifrato non è testo valido.')
  }
}

// ── Legacy (pre-vault) values ───────────────────────────────────────────────

// Legacy web stored btoa(password); legacy native stored base64(UTF-8). Non-base64 values were plaintext.
export function decodeLegacySecret(value: string | null | undefined): string {
  if (!value) return ''
  if (isVaultEnvelope(value)) throw new VaultCryptoError('invalid-format', 'Valore cifrato v1 trattato come legacy.')
  if (!BASE64_PATTERN.test(value)) return value
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return binary
  }
}
