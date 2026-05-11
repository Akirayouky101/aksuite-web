'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from './useWarehouse'

export interface Impegno {
  id: string
  user_name: string
  product_id: string
  quantity: number
  job_reference: string
  note: string
  status: 'attivo' | 'evaso' | 'annullato'
  created_at: string
  updated_at: string
  product?: Product
}

export function useImpegniMagazzino() {
  const [impegni, setImpegni] = useState<Impegno[]>([])
  const [loading, setLoading] = useState(false)

  const loadImpegni = useCallback(async (statusFilter?: 'attivo' | 'evaso' | 'annullato') => {
    setLoading(true)
    try {
      let query = supabase
        .from('impegni_magazzino')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setImpegni((data as Impegno[]) || [])
    } catch (err) {
      console.error('Error loading impegni:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addImpegno = useCallback(async (
    userName: string,
    productId: string,
    quantity: number,
    jobReference: string = '',
    note: string = ''
  ): Promise<Impegno | null> => {
    try {
      const { data, error } = await supabase
        .from('impegni_magazzino')
        .insert([{
          user_name: userName,
          product_id: productId,
          quantity,
          job_reference: jobReference,
          note,
          status: 'attivo'
        }])
        .select()
        .single()

      if (error) throw error
      const newImpegno = data as Impegno
      setImpegni(prev => [newImpegno, ...prev])
      return newImpegno
    } catch (err) {
      console.error('Error adding impegno:', err)
      return null
    }
  }, [])

  const updateImpegnoStatus = useCallback(async (id: string, status: 'attivo' | 'evaso' | 'annullato') => {
    try {
      const { error } = await supabase
        .from('impegni_magazzino')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setImpegni(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    } catch (err) {
      console.error('Error updating impegno status:', err)
    }
  }, [])

  const updateImpegnoQty = useCallback(async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('impegni_magazzino')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setImpegni(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
    } catch (err) {
      console.error('Error updating impegno qty:', err)
    }
  }, [])

  const deleteImpegno = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('impegni_magazzino')
        .delete()
        .eq('id', id)

      if (error) throw error
      setImpegni(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Error deleting impegno:', err)
    }
  }, [])

  return {
    impegni,
    loading,
    loadImpegni,
    addImpegno,
    updateImpegnoStatus,
    updateImpegnoQty,
    deleteImpegno,
  }
}
