'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Plus, Minus, Trash2, Search, Tag, FileText, Layers, Check } from 'lucide-react'
import { Kit, KitItem } from '../hooks/useKits'
import { Product } from '../hooks/useWarehouse'

interface KitItemDraft {
  id: string
  product_id: string | null
  product_name: string
  product_sku: string | null
  quantity: number
  notes: string
}

interface KitModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  editKit?: Kit | null
  onSave: (data: {
    name: string
    sku?: string
    category?: string
    description?: string
    notes?: string
    items: { product_id: string | null; product_name: string; product_sku: string | null; quantity: number; notes?: string }[]
  }) => Promise<any>
  onUpdate?: (id: string, data: {
    name: string
    sku?: string
    category?: string
    description?: string
    notes?: string
    items: { product_id: string | null; product_name: string; product_sku: string | null; quantity: number; notes?: string }[]
  }) => Promise<boolean>
}

export default function KitModal({ isOpen, onClose, products, editKit, onSave, onUpdate }: KitModalProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('generale')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<KitItemDraft[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isEditing = !!editKit

  useEffect(() => {
    if (!isOpen) return
    if (editKit) {
      setName(editKit.name)
      setSku(editKit.sku || '')
      setCategory(editKit.category || 'generale')
      setDescription(editKit.description || '')
      setNotes(editKit.notes || '')
      setItems((editKit.items || []).map(i => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_sku: i.product_sku,
        quantity: i.quantity,
        notes: i.notes || '',
      })))
    } else {
      setName('')
      setSku('')
      setCategory('generale')
      setDescription('')
      setNotes('')
      setItems([])
    }
    setSearch('')
    setSaved(false)
  }, [isOpen, editKit?.id])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [search, products])

  const addProductToKit = (p: Product) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.product_id === p.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 }
        return updated
      }
      return [...prev, {
        id: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        quantity: 1,
        notes: '',
      }]
    })
    setSearch('')
  }

  const updateItemQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const setItemQty = (id: string, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const handleSave = async () => {
    if (!name.trim() || items.length === 0 || saving) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category || 'generale',
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          product_sku: i.product_sku,
          quantity: i.quantity,
          notes: i.notes.trim() || undefined,
        })),
      }
      if (isEditing && onUpdate && editKit) {
        await onUpdate(editKit.id, payload)
      } else {
        await onSave(payload)
      }
      setSaved(true)
      setTimeout(() => { onClose(); setSaved(false) }, 800)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const KIT_CATEGORIES = ['generale', 'installazione', 'manutenzione', 'collaudo', 'emergency', 'personalizzato']

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="relative max-w-2xl w-full my-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">{isEditing ? 'Modifica KIT' : 'Nuovo KIT'}</h2>
                  <p className="text-xs text-slate-400">{items.length} componenti</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Info section */}
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nome KIT *</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="es. Kit Installazione NVR Base"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">SKU / Codice</label>
                    <input
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      placeholder="KIT-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Categoria</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      title="Categoria KIT"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      {KIT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Descrizione</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Descrizione breve del kit..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product search */}
              <div className="p-5 border-b border-slate-100">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Aggiungi Componente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cerca prodotto per nome, SKU, brand..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>

                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden divide-y divide-slate-100"
                    >
                      {searchResults.map(p => {
                        const inKit = items.some(i => i.product_id === p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => addProductToKit(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-violet-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.sku || '—'} · Qta: {p.quantity}</p>
                            </div>
                            {inKit && <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">In kit</span>}
                            <Plus className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Items list */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Componenti ({items.length})</label>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Nessun componente aggiunto</p>
                    <p className="text-xs text-slate-300 mt-1">Cerca un prodotto qui sopra</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                          {item.product_sku && <p className="text-xs text-slate-400 font-mono">{item.product_sku}</p>}
                        </div>
                        {/* Qty controls */}
                        <div className="flex items-center gap-1">
                          <button title="Diminuisci quantità" onClick={() => updateItemQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => setItemQty(item.id, parseInt(e.target.value) || 1)}
                            min={1}
                            title="Quantità"
                            className="w-12 text-center text-sm font-bold text-slate-800 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                          />
                          <button title="Aumenta quantità" onClick={() => updateItemQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button title="Rimuovi componente" onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-4 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || items.length === 0 || saving}
                className={`flex-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  saved ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {saved ? <><Check className="w-4 h-4" /> Salvato!</> : saving ? 'Salvataggio...' : isEditing ? 'Aggiorna KIT' : 'Crea KIT'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
