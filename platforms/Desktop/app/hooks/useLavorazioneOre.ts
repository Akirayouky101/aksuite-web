'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface OreEntry {
  id: string
  lavorazione_id: string
  user_id: string
  user_name: string
  work_date: string       // YYYY-MM-DD
  start_time: string      // HH:MM
  end_time: string        // HH:MM
  minutes: number
  notes: string
  created_at: string
}

export interface MaterialeEntry {
  id: string
  lavorazione_id: string
  user_id: string
  user_name: string
  product_id: string | null
  product_name: string
  product_sku: string
  quantity: number
  unit: string
  notes: string
  created_at: string
}

export function useLavorazioneOre() {
  const [oreEntries, setOreEntries] = useState<OreEntry[]>([])
  const [materialiEntries, setMaterialiEntries] = useState<MaterialeEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async (lavorazioneId: string) => {
    setLoading(true)
    const [{ data: ore }, { data: materiali }] = await Promise.all([
      supabase
        .from('lavorazione_ore')
        .select('*')
        .eq('lavorazione_id', lavorazioneId)
        .order('work_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase
        .from('lavorazione_materiali')
        .select('*')
        .eq('lavorazione_id', lavorazioneId)
        .order('created_at', { ascending: true }),
    ])
    setOreEntries((ore || []) as OreEntry[])
    setMaterialiEntries((materiali || []) as MaterialeEntry[])
    setLoading(false)
  }, [])

  const clearData = useCallback(() => {
    setOreEntries([])
    setMaterialiEntries([])
  }, [])

  const addOreEntry = useCallback(async (entry: Omit<OreEntry, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('lavorazione_ore')
      .insert(entry)
      .select()
      .single()
    if (!error && data) {
      setOreEntries(prev =>
        [...prev, data as OreEntry].sort(
          (a, b) => a.work_date.localeCompare(b.work_date) || a.start_time.localeCompare(b.start_time)
        )
      )
    }
    return { data, error }
  }, [])

  const deleteOreEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('lavorazione_ore').delete().eq('id', id)
    if (!error) setOreEntries(prev => prev.filter(e => e.id !== id))
    return !error
  }, [])

  const addMaterialeEntry = useCallback(async (entry: Omit<MaterialeEntry, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('lavorazione_materiali')
      .insert(entry)
      .select()
      .single()
    if (!error && data) setMaterialiEntries(prev => [...prev, data as MaterialeEntry])
    return { data, error }
  }, [])

  const deleteMaterialeEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('lavorazione_materiali').delete().eq('id', id)
    if (!error) setMaterialiEntries(prev => prev.filter(e => e.id !== id))
    return !error
  }, [])

  const totalMinutes = oreEntries.reduce((sum, e) => sum + (e.minutes || 0), 0)

  const minutesByPerson: Record<string, number> = {}
  for (const e of oreEntries) {
    const key = e.user_name || e.user_id
    minutesByPerson[key] = (minutesByPerson[key] || 0) + (e.minutes || 0)
  }

  return {
    oreEntries,
    materialiEntries,
    loading,
    loadData,
    clearData,
    addOreEntry,
    deleteOreEntry,
    addMaterialeEntry,
    deleteMaterialeEntry,
    totalMinutes,
    minutesByPerson,
  }
}
