'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Lavorazione {
  id: string
  user_id: string
  call_id: string | null
  title: string
  description: string
  assigned_to: string
  scheduled_date: string | null
  scheduled_time: string | null
  status: 'da_fare' | 'in_corso' | 'completata' | 'annullata'
  priority: string
  address: string
  city: string
  zip_code: string
  province: string
  notes: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function useLavorazioni() {
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadLavorazioni(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadLavorazioni(session.user.id)
      } else {
        setLavorazioni([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadLavorazioni = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('lavorazioni')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setLavorazioni(data || [])
    } catch (error) {
      console.error('Error loading lavorazioni:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLavorazione = async (lavorazioneData: Omit<Lavorazione, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('lavorazioni')
      .insert([{ ...lavorazioneData, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    setLavorazioni(prev => [data, ...prev])
    return data
  }

  const updateLavorazione = async (id: string, updates: Partial<Lavorazione>) => {
    const { data, error } = await supabase
      .from('lavorazioni')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setLavorazioni(prev => prev.map(l => l.id === id ? data : l))
    return data
  }

  const deleteLavorazione = async (id: string) => {
    const { error } = await supabase
      .from('lavorazioni')
      .delete()
      .eq('id', id)

    if (error) throw error
    setLavorazioni(prev => prev.filter(l => l.id !== id))
  }

  const toggleStatus = async (id: string) => {
    const lavorazione = lavorazioni.find(l => l.id === id)
    if (!lavorazione) return

    const nextStatus: Record<string, string> = {
      da_fare: 'in_corso',
      in_corso: 'completata',
      completata: 'da_fare',
      annullata: 'da_fare'
    }

    const newStatus = nextStatus[lavorazione.status] || 'da_fare'
    const completedAt = newStatus === 'completata' ? new Date().toISOString() : null

    await updateLavorazione(id, {
      status: newStatus as Lavorazione['status'],
      completed_at: completedAt
    })
  }

  return {
    lavorazioni,
    loading,
    addLavorazione,
    updateLavorazione,
    deleteLavorazione,
    toggleStatus
  }
}
