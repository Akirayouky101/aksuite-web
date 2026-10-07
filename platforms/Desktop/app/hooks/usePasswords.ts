import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { decodeLegacySecret, isVaultEnvelope } from '@/lib/passwordVault/crypto'
import { decryptVaultField, describeVaultError, encryptVaultField, isVaultUnlocked, refreshVault, usePasswordVault } from '@/lib/passwordVault/store'
import { useAuth } from './useAuth'

// legacy: old Base64/plaintext row (readable, not yet migrated); decrypted: v1 row opened with the vault key;
// locked: v1 row while the vault is locked; error: v1 row that failed authentication/decryption (never shown).
export type PasswordSecretStatus = 'legacy' | 'decrypted' | 'locked' | 'error'

export interface Password {
  id: string
  title: string
  username: string
  password: string
  website: string
  category: string
  createdAt: Date
  emoji: string
  notes?: string
  isFavorite?: boolean
  pin_code?: string
  hasPin?: boolean
  secretStatus?: PasswordSecretStatus
  isLegacy?: boolean
}

export interface PasswordCategory {
  id: string
  name: string
  parent_id: string | null
}

interface PasswordRow {
  id: string
  title: string
  username: string
  encrypted_password: string
  website: string | null
  category: string
  emoji: string
  notes: string | null
  is_favorite: boolean | null
  pin_code: string | null
  encrypted_pin_code?: string | null
  vault_format?: number | null
  created_at: string
}

function isV1Row(row: PasswordRow) {
  return row.vault_format === 1 || (row.vault_format == null && isVaultEnvelope(row.encrypted_password))
}

async function toPassword(row: PasswordRow, unlocked: boolean): Promise<Password> {
  const base = {
    id: row.id,
    title: row.title,
    username: row.username,
    website: row.website || '',
    category: row.category,
    emoji: row.emoji,
    notes: row.notes || undefined,
    isFavorite: Boolean(row.is_favorite),
    createdAt: new Date(row.created_at),
  }
  if (!isV1Row(row)) {
    const pin = row.pin_code || ''
    return { ...base, password: decodeLegacySecret(row.encrypted_password), pin_code: pin, hasPin: Boolean(pin), secretStatus: 'legacy', isLegacy: true }
  }
  const hasPin = Boolean(row.encrypted_pin_code)
  if (!unlocked) return { ...base, password: '', pin_code: '', hasPin, secretStatus: 'locked', isLegacy: false }
  try {
    const password = await decryptVaultField(row.id, 'password', row.encrypted_password)
    const pin = row.encrypted_pin_code ? await decryptVaultField(row.id, 'pin', row.encrypted_pin_code) : ''
    return { ...base, password, pin_code: pin, hasPin, secretStatus: 'decrypted', isLegacy: false }
  } catch {
    return { ...base, password: '', pin_code: '', hasPin, secretStatus: 'error', isLegacy: false }
  }
}

export function usePasswords(enabled = true) {
  const [rows, setRows] = useState<PasswordRow[]>([])
  const [passwords, setPasswords] = useState<Password[]>([])
  const [categories, setCategories] = useState<PasswordCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const vault = usePasswordVault()
  const vaultUnlocked = vault.status === 'unlocked' && vault.userId === user?.id

  useEffect(() => {
    if (!enabled) return
    void refreshVault(user?.id ?? null)
  }, [user?.id, enabled])

  // Legacy unauthenticated localStorage storage ("ak-passwords") is intentionally no longer read or written:
  // it held plaintext secrets. Existing browser data is left untouched.
  useEffect(() => {
    let active = true
    if (!enabled) { setRows([]); setPasswords([]); setCategories([]); setIsLoading(true); return }
    const loadPasswords = async () => {
      setRows([]); setPasswords([]); setCategories([])
      setIsLoading(true)
      if (user) {
        const { data, error } = await supabase
          .from('passwords')
          .select('*')
          .order('created_at', { ascending: false })
        if (!active) return
        if (error) console.error('Error loading passwords:', error.code || error.message)
        else if (data) setRows(data as PasswordRow[])

        const { data: categoryData, error: categoryError } = await supabase
          .from('password_categories')
          .select('id, name, parent_id')
          .order('name')
        if (categoryError && categoryError.code !== '42P01') console.error('Error loading password categories:', categoryError)
        if (active && categoryData) setCategories(categoryData)
      }
      if (active) setIsLoading(false)
    }

    loadPasswords()
    return () => { active = false }
  }, [user?.id, enabled, vault.dataVersion])

  useEffect(() => {
    let active = true
    Promise.all(rows.map(row => toPassword(row, vaultUnlocked && isVaultUnlocked()))).then(next => {
      if (active) setPasswords(next)
    })
    return () => { active = false }
  }, [rows, vaultUnlocked])

  const replaceRow = (row: PasswordRow) => setRows(prev => prev.some(item => item.id === row.id) ? prev.map(item => item.id === row.id ? row : item) : [row, ...prev])

  const requireUser = () => {
    if (!user) throw new Error('Accedi per gestire le password.')
    return user
  }

  const requireVault = () => {
    if (!isVaultUnlocked()) throw new Error('Sblocca la cassaforte con la master password per salvare le credenziali.')
  }

  const addPassword = async (password: Omit<Password, 'id' | 'createdAt'>) => {
    const currentUser = requireUser()
    requireVault()
    const id = globalThis.crypto.randomUUID().toLowerCase()
    let encryptedPassword: string, encryptedPin: string | null
    try {
      encryptedPassword = await encryptVaultField(id, 'password', password.password || '')
      encryptedPin = password.pin_code ? await encryptVaultField(id, 'pin', password.pin_code) : null
    } catch (error) {
      throw new Error(describeVaultError(error, 'cifrare la password'))
    }
    const { data, error } = await supabase
      .from('passwords')
      .insert({
        id,
        user_id: currentUser.id,
        title: password.title,
        username: password.username,
        encrypted_password: encryptedPassword,
        encrypted_pin_code: encryptedPin,
        pin_code: null,
        vault_format: 1,
        website: password.website,
        category: password.category,
        emoji: password.emoji,
        notes: password.notes || null,
        is_favorite: password.isFavorite || false,
      })
      .select()
      .single()
    if (error) {
      console.error('Error saving password:', error.code || error.message)
      throw new Error(describeVaultError(error, 'salvare la password'))
    }
    replaceRow(data as PasswordRow)
    return toPassword(data as PasswordRow, isVaultUnlocked())
  }

  // Any change to the password or PIN re-encrypts both secrets in format v1. This is also how a
  // legacy row gets upgraded when it is edited explicitly.
  const updatePassword = async (id: string, updates: Partial<Password>) => {
    requireUser()
    const current = passwords.find(item => item.id === id)
    const updateData: Record<string, unknown> = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.username !== undefined) updateData.username = updates.username
    if (updates.website !== undefined) updateData.website = updates.website
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.emoji !== undefined) updateData.emoji = updates.emoji
    if (updates.notes !== undefined) updateData.notes = updates.notes || null
    if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite
    if (updates.password !== undefined || updates.pin_code !== undefined) {
      requireVault()
      if (!current || (current.secretStatus !== 'decrypted' && current.secretStatus !== 'legacy')) {
        throw new Error('Questa credenziale non è leggibile: sbloccala o ricarica prima di modificarla.')
      }
      const nextPassword = updates.password !== undefined ? updates.password : current.password
      const nextPin = updates.pin_code !== undefined ? updates.pin_code : current.pin_code
      try {
        updateData.encrypted_password = await encryptVaultField(id, 'password', nextPassword || '')
        updateData.encrypted_pin_code = nextPin ? await encryptVaultField(id, 'pin', nextPin) : null
      } catch (error) {
        throw new Error(describeVaultError(error, 'cifrare la password'))
      }
      updateData.pin_code = null
      updateData.vault_format = 1
    }
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('passwords')
      .update(updateData)
      .eq('id', id)
      .select()
    if (error) {
      console.error('Error updating password:', error.code || error.message)
      throw new Error(describeVaultError(error, 'aggiornare la password'))
    }
    if (!data || data.length !== 1) throw new Error('La credenziale non esiste più o non hai i permessi per modificarla.')
    replaceRow(data[0] as PasswordRow)
  }

  const deletePassword = async (id: string) => {
    if (user) {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting password:', error.code || error.message)
        return
      }
    }
    setRows(prev => prev.filter(p => p.id !== id))
  }

  const getPasswordsByCategory = (category: string) => {
    return passwords.filter(p => p.category === category)
  }

  const addCategory = async (name: string, parentId: string | null = null) => {
    const cleanName = name.trim()
    if (!cleanName) return null
    if (user) {
      const { data, error } = await supabase
        .from('password_categories')
        .insert({ user_id: user.id, name: cleanName, parent_id: parentId })
        .select('id, name, parent_id')
        .single()
      if (error) {
        console.error('Error saving password category:', error)
        return null
      }
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    }
    const category = { id: crypto.randomUUID(), name: cleanName, parent_id: parentId }
    setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
    return category
  }

  const updateCategory = async (id: string, name: string) => {
    const cleanName = name.trim()
    if (!cleanName) return false
    const category = categories.find(item => item.id === id)
    if (!category) return false
    const oldPath = (() => {
      const path: string[] = []
      let current: PasswordCategory | undefined = category
      while (current) {
        path.unshift(current.name)
        current = current.parent_id ? categories.find(item => item.id === current?.parent_id) : undefined
      }
      return path.join(' / ')
    })()
    const newPath = (() => {
      const parent = category.parent_id ? categories.find(item => item.id === category.parent_id) : null
      const parentPath = parent ? categories.reduce<string[]>((path, item) => {
        let current: PasswordCategory | undefined = item
        const names: string[] = []
        while (current) {
          names.unshift(current.name)
          current = current.parent_id ? categories.find(parentItem => parentItem.id === current?.parent_id) : undefined
        }
        return item.id === parent.id ? names : path
      }, []).join(' / ') : ''
      return parentPath ? `${parentPath} / ${cleanName}` : cleanName
    })()

    if (user) {
      const { error } = await supabase.from('password_categories').update({ name: cleanName }).eq('id', id)
      if (error) {
        console.error('Error updating password category:', error)
        return false
      }
      const affected = passwords.filter(password => password.category === oldPath || password.category.startsWith(`${oldPath} / `))
      await Promise.all(affected.map(password => supabase.from('passwords').update({ category: password.category.replace(oldPath, newPath), updated_at: new Date().toISOString() }).eq('id', password.id)))
    }
    setCategories(prev => prev.map(item => item.id === id ? { ...item, name: cleanName } : item))
    setRows(prev => prev.map(row => row.category === oldPath || row.category.startsWith(`${oldPath} / `) ? { ...row, category: row.category.replace(oldPath, newPath) } : row))
    return true
  }

  const deleteCategory = async (id: string) => {
    const category = categories.find(item => item.id === id)
    if (!category) return false
    const descendantIds: string[] = [id]
    for (let index = 0; index < descendantIds.length; index++) {
      const parentId = descendantIds[index]
      categories.filter(item => item.parent_id === parentId).forEach(item => {
        if (!descendantIds.includes(item.id)) descendantIds.push(item.id)
      })
    }
    const paths = categories.filter(item => descendantIds.includes(item.id)).map(item => {
      const path: string[] = []
      let current: PasswordCategory | undefined = item
      while (current) {
        path.unshift(current.name)
        current = current.parent_id ? categories.find(parent => parent.id === current?.parent_id) : undefined
      }
      return path.join(' / ')
    })
    const affected = passwords.filter(password => paths.some(path => password.category === path || password.category.startsWith(`${path} / `)))
    if (user) {
      await Promise.all(affected.map(password => supabase.from('passwords').update({ category: '', updated_at: new Date().toISOString() }).eq('id', password.id)))
      const { error } = await supabase.from('password_categories').delete().eq('id', id)
      if (error) {
        console.error('Error deleting password category:', error)
        return false
      }
    }
    setRows(prev => prev.map(row => affected.some(item => item.id === row.id) ? { ...row, category: '' } : row))
    setCategories(prev => prev.filter(item => !descendantIds.includes(item.id)))
    return true
  }

  return {
    passwords,
    categories,
    isLoading,
    user,
    vault,
    addPassword,
    updatePassword,
    deletePassword,
    getPasswordsByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
