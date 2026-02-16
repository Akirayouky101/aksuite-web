'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface TimelineEntry {
  id: string
  lavorazione_id: string
  user_id: string
  description: string
  event_type: 'nota' | 'chiamata_cliente' | 'presa_in_carico' | 'sopralluogo' | 'lavoro_in_corso' | 'consegna' | 'materiale' | 'problema' | 'completamento' | 'altro'
  created_by_name: string
  image_url: string | null
  created_at: string
}

export const EVENT_TYPES = {
  nota: { label: 'Nota', emoji: '📝' },
  chiamata_cliente: { label: 'Chiamata Cliente', emoji: '📞' },
  presa_in_carico: { label: 'Presa in Carico', emoji: '✋' },
  sopralluogo: { label: 'Sopralluogo', emoji: '🔍' },
  lavoro_in_corso: { label: 'Lavoro in Corso', emoji: '🔧' },
  consegna: { label: 'Consegna', emoji: '📦' },
  materiale: { label: 'Materiale', emoji: '🧱' },
  problema: { label: 'Problema', emoji: '⚠️' },
  completamento: { label: 'Completamento', emoji: '✅' },
  altro: { label: 'Altro', emoji: '📌' },
} as const

export function useLavorazioneTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadTimeline = useCallback(async (lavorazioneId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lavorazioni_timeline')
        .select('*')
        .eq('lavorazione_id', lavorazioneId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading timeline:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addEntry = async (entry: {
    lavorazione_id: string
    description: string
    event_type: TimelineEntry['event_type']
    created_by_name: string
    image_url?: string | null
  }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('lavorazioni_timeline')
      .insert([{ ...entry, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error
    setEntries(prev => [...prev, data])
    return data
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('lavorazioni_timeline')
      .delete()
      .eq('id', id)

    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const updateEntry = async (id: string, updates: { description?: string; event_type?: TimelineEntry['event_type']; created_by_name?: string }) => {
    const { data, error } = await supabase
      .from('lavorazioni_timeline')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setEntries(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const clearTimeline = () => {
    setEntries([])
  }

  const uploadPhoto = async (file: File, lavorazioneId: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${lavorazioneId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('timeline-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('timeline-photos').getPublicUrl(fileName)
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  return {
    entries,
    loading,
    loadTimeline,
    addEntry,
    deleteEntry,
    updateEntry,
    uploadPhoto,
    clearTimeline
  }
}
