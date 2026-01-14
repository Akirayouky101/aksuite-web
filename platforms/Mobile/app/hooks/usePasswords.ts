import { useState, useEffect } from 'react'
import { supabase, encryptPassword, decryptPassword } from '@/lib/supabase'

export interface Password {
  id: string
  title: string
  username: string
  password: string
  website: string
  category: string
  createdAt: Date
  emoji: string
}

export function usePasswords() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
  }, [user])

  // Save to localStorage as backup
  useEffect(() => {
    if (!isLoading && !user) {
      localStorage.setItem('ak-passwords', JSON.stringify(passwords))
    }
  }, [passwords, isLoading, user])

  const addPassword = async (password: Omit<Password, 'id' | 'createdAt'>) => {
    if (user) {
      // Save to Supabase
      const encryptedPwd = await encryptPassword(password.password)
      const { data, error } = await supabase
        .from('passwords')
        .insert({
          user_id: user.id,
          title: password.title,
          username: password.username,
          encrypted_password: encryptedPwd,
          website: password.website,
          category: password.category,
          emoji: password.emoji,
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
      if (updates.title) updateData.title = updates.title
      if (updates.username) updateData.username = updates.username
      if (updates.password) updateData.encrypted_password = await encryptPassword(updates.password)
      if (updates.website) updateData.website = updates.website
      if (updates.category) updateData.category = updates.category
      if (updates.emoji) updateData.emoji = updates.emoji
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
