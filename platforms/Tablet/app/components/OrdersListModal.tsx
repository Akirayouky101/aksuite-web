'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle, Package, Truck as TruckIcon } from 'lucide-react'
import { Order } from '../hooks/useOrders'
import { Supplier } from '../hooks/useSuppliers'

interface OrdersListModalProps {
  isOpen: boolean
  onClose: () => void
  orders: Order[]
  suppliers: Supplier[]
  onAdd: () => void
  onEdit: (order: Order) => void
  onDelete: (id: string) => void
  onReceive: (orderId: string) => void
}

export default function OrdersListModal({ isOpen, onClose, orders, suppliers, onAdd, onEdit, onDelete, onReceive }: OrdersListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!isOpen) return null

  const statusColors: Record<string, string> = {
    bozza: 'bg-slate-100 text-slate-600 border-slate-200',
    da_ordinare: 'bg-amber-50 text-amber-600 border-amber-200',
    ordinato: 'bg-blue-50 text-blue-600 border-blue-200',
    in_consegna: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    ricevuto_parziale: 'bg-orange-50 text-orange-600 border-orange-200',
    ricevuto: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    contestato: 'bg-red-50 text-red-600 border-red-200',
    annullato: 'bg-slate-50 text-slate-400 border-slate-200'
  }

  const statusLabels: Record<string, string> = {
    bozza: 'Bozza', da_ordinare: 'Da Ordinare', ordinato: 'Ordinato', in_consegna: 'In Consegna',
    ricevuto_parziale: 'Parziale', ricevuto: 'Ricevuto', contestato: 'Contestato', annullato: 'Annullato'
  }

  const statusIcons: Record<string, JSX.Element> = {
    bozza: <Clock className="w-3 h-3" />,
    da_ordinare: <AlertTriangle className="w-3 h-3" />,
    ordinato: <ShoppingCart className="w-3 h-3" />,
    in_consegna: <TruckIcon className="w-3 h-3" />,
    ricevuto_parziale: <Package className="w-3 h-3" />,
    ricevuto: <CheckCircle className="w-3 h-3" />,
    contestato: <AlertTriangle className="w-3 h-3" />,
    annullato: <X className="w-3 h-3" />
  }

  const getSupplierName = (id: string | null) => suppliers.find(s => s.id === id)?.name || 'N/D'

  const isOverdue = (o: Order) => {
    if (!o.expected_delivery_date || o.status === 'ricevuto' || o.status === 'annullato') return false
    return new Date(o.expected_delivery_date) < new Date()
  }

  const filtered = orders.filter(o => {
    const supplierName = getSupplierName(o.supplier_id)
    const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      supplierName.toLowerCase().includes(search.toLowerCase()) ||
      o.ddt_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.tracking_number?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const overdueCount = orders.filter(o => isOverdue(o)).length
  const pendingCount = orders.filter(o => ['bozza', 'da_ordinare', 'ordinato', 'in_consegna'].includes(o.status)).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Ordini</h2>
                  <p className="text-xs text-slate-400">
                    {orders.length} ordini {pendingCount > 0 && <span className="text-blue-500">{'\u2022'} {pendingCount} in corso</span>}
                    {overdueCount > 0 && <span className="text-red-500 ml-1">{'\u2022'} {overdueCount} in ritardo</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onAdd} title="Nuovo ordine" className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-600 text-xs font-bold transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />Nuovo
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/30 flex gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca ordine, fornitore, DDT..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} title="Filtra per stato"
                className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-600">
                <option value="all">Tutti gli stati</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">{'\u{1F4CB}'}</div>
                  <p className="text-slate-400 text-lg">Nessun ordine trovato</p>
                  <button onClick={onAdd} className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-bold">Crea il primo ordine</button>
                </div>
              ) : filtered.map(o => {
                const isExpanded = expandedId === o.id
                const overdue = isOverdue(o)
                return (
                  <div key={o.id} className={`bg-white/80 rounded-xl border overflow-hidden hover:shadow-md transition-all ${overdue ? 'border-red-200/60 bg-red-50/20' : 'border-slate-200/40'}`}>
                    <button onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{o.order_number || 'Senza numero'}</h4>
                          {overdue && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">IN RITARDO</span>}
                          {o.priority === 'urgente' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold animate-pulse">URGENTE</span>}
                          {o.priority === 'alta' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">ALTA</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {getSupplierName(o.supplier_id)} {'\u2022'} {'\u20AC'}{o.total_amount.toFixed(2)}
                          {o.expected_delivery_date && ` \u2022 Consegna: ${new Date(o.expected_delivery_date).toLocaleDateString('it-IT')}`}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${statusColors[o.status] || 'bg-slate-100 text-slate-500'}`}>
                        {statusIcons[o.status]}{statusLabels[o.status] || o.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 space-y-3">
                            {/* Order details */}
                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                              <div><span className="text-slate-400">Stato:</span> <span className="font-bold">{statusLabels[o.status]}</span></div>
                              <div><span className="text-slate-400">Pagamento:</span> <span className="font-bold">{o.payment_status === 'da_pagare' ? 'Da Pagare' : o.payment_status === 'pagato' ? 'Pagato' : o.payment_status}</span></div>
                              <div><span className="text-slate-400">Totale:</span> <span className="font-bold">{'\u20AC'}{o.total_amount.toFixed(2)}</span></div>
                              {o.ddt_number && <div><span className="text-slate-400">DDT:</span> {o.ddt_number}</div>}
                              {o.invoice_number && <div><span className="text-slate-400">Fattura:</span> {o.invoice_number}</div>}
                              {o.tracking_number && <div><span className="text-slate-400">Tracking:</span> {o.tracking_number}</div>}
                              {o.shipping_cost > 0 && <div><span className="text-slate-400">Spedizione:</span> {'\u20AC'}{o.shipping_cost.toFixed(2)}</div>}
                            </div>
                            {o.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{o.notes}</p>}

                            {/* Items preview */}
                            {o.items && o.items.length > 0 && (
                              <div className="text-xs">
                                <p className="font-bold text-slate-400 mb-1">Articoli ({o.items.length}):</p>
                                {o.items.slice(0, 3).map(item => (
                                  <p key={item.id} className="text-slate-500">{'\u2022'} {item.product_name} x{item.quantity_ordered}</p>
                                ))}
                                {o.items.length > 3 && <p className="text-slate-400">...e altri {o.items.length - 3}</p>}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {['ordinato', 'in_consegna', 'ricevuto_parziale'].includes(o.status) && (
                                <button onClick={() => onReceive(o.id)} title="Segna come ricevuto"
                                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200/50">
                                  <CheckCircle className="w-3 h-3" />Ricevi Merce
                                </button>
                              )}
                              <button onClick={() => onEdit(o)} title="Modifica ordine"
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200/50">
                                <Pencil className="w-3 h-3" />Modifica
                              </button>
                              <button onClick={() => { if (confirm(`Eliminare ordine ${o.order_number}?`)) onDelete(o.id) }} title="Elimina ordine"
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-all flex items-center gap-1 border border-red-200/50">
                                <Trash2 className="w-3 h-3" />Elimina
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
