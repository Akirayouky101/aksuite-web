'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  call_date: string
  user_id: string
  created_at: string
}

export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadCalls(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadCalls(session.user.id)
      } else {
        setCalls([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCalls = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('call_date', { ascending: false })

      if (error) throw error
      setCalls(data || [])
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
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

  return {
    calls,
    user,
    loading,
    addCall,
    deleteCall,
    updateCallStatus
  }
}
