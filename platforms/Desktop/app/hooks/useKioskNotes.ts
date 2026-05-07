'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface KioskNote {
  id: string
  content: string
  author: string
  created_at: string
}

export function useKioskNotes() {
  const [notes, setNotes] = useState<KioskNote[]>([])
  const [loading, setLoading] = useState(false)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kiosk_notes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setNotes(data as KioskNote[])
    setLoading(false)
  }, [])

  const addNote = useCallback(async (content: string, author: string): Promise<boolean> => {
    const { error } = await supabase
      .from('kiosk_notes')
      .insert({ content, author })
    if (error) return false
    await loadNotes()
    return true
  }, [loadNotes])

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('kiosk_notes')
      .delete()
      .eq('id', id)
    if (error) return false
    await loadNotes()
    return true
  }, [loadNotes])

  const updateNote = useCallback(async (id: string, content: string): Promise<boolean> => {
    const { error } = await supabase
      .from('kiosk_notes')
      .update({ content })
      .eq('id', id)
    if (error) return false
    await loadNotes()
    return true
  }, [loadNotes])

  return { notes, loading, loadNotes, addNote, deleteNote, updateNote }
}
