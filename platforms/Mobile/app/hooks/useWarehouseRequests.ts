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
  fulfilled_quantity?: number   // per gli ordini: quante unità già preparate/scansionate
}

export interface WarehouseRequest {
  id: string
  user_id: string
  requested_by: string
  status: 'pending' | 'approved' | 'rejected'
  request_type: 'prelievo' | 'ordine'
  items: RequestItem[]
  notes: string | null
  expected_date: string | null   // per ordini: data in cui serve il materiale
  approved_by: string | null
  created_at: string
  updated_at: string
}

/** Profilo utente leggero per il dropdown del kiosk */
export interface UserProfile {
  id: string
  full_name: string
  email: string
}

export function useWarehouseRequests() {
  const [requests, setRequests] = useState<WarehouseRequest[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setRequests([]); setUserProfiles([]); setLoading(false); return }
    let mounted = true

    const fetchRequests = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('warehouse_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (!error && data && mounted) setRequests(data as WarehouseRequest[])
      if (mounted) setLoading(false)
    }

    const fetchProfiles = async () => {
      // Usa funzione SECURITY DEFINER: restituisce solo utenti con can_warehouse=true
      const { data, error } = await supabase.rpc('get_warehouse_users')
      if (!error && data && mounted) {
        setUserProfiles(data.filter((p: UserProfile) => p.full_name || p.email) as UserProfile[])
      }
    }

    fetchRequests()
    fetchProfiles()

    const channel = supabase
      .channel('warehouse_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_requests' },
        () => { if (mounted) fetchRequests() }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_permissions' },
        () => { if (mounted) fetchProfiles() }
      )
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  /** Registra un prelievo immediato o un ordine futuro */
  const submitRequest = async (
    requestedBy: string,
    items: RequestItem[],
    notes?: string,
    requestType: 'prelievo' | 'ordine' = 'prelievo',
    expectedDate?: string
  ): Promise<WarehouseRequest | null> => {
    if (!user) return null
    const itemsWithFulfilled = items.map(i => ({
      ...i,
      fulfilled_quantity: requestType === 'ordine' ? 0 : undefined,
    }))
    const { data, error } = await supabase
      .from('warehouse_requests')
      .insert([{
        user_id: user.id,
        requested_by: requestedBy.trim(),
        items: itemsWithFulfilled,
        notes: notes?.trim() || null,
        status: 'pending',
        request_type: requestType,
        expected_date: expectedDate || null,
      }])
      .select()
      .single()
    if (error) { console.error('Submit request error:', error); return null }
    setRequests(prev => [data as WarehouseRequest, ...prev])
    return data as WarehouseRequest
  }

  /** Aggiorna la quantità evasa di un singolo item in un ordine (scanning) */
  const fulfillItem = async (requestId: string, productId: string, addQty: number): Promise<boolean> => {
    const req = requests.find(r => r.id === requestId)
    if (!req) return false
    const updatedItems = req.items.map(item => {
      if (item.product_id !== productId) return item
      const current = item.fulfilled_quantity ?? 0
      const newFulfilled = Math.min(current + addQty, item.quantity)
      return { ...item, fulfilled_quantity: newFulfilled }
    })
    const { error } = await supabase
      .from('warehouse_requests')
      .update({ items: updatedItems, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    if (error) { console.error('Fulfill item error:', error); return false }
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, items: updatedItems } : r))
    return true
  }

  /** Reset quantità evasa di un item */
  const unfulfillItem = async (requestId: string, productId: string): Promise<boolean> => {
    const req = requests.find(r => r.id === requestId)
    if (!req) return false
    const updatedItems = req.items.map(item =>
      item.product_id === productId ? { ...item, fulfilled_quantity: 0 } : item
    )
    const { error } = await supabase
      .from('warehouse_requests')
      .update({ items: updatedItems, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    if (error) { console.error('Unfulfill item error:', error); return false }
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, items: updatedItems } : r))
    return true
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

  const deleteRequest = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('warehouse_requests')
      .delete()
      .eq('id', id)
    if (error) { console.error('Delete request error:', error); return false }
    setRequests(prev => prev.filter(r => r.id !== id))
    return true
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const pendingOrders = requests.filter(r => r.status === 'pending' && r.request_type === 'ordine').length

  return {
    requests, loading, userProfiles, pendingCount, pendingOrders,
    submitRequest, approveRequest, rejectRequest,
    fulfillItem, unfulfillItem, deleteRequest,
  }
}

