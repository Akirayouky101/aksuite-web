'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface PreventivoLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  product_id?: string
  sku?: string
}

export interface Preventivo {
  id: string
  user_id: string
  numero: string
  client_id: string | null
  lavorazione_id: string | null
  oggetto: string | null
  items: PreventivoLineItem[]
  subtotal: number
  sconto: number
  imponibile: number
  iva_percent: number
  iva_amount: number
  totale: number
  stato: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto'
  note: string | null
  data_preventivo: string
  validita: number
  created_at: string
  updated_at: string
}

export function usePreventivi() {
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setPreventivi([]); setLoading(false); return }
    let mounted = true
    const fetchPreventivi = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('preventivi')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) { console.warn('Fetch preventivi error:', error) }
        else if (data && mounted) setPreventivi(data)
      } catch (e) { console.warn('Preventivi table may not exist yet:', e) }
      if (mounted) setLoading(false)
    }
    fetchPreventivi()

    const channel = supabase
      .channel('preventivi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivi' },
        () => { if (mounted) fetchPreventivi() }
      ).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const addPreventivo = async (data: Omit<Preventivo, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Preventivo | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('preventivi')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add preventivo error:', error); return null }
    logActivity('create', 'preventivo', data.numero, `Nuovo preventivo: ${data.numero} - ${data.oggetto || ''} - €${data.totale.toFixed(2)}`)
    return newItem
  }

  const updatePreventivo = async (id: string, data: Partial<Preventivo>): Promise<void> => {
    const { error } = await supabase
      .from('preventivi')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('Update preventivo error:', error); return }
    logActivity('update', 'preventivo', data.numero || 'Preventivo', `Aggiornato preventivo`)
    setPreventivi(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }

  const deletePreventivo = async (id: string): Promise<void> => {
    const prev = preventivi.find(p => p.id === id)
    const { error } = await supabase.from('preventivi').delete().eq('id', id)
    if (error) { console.error('Delete preventivo error:', error); return }
    logActivity('delete', 'preventivo', prev?.numero || 'Preventivo', `Eliminato preventivo: ${prev?.numero || ''}`)
    setPreventivi(prev => prev.filter(p => p.id !== id))
  }

  const updateStato = async (id: string, stato: Preventivo['stato']): Promise<void> => {
    await updatePreventivo(id, { stato })
  }

  return { preventivi, loading, addPreventivo, updatePreventivo, deletePreventivo, updateStato }
}
