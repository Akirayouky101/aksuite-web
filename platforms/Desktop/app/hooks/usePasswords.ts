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

export interface PasswordCategory {
  id: string
  name: string
  parent_id: string | null
}

export function usePasswords() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [categories, setCategories] = useState<PasswordCategory[]>([])
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

        const { data: categoryData, error: categoryError } = await supabase
          .from('password_categories')
          .select('id, name, parent_id')
          .order('name')
        if (categoryError && categoryError.code !== '42P01') console.error('Error loading password categories:', categoryError)
        if (categoryData) setCategories(categoryData)
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
    setPasswords(prev => prev.map(password => password.category === oldPath || password.category.startsWith(`${oldPath} / `) ? { ...password, category: password.category.replace(oldPath, newPath) } : password))
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
    setPasswords(prev => prev.map(password => affected.some(item => item.id === password.id) ? { ...password, category: '' } : password))
    setCategories(prev => prev.filter(item => !descendantIds.includes(item.id)))
    return true
  }

  return {
    passwords,
    categories,
    isLoading,
    user,
    addPassword,
    updatePassword,
    deletePassword,
    getPasswordsByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
