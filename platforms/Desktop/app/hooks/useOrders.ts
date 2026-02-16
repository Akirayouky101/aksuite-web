'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface OrderItem {
  id: string
  user_id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  product_barcode: string | null
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
  notes: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string | null
  supplier_id: string | null
  status: 'bozza' | 'da_ordinare' | 'ordinato' | 'in_consegna' | 'ricevuto_parziale' | 'ricevuto' | 'contestato' | 'annullato'
  order_date: string | null
  expected_delivery_date: string | null
  actual_delivery_date: string | null
  total_amount: number
  shipping_cost: number
  discount_amount: number
  payment_method: string | null
  payment_status: 'da_pagare' | 'pagato' | 'parziale' | 'contestato'
  ddt_number: string | null
  invoice_number: string | null
  tracking_number: string | null
  priority: 'bassa' | 'normale' | 'alta' | 'urgente'
  lavorazione_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setOrders([]); setLoading(false); return }
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (!error && data && mounted) setOrders(data)
      } catch (e) { console.warn('Orders table may not exist yet:', e) }
      if (mounted) setLoading(false)
    }
    fetchData()
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => { if (mounted) fetchData() }
      ).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const fetchOrders = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) setOrders(data)
    } catch (e) { console.warn('Orders fetch error:', e) }
    setLoading(false)
  }

  const addOrder = async (data: Partial<Order>) => {
    if (!user) return null
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
    const { data: newItem, error } = await supabase
      .from('orders')
      .insert([{ ...data, user_id: user.id, order_number: data.order_number || orderNumber }])
      .select()
      .single()
    if (error) { console.error('Add order error:', error); return null }
    return newItem
  }

  const updateOrder = async (id: string, data: Partial<Order>) => {
    const { error } = await supabase
      .from('orders')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update order error:', error)
  }

  const deleteOrder = async (id: string) => {
    // Delete items first
    await supabase.from('order_items').delete().eq('order_id', id)
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) console.error('Delete order error:', error)
  }

  const addOrderItem = async (orderId: string, item: Partial<OrderItem>) => {
    if (!user) return null
    const totalPrice = (item.quantity_ordered || 1) * (item.unit_price || 0)
    const { data: newItem, error } = await supabase
      .from('order_items')
      .insert([{ ...item, order_id: orderId, user_id: user.id, total_price: totalPrice }])
      .select()
      .single()
    if (error) { console.error('Add order item error:', error); return null }
    // Recalculate order total
    await recalculateTotal(orderId)
    return newItem
  }

  const updateOrderItem = async (itemId: string, data: Partial<OrderItem>) => {
    const totalPrice = (data.quantity_ordered || 1) * (data.unit_price || 0)
    const { error } = await supabase
      .from('order_items')
      .update({ ...data, total_price: totalPrice })
      .eq('id', itemId)
    if (error) console.error('Update order item error:', error)
  }

  const deleteOrderItem = async (itemId: string, orderId: string) => {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId)
    if (error) console.error('Delete order item error:', error)
    await recalculateTotal(orderId)
  }

  const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (error) { console.error('Get order items error:', error); return [] }
    return data || []
  }

  const recalculateTotal = async (orderId: string) => {
    const items = await getOrderItems(orderId)
    const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
    await supabase.from('orders').update({ total_amount: total, updated_at: new Date().toISOString() }).eq('id', orderId)
  }

  const receiveOrder = async (orderId: string, receivedItems: { itemId: string; quantityReceived: number }[]) => {
    for (const ri of receivedItems) {
      await supabase.from('order_items').update({ quantity_received: ri.quantityReceived }).eq('id', ri.itemId)
    }
    // Check if all items received
    const items = await getOrderItems(orderId)
    const allReceived = items.every(i => i.quantity_received >= i.quantity_ordered)
    const someReceived = items.some(i => i.quantity_received > 0)
    const newStatus = allReceived ? 'ricevuto' : someReceived ? 'ricevuto_parziale' : 'ordinato'
    await updateOrder(orderId, {
      status: newStatus as Order['status'],
      actual_delivery_date: allReceived ? new Date().toISOString().split('T')[0] : undefined
    })
  }

  const getOverdueOrders = (): Order[] => {
    const today = new Date().toISOString().split('T')[0]
    return orders.filter(o =>
      o.expected_delivery_date &&
      o.expected_delivery_date < today &&
      !['ricevuto', 'annullato', 'contestato'].includes(o.status)
    )
  }

  const getPendingOrders = (): Order[] => {
    return orders.filter(o => !['ricevuto', 'annullato'].includes(o.status))
  }

  return {
    orders, loading,
    addOrder, updateOrder, deleteOrder,
    addOrderItem, updateOrderItem, deleteOrderItem, getOrderItems,
    receiveOrder, getOverdueOrders, getPendingOrders, recalculateTotal
  }
}
