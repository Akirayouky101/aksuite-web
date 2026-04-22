import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface KitItem {
  id: string
  kit_id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  quantity: number
  notes: string | null
}

export interface Kit {
  id: string
  name: string
  sku: string | null
  qr_code: string | null
  category: string
  description: string | null
  is_active: boolean
  items?: KitItem[]
}

export function useKits() {
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchKits = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: kitsData } = await supabase.from('kits').select('*').eq('is_active', true).order('name')
      const ids = (kitsData || []).map((k: any) => k.id)
      if (ids.length > 0) {
        const { data: itemsData } = await supabase.from('kit_items').select('*').in('kit_id', ids)
        const itemsMap: Record<string, KitItem[]> = {}
        for (const item of itemsData || []) {
          if (!itemsMap[item.kit_id]) itemsMap[item.kit_id] = []
          itemsMap[item.kit_id].push(item as KitItem)
        }
        setKits((kitsData || []).map((k: any) => ({ ...k, items: itemsMap[k.id] || [] })))
      } else {
        setKits([])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchKits() }, [fetchKits])

  return { kits, loading, reload: fetchKits }
}
