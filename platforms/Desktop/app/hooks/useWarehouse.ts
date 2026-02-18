'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Product {
  id: string
  user_id: string
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  qr_code: string | null
  category: string
  subcategory: string | null
  brand: string | null
  model: string | null
  unit: string
  quantity: number
  min_quantity: number
  max_quantity: number | null
  location: string | null
  shelf: string | null
  purchase_price: number
  sell_price: number
  supplier_id: string | null
  image_url: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  user_id: string
  product_id: string
  order_id: string | null
  movement_type: 'carico' | 'scarico' | 'reso' | 'inventario' | 'trasferimento'
  quantity: number
  previous_quantity: number
  new_quantity: number
  reference: string | null
  notes: string | null
  created_at: string
}

export function useWarehouse() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setProducts([]); setMovements([]); setLoading(false); return }
    let mounted = true
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true })
        if (!error && data && mounted) setProducts(data)
      } catch (e) { console.warn('Products table may not exist yet:', e) }
      if (mounted) setLoading(false)
    }
    fetchProducts()

    const channel = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
        () => { if (mounted) fetchProducts() }
      ).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  const addProduct = async (data: Partial<Product>) => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('products')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add product error:', error); return null }
    return newItem
  }

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update product error:', error)
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) console.error('Delete product error:', error)
  }

  const updateStock = async (productId: string, movementType: StockMovement['movement_type'], qty: number, reference?: string, notes?: string, orderId?: string) => {
    if (!user) return
    const product = products.find(p => p.id === productId)
    if (!product) return

    const prevQty = product.quantity
    let newQty = prevQty
    if (movementType === 'carico' || movementType === 'reso') newQty = prevQty + qty
    else if (movementType === 'scarico') newQty = Math.max(0, prevQty - qty)
    else if (movementType === 'inventario') newQty = qty
    else if (movementType === 'trasferimento') newQty = Math.max(0, prevQty - qty)

    // Update product quantity
    await supabase.from('products').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', productId)

    // Record movement
    await supabase.from('stock_movements').insert([{
      user_id: user.id,
      product_id: productId,
      order_id: orderId || null,
      movement_type: movementType,
      quantity: qty,
      previous_quantity: prevQty,
      new_quantity: newQty,
      reference: reference || null,
      notes: notes || null,
    }])
  }

  const loadMovements = async (productId: string): Promise<StockMovement[]> => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) { setMovements(data); return data }
    return []
  }

  const findByBarcode = (barcode: string): Product | undefined => {
    return products.find(p => p.barcode === barcode || p.qr_code === barcode || p.sku === barcode)
  }

  const getLowStockProducts = (): Product[] => {
    return products.filter(p => p.is_active && p.min_quantity > 0 && p.quantity <= p.min_quantity)
  }

  const getOutOfStockProducts = (): Product[] => {
    return products.filter(p => p.is_active && p.quantity === 0)
  }

  return {
    products, movements, loading,
    addProduct, updateProduct, deleteProduct,
    updateStock, loadMovements, findByBarcode,
    getLowStockProducts, getOutOfStockProducts
  }
}
