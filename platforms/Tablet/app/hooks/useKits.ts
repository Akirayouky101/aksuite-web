'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface KitItem {
  id: string
  kit_id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  quantity: number
  notes: string | null
  created_at: string
}

export interface Kit {
  id: string
  user_id: string
  name: string
  sku: string | null
  qr_code: string | null
  category: string
  description: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  items?: KitItem[]
}

export interface KitAvailability {
  product_id: string | null
  product_name: string
  product_sku: string | null
  required_qty: number
  current_qty: number
  is_available: boolean
}

export function useKits() {
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setKits([]); setLoading(false); return }
    let mounted = true

    const fetchKits = async () => {
      setLoading(true)
      try {
        const { data: kitsData, error: kitsError } = await supabase
          .from('kits')
          .select('*')
          .order('name', { ascending: true })

        if (kitsError) { console.warn('Fetch kits error:', kitsError); if (mounted) setLoading(false); return }

        if (kitsData && mounted) {
          // Fetch items for all kits
          const kitIds = kitsData.map((k: Kit) => k.id)
          if (kitIds.length > 0) {
            const { data: itemsData } = await supabase
              .from('kit_items')
              .select('*')
              .in('kit_id', kitIds)
              .order('created_at', { ascending: true })

            const itemsByKitId: Record<string, KitItem[]> = {}
            for (const item of (itemsData || [])) {
              if (!itemsByKitId[item.kit_id]) itemsByKitId[item.kit_id] = []
              itemsByKitId[item.kit_id].push(item as KitItem)
            }

            setKits(kitsData.map((k: Kit) => ({ ...k, items: itemsByKitId[k.id] || [] })))
          } else {
            setKits([])
          }
        }
      } catch (e) {
        console.warn('Kits table may not exist yet:', e)
      }
      if (mounted) setLoading(false)
    }

    fetchKits()

    const channel = supabase
      .channel('kits_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kits' }, () => { if (mounted) fetchKits() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kit_items' }, () => { if (mounted) fetchKits() })
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const addKit = async (data: {
    name: string
    sku?: string
    category?: string
    description?: string
    notes?: string
    items: { product_id: string | null; product_name: string; product_sku: string | null; quantity: number; notes?: string }[]
  }): Promise<Kit | null> => {
    if (!user) return null

    const qrCode = `KIT:${crypto.randomUUID()}`

    const { data: kit, error } = await supabase
      .from('kits')
      .insert([{
        user_id: user.id,
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        qr_code: qrCode,
        category: data.category || 'generale',
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
        is_active: true,
      }])
      .select()
      .single()

    if (error || !kit) { console.error('Add kit error:', error); return null }

    // Insert items
    if (data.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('kit_items')
        .insert(data.items.map(item => ({
          kit_id: kit.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          notes: item.notes?.trim() || null,
        })))

      if (itemsError) console.error('Add kit items error:', itemsError)
    }

    const newKit: Kit = { ...kit, items: [] }
    setKits(prev => [...prev, newKit].sort((a, b) => a.name.localeCompare(b.name)))
    return newKit
  }

  const updateKit = async (
    id: string,
    data: {
      name: string
      sku?: string
      category?: string
      description?: string
      notes?: string
      items: { product_id: string | null; product_name: string; product_sku: string | null; quantity: number; notes?: string }[]
    }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('kits')
      .update({
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        category: data.category || 'generale',
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) { console.error('Update kit error:', error); return false }

    // Replace all items: delete + re-insert
    await supabase.from('kit_items').delete().eq('kit_id', id)

    if (data.items.length > 0) {
      await supabase.from('kit_items').insert(
        data.items.map(item => ({
          kit_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          notes: item.notes?.trim() || null,
        }))
      )
    }

    setKits(prev => prev.map(k => k.id === id ? { ...k, name: data.name, sku: data.sku || null, category: data.category || 'generale', description: data.description || null, notes: data.notes || null, updated_at: new Date().toISOString() } : k))
    return true
  }

  const deleteKit = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('kits').delete().eq('id', id)
    if (error) { console.error('Delete kit error:', error); return false }
    setKits(prev => prev.filter(k => k.id !== id))
    return true
  }

  const getKitAvailability = useCallback(async (kitId: string): Promise<KitAvailability[]> => {
    const { data, error } = await supabase.rpc('get_kit_availability', { p_kit_id: kitId })
    if (error) { console.error('get_kit_availability error:', error); return [] }
    return (data || []) as KitAvailability[]
  }, [])

  /** Trova kit dal QR code payload es. "KIT:uuid" */
  const findByQrCode = useCallback((qr: string): Kit | undefined => {
    return kits.find(k => k.qr_code === qr)
  }, [kits])

  return { kits, loading, addKit, updateKit, deleteKit, getKitAvailability, findByQrCode }
}
