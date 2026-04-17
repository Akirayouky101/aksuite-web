'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface RequestItem {
  product_id: string
  product_name: string
  sku: string | null
  quantity: number
  unit: string
}

export interface WarehouseRequest {
  id: string
  user_id: string
  requested_by: string
  status: 'pending' | 'approved' | 'rejected'
  items: RequestItem[]
  notes: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export function useWarehouseRequests() {
  const [requests, setRequests] = useState<WarehouseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setRequests([]); setLoading(false); return }
    let mounted = true

    const fetchRequests = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('warehouse_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)
      if (!error && data && mounted) setRequests(data as WarehouseRequest[])
      if (mounted) setLoading(false)
    }

    fetchRequests()

    const channel = supabase
      .channel('warehouse_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_requests' },
        () => { if (mounted) fetchRequests() }
      ).subscribe()

    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const submitRequest = async (requestedBy: string, items: RequestItem[], notes?: string): Promise<WarehouseRequest | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('warehouse_requests')
      .insert([{ user_id: user.id, requested_by: requestedBy.trim(), items, notes: notes?.trim() || null, status: 'pending' }])
      .select()
      .single()
    if (error) { console.error('Submit request error:', error); return null }
    setRequests(prev => [data as WarehouseRequest, ...prev])
    return data as WarehouseRequest
  }

  const approveRequest = async (id: string, approverName: string): Promise<boolean> => {
    const { error } = await supabase
      .from('warehouse_requests')
      .update({ status: 'approved', approved_by: approverName, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('Approve request error:', error); return false }
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'approved' as const, approved_by: approverName, updated_at: new Date().toISOString() }
      : r
    ))
    return true
  }

  const rejectRequest = async (id: string, approverName: string): Promise<boolean> => {
    const { error } = await supabase
      .from('warehouse_requests')
      .update({ status: 'rejected', approved_by: approverName, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('Reject request error:', error); return false }
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'rejected' as const, approved_by: approverName, updated_at: new Date().toISOString() }
      : r
    ))
    return true
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return { requests, loading, pendingCount, submitRequest, approveRequest, rejectRequest }
}
