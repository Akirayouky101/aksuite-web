'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CallTimelineEntry {
  id: string
  call_id: string
  user_id: string
  description: string
  event_type: 'nota' | 'richiamata' | 'risposta_cliente' | 'preventivo_inviato' | 'sopralluogo' | 'appuntamento' | 'ordine' | 'problema' | 'completamento' | 'altro'
  created_by_name: string
  image_url: string | null
  created_at: string
}

export const CALL_EVENT_TYPES = {
  nota: { label: 'Nota', emoji: '\u{1F4DD}' },
  richiamata: { label: 'Richiamata', emoji: '\u{1F4DE}' },
  risposta_cliente: { label: 'Risposta Cliente', emoji: '\u{1F4AC}' },
  preventivo_inviato: { label: 'Preventivo Inviato', emoji: '\u{1F4E7}' },
  sopralluogo: { label: 'Sopralluogo', emoji: '\u{1F50D}' },
  appuntamento: { label: 'Appuntamento', emoji: '\u{1F4C5}' },
  ordine: { label: 'Ordine', emoji: '\u{1F4E6}' },
  problema: { label: 'Problema', emoji: '\u{26A0}\uFE0F' },
  completamento: { label: 'Completamento', emoji: '\u{2705}' },
  altro: { label: 'Altro', emoji: '\u{1F4CC}' },
} as const

export function useCallTimeline() {
  const [entries, setEntries] = useState<CallTimelineEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadTimeline = useCallback(async (callId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calls_timeline')
        .select('*')
        .eq('call_id', callId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading call timeline:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addEntry = async (entry: {
    call_id: string
    description: string
    event_type: CallTimelineEntry['event_type']
    created_by_name: string
    image_url?: string | null
  }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('calls_timeline')
      .insert([{ ...entry, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error
    setEntries(prev => [...prev, data])
    return data
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('calls_timeline')
      .delete()
      .eq('id', id)

    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const updateEntry = async (id: string, updates: { description?: string; event_type?: CallTimelineEntry['event_type']; created_by_name?: string }) => {
    const { data, error } = await supabase
      .from('calls_timeline')
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

  const uploadPhoto = async (file: File, callId: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()
      const fileName = `calls/${callId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
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
