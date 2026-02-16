'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Visit {
  id: string
  user_id: string
  visitor_name: string
  company: string
  phone: string
  email: string
  visit_type: string
  priority: string
  visit_date: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchVisits(user.id)
    } else {
      setLoading(false)
    }
  }

  const fetchVisits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .order('visit_date', { ascending: false })

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error('Error fetching visits:', error)
    } finally {
      setLoading(false)
    }
  }

  const addVisit = async (visitData: Omit<Visit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('visits')
      .insert([{ ...visitData, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    
    if (data) {
      setVisits(prev => [data, ...prev])
    }
    
    return data
  }

  const updateVisit = async (id: string, updates: Partial<Omit<Visit, 'id' | 'user_id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('visits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (data) {
      setVisits(prev => prev.map(visit => visit.id === id ? data : visit))
    }

    return data
  }

  const deleteVisit = async (id: string) => {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)

    if (error) throw error
    setVisits(prev => prev.filter(visit => visit.id !== id))
  }

  const updateVisitStatus = async (id: string, status: Visit['status']) => {
    return updateVisit(id, { status })
  }

  return {
    visits,
    user,
    loading,
    addVisit,
    updateVisit,
    deleteVisit,
    updateVisitStatus
  }
}
