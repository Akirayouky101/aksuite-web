'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Client {
  id: string
  user_id: string
  name: string
  company: string
  phone: string
  phone2: string
  email: string
  address: string
  city: string
  zip_code: string
  province: string
  fiscal_code: string
  vat_number: string
  category: string
  notes: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setClients([]); setLoading(false); return }
    let mounted = true
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        if (mounted) setClients(data || [])
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchClients()
    return () => { mounted = false }
  }, [user?.id])

  const addClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (error) {
      console.error('Error adding client:', error)
      return null
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setClients(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (error) {
      console.error('Error updating client:', error)
      return null
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const toggleFavorite = async (id: string) => {
    const client = clients.find(c => c.id === id)
    if (!client) return
    await updateClient(id, { is_favorite: !client.is_favorite })
  }

  return { clients, loading, addClient, updateClient, deleteClient, toggleFavorite }
}
