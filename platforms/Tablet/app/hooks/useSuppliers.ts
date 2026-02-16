'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Supplier {
  id: string
  user_id: string
  name: string
  code: string | null
  category: string
  contact_name: string | null
  email: string | null
  phone: string | null
  phone2: string | null
  website: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  province: string | null
  country: string
  vat_number: string | null
  fiscal_code: string | null
  payment_terms: string | null
  notes: string | null
  is_favorite: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setSuppliers([]); setLoading(false); return }
    let mounted = true
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })
        if (!error && data && mounted) setSuppliers(data)
      } catch (e) { console.warn('Suppliers table may not exist yet:', e) }
      if (mounted) setLoading(false)
    }
    fetchSuppliers()

    const channel = supabase
      .channel('suppliers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers', filter: `user_id=eq.${user.id}` },
        () => { if (mounted) fetchSuppliers() }
      ).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const addSupplier = async (data: Partial<Supplier>) => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('suppliers')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add supplier error:', error); return null }
    return newItem
  }

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update supplier error:', error)
  }

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) console.error('Delete supplier error:', error)
  }

  const toggleFavorite = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id)
    if (!supplier) return
    await updateSupplier(id, { is_favorite: !supplier.is_favorite })
  }

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, toggleFavorite }
}
