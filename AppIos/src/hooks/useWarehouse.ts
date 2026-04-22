import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  qr_code: string | null
  category: string
  brand: string | null
  unit: string
  quantity: number
  min_quantity: number
  location: string | null
  image_url: string | null
}

export interface RequestItem {
  product_id: string
  product_name: string
  sku: string | null
  quantity: number
  unit: string
}

export interface WarehouseRequest {
  id: string
  requested_by: string
  status: 'pending' | 'approved' | 'rejected'
  request_type: 'prelievo' | 'ordine'
  items: RequestItem[]
  notes: string | null
  expected_date: string | null
  created_at: string
}

export interface WarehouseUser {
  id: string
  full_name: string
  email: string
}

export function useWarehouse() {
  const [products, setProducts] = useState<Product[]>([])
  const [requests, setRequests] = useState<WarehouseRequest[]>([])
  const [warehouseUsers, setWarehouseUsers] = useState<WarehouseUser[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const [{ data: productsData }, { data: requestsData }, { data: usersData }] = await Promise.all([
        supabase.from('products').select('id, name, sku, barcode, qr_code, category, brand, unit, quantity, min_quantity, location, image_url').order('name'),
        supabase.from('warehouse_requests').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_warehouse_users'),
      ])
      setProducts((productsData || []) as Product[])
      setRequests((requestsData || []) as WarehouseRequest[])
      setWarehouseUsers((usersData || []) as WarehouseUser[])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const submitRequest = async (
    requestedBy: string,
    items: RequestItem[],
    requestType: 'prelievo' | 'ordine',
    notes?: string,
    expectedDate?: string,
  ) => {
    if (!user) return null
    const { data, error } = await supabase.from('warehouse_requests').insert([{
      user_id: user.id,
      requested_by: requestedBy,
      status: 'pending',
      request_type: requestType,
      items,
      notes: notes || null,
      expected_date: expectedDate || null,
    }]).select().single()
    if (error) { console.error(error); return null }
    await fetchData()
    return data
  }

  return { products, requests, warehouseUsers, loading, submitRequest, reload: fetchData }
}
