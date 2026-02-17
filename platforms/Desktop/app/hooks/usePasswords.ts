import { useState, useEffect } from 'react'
import { supabase, encryptPassword, decryptPassword } from '@/lib/supabase'
import { useAuth } from './useAuth'

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
}

export function usePasswords() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Load passwords from Supabase or localStorage
  useEffect(() => {
    const loadPasswords = async () => {
      if (user) {
        // Load from Supabase if authenticated
        const { data, error } = await supabase
          .from('passwords')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading passwords:', error)
        } else if (data) {
          const decryptedPasswords = await Promise.all(
            data.map(async (p) => ({
              id: p.id,
              title: p.title,
              username: p.username,
              password: await decryptPassword(p.encrypted_password),
              website: p.website || '',
              category: p.category,
              emoji: p.emoji,
              notes: p.notes,
              isFavorite: p.is_favorite,
              pin_code: p.pin_code || '',
              createdAt: new Date(p.created_at),
            }))
          )
          setPasswords(decryptedPasswords)
        }
      } else {
        // Fallback to localStorage if not authenticated
        const stored = localStorage.getItem('ak-passwords')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setPasswords(parsed.map((p: any) => ({
              ...p,
              createdAt: new Date(p.createdAt)
            })))
          } catch (error) {
            console.error('Error loading passwords from localStorage:', error)
          }
        }
      }
      setIsLoading(false)
    }

    loadPasswords()
  }, [user?.id])

  // Save to localStorage as backup
  useEffect(() => {
    if (!isLoading && !user) {
      localStorage.setItem('ak-passwords', JSON.stringify(passwords))
    }
  }, [passwords, isLoading, user?.id])

  const addPassword = async (password: Omit<Password, 'id' | 'createdAt'>) => {
    if (user) {
      // Save to Supabase
      const encryptedPwd = await encryptPassword(password.password)
      const { data, error} = await supabase
        .from('passwords')
        .insert({
          user_id: user.id,
          title: password.title,
          username: password.username,
          encrypted_password: encryptedPwd,
          website: password.website,
          category: password.category,
          emoji: password.emoji,
          notes: password.notes || null,
          is_favorite: password.isFavorite || false,
          pin_code: password.pin_code || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving password:', error)
        return null
      }

      const newPassword: Password = {
        id: data.id,
        title: data.title,
        username: data.username,
        password: password.password,
        website: data.website || '',
        category: data.category,
        emoji: data.emoji,
        notes: data.notes,
        isFavorite: data.is_favorite,
        pin_code: data.pin_code || '',
        createdAt: new Date(data.created_at),
      }
      setPasswords(prev => [newPassword, ...prev])
      return newPassword
    } else {
      // Save to localStorage
      const newPassword: Password = {
        ...password,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }
      setPasswords(prev => [newPassword, ...prev])
      return newPassword
    }
  }

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    if (user) {
      const updateData: any = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.username !== undefined) updateData.username = updates.username
      if (updates.password) updateData.encrypted_password = await encryptPassword(updates.password)
      if (updates.website !== undefined) updateData.website = updates.website
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji
      if (updates.notes !== undefined) updateData.notes = updates.notes || null
      if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite
      if (updates.pin_code !== undefined) updateData.pin_code = updates.pin_code || null
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('passwords')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating password:', error)
        return
      }
    }
    
    setPasswords(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }

  const deletePassword = async (id: string) => {
    if (user) {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting password:', error)
        return
      }
    }
    
    setPasswords(prev => prev.filter(p => p.id !== id))
  }

  const getPasswordsByCategory = (category: string) => {
    return passwords.filter(p => p.category === category)
  }

  return {
    passwords,
    isLoading,
    user,
    addPassword,
    updatePassword,
    deletePassword,
    getPasswordsByCategory,
  }
}
