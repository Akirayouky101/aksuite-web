'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface ListaLavorazioneItem {
  id: string
  lista_id: string
  product_id: string | null
  product_name: string
  product_sku: string
  product_category: string
  quantity: number
  unit: string
  unit_price: number
  notes: string
  created_at: string
}

export interface ListaLavorazioneUser {
  id: string
  lista_id: string
  user_id: string
  user_name: string
  role: string
}

export interface ListaLavorazione {
  id: string
  user_id: string
  title: string
  description: string
  client_id: string | null
  lavorazione_id: string | null
  status: 'bozza' | 'confermata' | 'in_lavorazione' | 'completata' | 'annullata'
  notes: string
  created_at: string
  updated_at: string
  items?: ListaLavorazioneItem[]
  assigned_users?: ListaLavorazioneUser[]
}

export function useListeLavorazioni() {
  const [liste, setListe] = useState<ListaLavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadListe = useCallback(async () => {
    if (!user) { setListe([]); setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('liste_lavorazioni')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error

      const listeBase = data || []

      // Load items and users in parallel
      const [itemsRes, usersRes] = await Promise.all([
        supabase.from('lista_lavorazione_items').select('*'),
        supabase.from('lista_lavorazione_users').select('*'),
      ])

      const items: ListaLavorazioneItem[] = itemsRes.data || []
      const users: ListaLavorazioneUser[] = usersRes.data || []

      setListe(listeBase.map(l => ({
        ...l,
        items: items.filter(i => i.lista_id === l.id),
        assigned_users: users.filter(u => u.lista_id === l.id),
      })))
    } catch (err) {
      console.error('useListeLavorazioni load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadListe() }, [loadListe])

  const addLista = async (data: {
    title: string
    description?: string
    client_id?: string | null
    lavorazione_id?: string | null
    status?: ListaLavorazione['status']
    notes?: string
    items?: Omit<ListaLavorazioneItem, 'id' | 'lista_id' | 'created_at'>[]
    assigned_users?: Omit<ListaLavorazioneUser, 'id' | 'lista_id'>[]
  }) => {
    if (!user) throw new Error('Not authenticated')
    const { items = [], assigned_users = [], ...listaData } = data

    const { data: lista, error } = await supabase
      .from('liste_lavorazioni')
      .insert([{ ...listaData, user_id: user.id }])
      .select()
      .single()
    if (error) throw error

    if (items.length > 0) {
      await supabase.from('lista_lavorazione_items')
        .insert(items.map(i => ({ ...i, lista_id: lista.id })))
    }
    if (assigned_users.length > 0) {
      await supabase.from('lista_lavorazione_users')
        .insert(assigned_users.map(u => ({ ...u, lista_id: lista.id })))
    }

    await loadListe()
    return lista
  }

  const updateLista = async (id: string, data: {
    title?: string
    description?: string
    client_id?: string | null
    lavorazione_id?: string | null
    status?: ListaLavorazione['status']
    notes?: string
    items?: Omit<ListaLavorazioneItem, 'id' | 'lista_id' | 'created_at'>[]
    assigned_users?: Omit<ListaLavorazioneUser, 'id' | 'lista_id'>[]
  }) => {
    const { items, assigned_users, ...listaData } = data

    if (Object.keys(listaData).length > 0) {
      const { error } = await supabase
        .from('liste_lavorazioni')
        .update({ ...listaData, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    }

    if (items !== undefined) {
      await supabase.from('lista_lavorazione_items').delete().eq('lista_id', id)
      if (items.length > 0) {
        await supabase.from('lista_lavorazione_items')
          .insert(items.map(i => ({ ...i, lista_id: id })))
      }
    }

    if (assigned_users !== undefined) {
      await supabase.from('lista_lavorazione_users').delete().eq('lista_id', id)
      if (assigned_users.length > 0) {
        await supabase.from('lista_lavorazione_users')
          .insert(assigned_users.map(u => ({ ...u, lista_id: id })))
      }
    }

    await loadListe()
  }

  const deleteLista = async (id: string, alsoDeleteLavorazione = false) => {
    if (alsoDeleteLavorazione) {
      const lista = liste.find(l => l.id === id)
      if (lista?.lavorazione_id) {
        await supabase.from('lavorazioni').delete().eq('id', lista.lavorazione_id)
      }
    }
    const { error } = await supabase.from('liste_lavorazioni').delete().eq('id', id)
    if (error) throw error
    setListe(prev => prev.filter(l => l.id !== id))
  }

  const linkLavorazione = async (listaId: string, lavorazioneId: string | null) => {
    const { error } = await supabase
      .from('liste_lavorazioni')
      .update({ lavorazione_id: lavorazioneId, updated_at: new Date().toISOString() })
      .eq('id', listaId)
    if (error) throw error
    setListe(prev => prev.map(l => l.id === listaId ? { ...l, lavorazione_id: lavorazioneId } : l))
  }

  return { liste, loading, addLista, updateLista, deleteLista, linkLavorazione, reload: loadListe }
}
