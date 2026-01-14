import { useState, useEffect } from 'react'

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

  // Load passwords from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ak-passwords')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPasswords(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })))
      } catch (error) {
        console.error('Error loading passwords:', error)
      }
    }
    setIsLoading(false)
  }, [])

  // Save passwords to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('ak-passwords', JSON.stringify(passwords))
    }
  }, [passwords, isLoading])

  const addPassword = (password: Omit<Password, 'id' | 'createdAt'>) => {
    const newPassword: Password = {
      ...password,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    setPasswords(prev => [...prev, newPassword])
    return newPassword
  }

  const updatePassword = (id: string, updates: Partial<Password>) => {
    setPasswords(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }

  const deletePassword = (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id))
  }

  const getPasswordsByCategory = (category: string) => {
    return passwords.filter(p => p.category === category)
  }

  return {
    passwords,
    isLoading,
    addPassword,
    updatePassword,
    deletePassword,
    getPasswordsByCategory,
  }
}
