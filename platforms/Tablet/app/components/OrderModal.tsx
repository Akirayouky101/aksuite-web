'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Plus, Trash2, Package } from 'lucide-react'
import { Order, OrderItem } from '../hooks/useOrders'
import { Supplier } from '../hooks/useSuppliers'
import { Product } from '../hooks/useWarehouse'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (order: Partial<Order>) => void
  onAddItem: (item: Partial<OrderItem>) => void
  onDeleteItem: (id: string) => void
  editingOrder?: Order | null
  orderItems: OrderItem[]
  suppliers: Supplier[]
  products: Product[]
}

export default function OrderModal({ isOpen, onClose, onSave, onAddItem, onDeleteItem, editingOrder, orderItems, suppliers, products }: OrderModalProps) {
  const [form, setForm] = useState({
    supplier_id: '', status: 'bozza' as Order['status'], priority: 'normale' as Order['priority'],
    expected_delivery_date: '', notes: '', ddt_number: '', invoice_number: '',
    payment_status: 'da_pagare' as Order['payment_status'], tracking_number: '', shipping_cost: 0
  })
  const [newItem, setNewItem] = useState({ product_id: '', quantity_ordered: 1, unit_price: 0, notes: '' })

  useEffect(() => {
    if (editingOrder) {
      setForm({
        supplier_id: editingOrder.supplier_id || '',
        status: editingOrder.status || 'bozza',
        priority: editingOrder.priority || 'normale',
        expected_delivery_date: editingOrder.expected_delivery_date ? editingOrder.expected_delivery_date.split('T')[0] : '',
        notes: editingOrder.notes || '',
        ddt_number: editingOrder.ddt_number || '',
        invoice_number: editingOrder.invoice_number || '',
        payment_status: editingOrder.payment_status || 'da_pagare',
        tracking_number: editingOrder.tracking_number || '',
        shipping_cost: editingOrder.shipping_cost || 0
      })
    } else {
      setForm({ supplier_id: '', status: 'bozza', priority: 'normale', expected_delivery_date: '', notes: '', ddt_number: '', invoice_number: '', payment_status: 'da_pagare', tracking_number: '', shipping_cost: 0 })
    }
  }, [editingOrder, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (!form.supplier_id) return
    onSave({ ...form, shipping_cost: Number(form.shipping_cost) })
    onClose()
  }

  const handleAddItem = () => {
    if (!newItem.product_id || !editingOrder) return
    onAddItem({ ...newItem, order_id: editingOrder.id, unit_price: Number(newItem.unit_price), quantity_ordered: Number(newItem.quantity_ordered) })
    setNewItem({ product_id: '', quantity_ordered: 1, unit_price: 0, notes: '' })
  }

  const handleProductSelect = (productId: string) => {
    const p = products.find(pr => pr.id === productId)
    setNewItem(prev => ({ ...prev, product_id: productId, unit_price: p ? p.purchase_price : 0 }))
  }

  const statusColors: Record<string, string> = {
    bozza: 'bg-slate-100 text-slate-600', da_ordinare: 'bg-amber-50 text-amber-600',
    ordinato: 'bg-blue-50 text-blue-600', in_consegna: 'bg-indigo-50 text-indigo-600',
    ricevuto_parziale: 'bg-orange-50 text-orange-600', ricevuto: 'bg-emerald-50 text-emerald-600',
    contestato: 'bg-red-50 text-red-600', annullato: 'bg-slate-100 text-slate-400'
  }

  const statusLabels: Record<string, string> = {
    bozza: 'Bozza', da_ordinare: 'Da Ordinare', ordinato: 'Ordinato', in_consegna: 'In Consegna',
    ricevuto_parziale: 'Ricevuto Parziale', ricevuto: 'Ricevuto', contestato: 'Contestato', annullato: 'Annullato'
  }

  const itemsTotal = orderItems.reduce((sum, i) => sum + (i.unit_price * i.quantity_ordered), 0)

  const labelCls = "text-xs font-bold text-slate-500 mb-1"
  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editingOrder ? `Ordine ${editingOrder.order_number}` : 'Nuovo Ordine'}</h2>
                  {editingOrder && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[editingOrder.status] || 'bg-slate-100 text-slate-500'}`}>{statusLabels[editingOrder.status] || editingOrder.status}</span>}
                </div>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Supplier + Status */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Dettagli Ordine</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Fornitore *</label>
                    <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} title="Seleziona fornitore" className={inputCls}>
                      <option value="">Seleziona fornitore...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Stato</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Order['status']})} title="Stato ordine" className={inputCls}>
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priorit\u00E0</label>
                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Order['priority']})} title="Priorit\u00E0 ordine" className={inputCls}>
                      <option value="bassa">Bassa</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Consegna Prevista</label>
                    <input type="date" value={form.expected_delivery_date} onChange={e => setForm({...form, expected_delivery_date: e.target.value})} title="Data consegna prevista" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Stato Pagamento</label>
                    <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value as Order['payment_status']})} title="Stato pagamento" className={inputCls}>
                      <option value="da_pagare">Da Pagare</option>
                      <option value="pagato">Pagato</option>
                      <option value="parziale">Parziale</option>
                      <option value="contestato">Contestato</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping / DDT / Invoice */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Documenti e Spedizione</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>N. DDT</label>
                    <input value={form.ddt_number} onChange={e => setForm({...form, ddt_number: e.target.value})} placeholder="DDT..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>N. Fattura</label>
                    <input value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} placeholder="Fattura..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tracking</label>
                    <input value={form.tracking_number} onChange={e => setForm({...form, tracking_number: e.target.value})} placeholder="Tracking..." className={inputCls} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Costo Spedizione (\u20AC)</label>
                  <input type="number" step="0.01" value={form.shipping_cost} onChange={e => setForm({...form, shipping_cost: Number(e.target.value)})} title="Costo spedizione" min="0" className={inputCls + ' max-w-[200px]'} />
                </div>
              </div>

              {/* Order items - only in edit mode */}
              {editingOrder && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Articoli ({orderItems.length})
                  </h3>
                  {/* Existing items */}
                  {orderItems.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      {orderItems.map(item => {
                        const prod = products.find(p => p.id === item.product_id)
                        return (
                          <div key={item.id} className="flex items-center gap-2 bg-slate-50/80 rounded-lg px-3 py-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-700 truncate">{prod?.name || 'Prodotto sconosciuto'}</p>
                              <p className="text-slate-400">{item.quantity_ordered} x \u20AC{item.unit_price.toFixed(2)} = \u20AC{(item.quantity_ordered * item.unit_price).toFixed(2)}</p>
                              {item.quantity_received > 0 && <p className="text-emerald-500">Ricevuti: {item.quantity_received}/{item.quantity_ordered}</p>}
                            </div>
                            <button onClick={() => onDeleteItem(item.id)} title="Rimuovi articolo"
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        )
                      })}
                      <div className="text-right text-sm font-bold text-slate-700 pt-1">
                        Totale: \u20AC{itemsTotal.toFixed(2)}{form.shipping_cost > 0 ? ` + \u20AC${Number(form.shipping_cost).toFixed(2)} sped. = \u20AC${(itemsTotal + Number(form.shipping_cost)).toFixed(2)}` : ''}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-3">Nessun articolo aggiunto</p>
                  )}

                  {/* Add item */}
                  <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-200/30">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Aggiungi Articolo</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <select value={newItem.product_id} onChange={e => handleProductSelect(e.target.value)} title="Seleziona prodotto"
                          className="w-full px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs text-slate-700">
                          <option value="">Prodotto...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>)}
                        </select>
                      </div>
                      <div>
                        <input type="number" value={newItem.quantity_ordered} onChange={e => setNewItem({...newItem, quantity_ordered: Number(e.target.value)})} min="1" title="Quantit\u00E0 articolo" placeholder="Qt\u00E0"
                          className="w-full px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs text-slate-700" />
                      </div>
                      <div className="flex gap-1">
                        <input type="number" step="0.01" value={newItem.unit_price} onChange={e => setNewItem({...newItem, unit_price: Number(e.target.value)})} min="0" title="Prezzo unitario" placeholder="\u20AC"
                          className="flex-1 px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs text-slate-700" />
                        <button onClick={handleAddItem} disabled={!newItem.product_id} title="Aggiungi articolo"
                          className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center disabled:opacity-40 transition-all">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={labelCls}>Note</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Note ordine..." rows={2} className={inputCls + ' resize-none'} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-all">Annulla</button>
                <button onClick={handleSave} disabled={!form.supplier_id}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-40">
                  {editingOrder ? 'Salva Modifiche' : 'Crea Ordine'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
