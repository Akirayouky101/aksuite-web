'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface BudgetLimit {
  id: string
  user_id: string
  category: string
  limit_amount: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  alert_threshold: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BudgetLimitStatus extends BudgetLimit {
  current_spending: number
  percentage_used: number
  status: 'ok' | 'warning' | 'exceeded'
  remaining_amount: number
}

export function useBudgetLimits() {
  const [limits, setLimits] = useState<BudgetLimit[]>([])
  const [limitsStatus, setLimitsStatus] = useState<BudgetLimitStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Load budget limits
  const loadLimits = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLimits([])
        setLimitsStatus([])
        return
      }

      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })

      if (error) throw error
      setLimits(data || [])
      
      // Load status for all limits
      await loadLimitsStatus()
    } catch (error) {
      console.error('Error loading budget limits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load limits with current status
  const loadLimitsStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.rpc('get_all_budget_limits_status', {
        p_user_id: user.id
      })

      if (error) throw error
      setLimitsStatus(data || [])
    } catch (error) {
      console.error('Error loading limits status:', error)
    }
  }

  // Add budget limit
  const addLimit = async (limit: Omit<BudgetLimit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('budget_limits')
        .insert([{ ...limit, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      
      setLimits(prev => [...prev, data])
      await loadLimitsStatus()
      return data
    } catch (error) {
      console.error('Error adding budget limit:', error)
      throw error
    }
  }

  // Update budget limit
  const updateLimit = async (id: string, updates: Partial<BudgetLimit>) => {
    try {
      const { error } = await supabase
        .from('budget_limits')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setLimits(prev =>
        prev.map(l => l.id === id ? { ...l, ...updates } : l)
      )
      await loadLimitsStatus()
    } catch (error) {
      console.error('Error updating budget limit:', error)
      throw error
    }
  }

  // Toggle active status
  const toggleActive = async (id: string) => {
    try {
      const limit = limits.find(l => l.id === id)
      if (!limit) return

      const { error } = await supabase
        .from('budget_limits')
        .update({ is_active: !limit.is_active })
        .eq('id', id)

      if (error) throw error

      setLimits(prev =>
        prev.map(l => l.id === id ? { ...l, is_active: !l.is_active } : l)
      )
      await loadLimitsStatus()
    } catch (error) {
      console.error('Error toggling budget limit:', error)
      throw error
    }
  }

  // Delete budget limit
  const deleteLimit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_limits')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLimits(prev => prev.filter(l => l.id !== id))
      setLimitsStatus(prev => prev.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting budget limit:', error)
      throw error
    }
  }

  // Check specific category limit
  const checkCategoryLimit = async (category: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase.rpc('check_budget_limit_status', {
        p_user_id: user.id,
        p_category: category,
        p_period: period
      })

      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error checking category limit:', error)
      return null
    }
  }

  // Get alerts (limits in warning or exceeded status)
  const getAlerts = () => {
    return limitsStatus.filter(l => l.status === 'warning' || l.status === 'exceeded')
  }

  // Get exceeded limits
  const getExceeded = () => {
    return limitsStatus.filter(l => l.status === 'exceeded')
  }

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadLimits()
      } else {
        setLimits([])
        setLimitsStatus([])
      }
    })

    // Initial load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadLimits()
      else setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    limits,
    limitsStatus,
    isLoading,
    user,
    addLimit,
    updateLimit,
    deleteLimit,
    toggleActive,
    checkCategoryLimit,
    loadLimitsStatus,
    getAlerts,
    getExceeded
  }
}
