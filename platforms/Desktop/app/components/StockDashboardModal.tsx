'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertTriangle, XCircle, TrendingDown, Package, Pencil,
  ArrowDown, Minus, RefreshCw, ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import { Product, StockMovement } from '../hooks/useWarehouse'

interface StockDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onEditProduct: (product: Product) => void
  onUpdateStock: (productId: string, type: string, quantity: number, notes: string) => void
}

type StockFilter = 'all' | 'negative' | 'zero' | 'low'

export default function StockDashboardModal({ isOpen, onClose, products, onEditProduct, onUpdateStock }: StockDashboardModalProps) {
  const [filter, setFilter] = useState<StockFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [inventoryInputs, setInventoryInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  if (!isOpen) return null

  const negative = products.filter(p => p.quantity < 0)
  const zero = products.filter(p => p.quantity === 0)
  const low = products.filter(p => p.quantity > 0 && p.min_quantity > 0 && p.quantity <= p.min_quantity)

  const displayed = useMemo(() => {
    switch (filter) {
      case 'negative': return negative
      case 'zero': return zero
      case 'low': return low
      default: return [...negative, ...zero, ...low].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    }
  }, [filter, negative, zero, low])

  const getProductStatus = (p: Product): { label: string; cls: string; icon: typeof AlertTriangle; priority: number } => {
    if (p.quantity < 0) return { label: 'Negativo', cls: 'bg-red-100 text-red-600 border-red-200', icon: XCircle, priority: 0 }
    if (p.quantity === 0) return { label: 'Esaurito', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: Minus, priority: 1 }
    return { label: 'Scorta bassa', cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: AlertTriangle, priority: 2 }
  }

  const handleInventoryFix = async (p: Product) => {
    const val = inventoryInputs[p.id]
    const qty = parseInt(val)
    if (isNaN(qty)) return
    setSaving(p.id)
    await onUpdateStock(p.id, 'inventario', Math.abs(qty - p.quantity), `Correzione inventario: ${p.quantity} → ${qty}`)
    setSaving(null)
    setInventoryInputs(prev => { const n = { ...prev }; delete n[p.id]; return n })
    setExpandedId(null)
  }

  const tabs: { key: StockFilter; label: string; count: number; cls: string }[] = [
    { key: 'all', label: 'Tutti', count: [...negative, ...zero, ...low].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).length, cls: 'text-slate-600' },
    { key: 'negative', label: 'Negativi', count: negative.length, cls: 'text-red-600' },
    { key: 'zero', label: 'Esauriti', count: zero.length, cls: 'text-slate-500' },
    { key: 'low', label: 'Scorte basse', count: low.length, cls: 'text-amber-600' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-2xl mx-4"
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Controllo Stock</h2>
                <p className="text-xs text-slate-400">
                  {negative.length > 0 && <span className="text-red-500 font-bold">{negative.length} negativi · </span>}
                  {zero.length} esauriti · {low.length} scorte basse
                </p>
              </div>
            </div>
            <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Summary banners */}
          {negative.length > 0 && (
            <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-semibold">
                <span className="font-black">{negative.length} prodotti con stock negativo!</span> Questo è un'anomalia contabile. Correggi subito tramite inventario.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === t.key ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className={filter === t.key ? t.cls : ''}>{t.label}</span>
                {t.count > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${filter === t.key ? (t.key === 'negative' ? 'bg-red-500 text-white' : t.key === 'low' ? 'bg-amber-400 text-white' : 'bg-slate-400 text-white') : 'bg-slate-200 text-slate-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {displayed.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">
                  {filter === 'negative' ? 'Nessun prodotto con stock negativo' :
                   filter === 'zero' ? 'Nessun prodotto esaurito' :
                   filter === 'low' ? 'Nessuna scorta bassa' : 'Tutto ok! Nessuna criticità'}
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {displayed.map(p => {
                const status = getProductStatus(p)
                const expanded = expandedId === p.id
                const StatusIcon = status.icon

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => setExpandedId(expanded ? null : p.id)}
                        className="flex-1 flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${status.cls}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">
                            {p.sku && <span className="font-mono mr-2">{p.sku}</span>}
                            {p.brand && <span className="mr-2">{p.brand}</span>}
                            {p.location && <span>{p.location}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-black ${p.quantity < 0 ? 'text-red-600' : p.quantity === 0 ? 'text-slate-400' : 'text-amber-500'}`}>
                            {p.quantity}
                          </p>
                          {p.min_quantity > 0 && <p className="text-[10px] text-slate-400">min: {p.min_quantity}</p>}
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
                      </button>
                      <button onClick={() => onEditProduct(p)} title="Modifica prodotto" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-violet-500 transition-all mr-2">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 mb-2">Correggi con Inventario</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-400 block mb-1">Quantità reale a magazzino</label>
                                <input
                                  type="number"
                                  value={inventoryInputs[p.id] ?? ''}
                                  onChange={e => setInventoryInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  placeholder={`Attuale: ${p.quantity}`}
                                  title="Quantità reale"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                />
                              </div>
                              <button
                                onClick={() => handleInventoryFix(p)}
                                disabled={saving === p.id || !inventoryInputs[p.id]}
                                className="mt-5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {saving === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDown className="w-3.5 h-3.5" />}
                                {saving === p.id ? '...' : 'Correggi'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
