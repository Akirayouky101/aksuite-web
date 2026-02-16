'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  address: string
  city: string
  zip_code: string
  province: string
  assigned_to: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'in_corso' | 'completed' | 'cancelled'
  call_date: string
  user_id: string
  created_at: string
}

export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setCalls([]); setLoading(false); return }
    let mounted = true
    const loadCalls = async () => {
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', user.id)
          .order('call_date', { ascending: false })
        if (error) throw error
        if (mounted) setCalls(data || [])
      } catch (error) {
        console.error('Error loading calls:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadCalls()
    return () => { mounted = false }
  }, [user?.id])

  const addCall = async (callData: Omit<Call, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('calls')
      .insert([{ ...callData, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    if (data) {
      setCalls(prev => [data, ...prev])
      return data
    }
    return null
  }

  const deleteCall = async (id: string) => {
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', id)

    if (error) throw error
    setCalls(prev => prev.filter(call => call.id !== id))
  }

  const updateCallStatus = async (id: string, status: Call['status']) => {
    const { error } = await supabase
      .from('calls')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    setCalls(prev => prev.map(call => 
      call.id === id ? { ...call, status } : call
    ))
  }

  const updateCall = async (id: string, updates: Partial<Omit<Call, 'id' | 'user_id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (data) {
      setCalls(prev => prev.map(call => 
        call.id === id ? data : call
      ))
    }
  }

  return {
    calls,
    user,
    loading,
    addCall,
    deleteCall,
    updateCallStatus,
    updateCall
  }
}
