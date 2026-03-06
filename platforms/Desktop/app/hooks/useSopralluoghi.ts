'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface Sopralluogo {
  id: string
  user_id: string
  client_id: string | null
  lavorazione_id: string | null
  titolo: string
  indirizzo: string
  citta: string
  data_prevista: string | null
  ora_prevista: string | null
  stato: 'da_fare' | 'in_corso' | 'completato' | 'annullato'
  note: string
  risultato: string
  created_at: string
  updated_at: string
}

export function useSopralluoghi() {
  const [sopralluoghi, setSopralluoghi] = useState<Sopralluogo[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setSopralluoghi([]); setLoading(false); return }
    let mounted = true
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('sopralluoghi')
          .select('*')
          .order('data_prevista', { ascending: true })
        if (error) throw error
        if (mounted) setSopralluoghi(data || [])
      } catch (err) {
        console.error('Error fetching sopralluoghi:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [user?.id])

  const addSopralluogo = async (data: Omit<Sopralluogo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')
    const { data: created, error } = await supabase
      .from('sopralluoghi')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setSopralluoghi(prev => [created, ...prev])
    logActivity('create', 'sopralluogo', created.titolo || '', created.indirizzo || '')
    return created
  }

  const updateSopralluogo = async (id: string, updates: Partial<Omit<Sopralluogo, 'id' | 'user_id' | 'created_at'>>) => {
    const { data: updated, error } = await supabase
      .from('sopralluoghi')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setSopralluoghi(prev => prev.map(s => s.id === id ? updated : s))
    logActivity('update', 'sopralluogo', updated.titolo || '', '')
    return updated
  }

  const deleteSopralluogo = async (id: string) => {
    const toDelete = sopralluoghi.find(s => s.id === id)
    const { error } = await supabase.from('sopralluoghi').delete().eq('id', id)
    if (error) throw error
    setSopralluoghi(prev => prev.filter(s => s.id !== id))
    logActivity('delete', 'sopralluogo', toDelete?.titolo || '', '')
  }

  const updateStato = async (id: string, stato: Sopralluogo['stato']) => {
    return updateSopralluogo(id, { stato })
  }

  return { sopralluoghi, loading, addSopralluogo, updateSopralluogo, deleteSopralluogo, updateStato }
}
