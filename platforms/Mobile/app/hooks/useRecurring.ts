'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface RecurringTransaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  emoji: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  day_of_month?: number
  day_of_week?: number
  next_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useRecurring() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Load recurring transactions
  const loadRecurring = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setRecurring([])
        return
      }

      const { data, error } = await supabase
        .from('budget_recurring')
        .select('*')
        .eq('user_id', user.id)
        .order('next_date', { ascending: true })

      if (error) throw error
      setRecurring(data || [])
    } catch (error) {
      console.error('Error loading recurring transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add recurring transaction
  const addRecurring = async (transaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('budget_recurring')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      
      setRecurring(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding recurring transaction:', error)
      throw error
    }
  }

  // Toggle active status
  const toggleActive = async (id: string) => {
    try {
      const transaction = recurring.find(t => t.id === id)
      if (!transaction) return

      const { error } = await supabase
        .from('budget_recurring')
        .update({ is_active: !transaction.is_active })
        .eq('id', id)

      if (error) throw error

      setRecurring(prev => 
        prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t)
      )
    } catch (error) {
      console.error('Error toggling recurring transaction:', error)
      throw error
    }
  }

  // Delete recurring transaction
  const deleteRecurring = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_recurring')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRecurring(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
      throw error
    }
  }

  // Update recurring transaction
  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      const { error } = await supabase
        .from('budget_recurring')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setRecurring(prev =>
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      )
    } catch (error) {
      console.error('Error updating recurring transaction:', error)
      throw error
    }
  }

  // Process recurring transactions (generate new transactions)
  const processRecurring = async () => {
    try {
      const { error } = await supabase.rpc('process_recurring_transactions')
      if (error) throw error
      await loadRecurring() // Reload to get updated next_date
    } catch (error) {
      console.error('Error processing recurring transactions:', error)
      throw error
    }
  }

  // Get next occurrence date based on frequency
  const getNextDate = (frequency: RecurringTransaction['frequency'], dayOfMonth?: number, dayOfWeek?: number): string => {
    const now = new Date()
    let nextDate = new Date()

    switch (frequency) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1)
        break
      case 'weekly':
        if (dayOfWeek !== undefined) {
          const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7
          nextDate.setDate(now.getDate() + daysUntilNext)
        } else {
          nextDate.setDate(now.getDate() + 7)
        }
        break
      case 'monthly':
        if (dayOfMonth !== undefined) {
          nextDate.setMonth(now.getMonth() + 1)
          nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()))
        } else {
          nextDate.setMonth(now.getMonth() + 1)
        }
        break
      case 'yearly':
        nextDate.setFullYear(now.getFullYear() + 1)
        if (dayOfMonth !== undefined) {
          nextDate.setDate(dayOfMonth)
        }
        break
    }

    return nextDate.toISOString().split('T')[0]
  }

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadRecurring()
      } else {
        setRecurring([])
      }
    })

    // Initial load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadRecurring()
      else setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    recurring,
    isLoading,
    user,
    addRecurring,
    deleteRecurring,
    updateRecurring,
    toggleActive,
    processRecurring,
    getNextDate,
    loadRecurring
  }
}
