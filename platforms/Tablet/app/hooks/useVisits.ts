'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

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
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setVisits([]); setLoading(false); return }
    let mounted = true
    const fetchVisits = async () => {
      try {
        const { data, error } = await supabase
          .from('visits')
          .select('*')
          .order('visit_date', { ascending: false })
        if (error) throw error
        if (mounted) setVisits(data || [])
      } catch (error) {
        console.error('Error fetching visits:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchVisits()
    return () => { mounted = false }
  }, [user?.id])

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
      logActivity('create', 'visit', data.visitor_name || '', data.company || '')
    }
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
      logActivity('update', 'visit', data.visitor_name || '', '')
    }

    return data
  }

  const deleteVisit = async (id: string) => {
    const visitToDelete = visits.find(v => v.id === id)
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)

    if (error) throw error
    setVisits(prev => prev.filter(visit => visit.id !== id))
    logActivity('delete', 'visit', visitToDelete?.visitor_name || '', '')
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
