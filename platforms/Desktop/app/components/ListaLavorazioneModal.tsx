'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Wrench, Users, Package, Trash2,
  Building2, ChevronDown, Check, ClipboardList
} from 'lucide-react'
import { ListaLavorazione, ListaLavorazioneItem, ListaLavorazioneUser } from '../hooks/useListeLavorazioni'
import { Client } from '../hooks/useClients'
import { Lavorazione } from '../hooks/useLavorazioni'
import { Product } from '../hooks/useWarehouse'

interface ListaLavorazioneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    client_id: string | null
    lavorazione_id: string | null
    status: ListaLavorazione['status']
    notes: string
    items: Omit<ListaLavorazioneItem, 'id' | 'lista_id' | 'created_at'>[]
    assigned_users: Omit<ListaLavorazioneUser, 'id' | 'lista_id'>[]
  }) => Promise<void>
  editLista?: ListaLavorazione | null
  clients: Client[]
  lavorazioni: Lavorazione[]
  products: Product[]
  managedUsers: { id: string; full_name: string; email: string }[]
}

const STATUSES: { value: ListaLavorazione['status']; label: string }[] = [
  { value: 'bozza', label: 'Bozza' },
  { value: 'confermata', label: 'Confermata' },
  { value: 'in_lavorazione', label: 'In Lavorazione' },
  { value: 'completata', label: 'Completata' },
  { value: 'annullata', label: 'Annullata' },
]

export default function ListaLavorazioneModal({
  isOpen, onClose, onSave, editLista, clients, lavorazioni, products, managedUsers
}: ListaLavorazioneModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [lavorazioneId, setLavorazioneId] = useState<string | null>(null)
  const [status, setStatus] = useState<ListaLavorazione['status']>('bozza')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Omit<ListaLavorazioneItem, 'id' | 'lista_id' | 'created_at'>[]>([])
  const [assignedUsers, setAssignedUsers] = useState<Omit<ListaLavorazioneUser, 'id' | 'lista_id'>[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editLista) {
      setTitle(editLista.title || '')
      setDescription(editLista.description || '')
      setClientId(editLista.client_id)
      setLavorazioneId(editLista.lavorazione_id)
      setStatus(editLista.status || 'bozza')
      setNotes(editLista.notes || '')
      setItems(editLista.items?.map(i => ({
        product_id: i.product_id, product_name: i.product_name, product_sku: i.product_sku || '',
        product_category: i.product_category || '', quantity: i.quantity, unit: i.unit || 'pz',
        unit_price: i.unit_price || 0, notes: i.notes || ''
      })) || [])
      setAssignedUsers(editLista.assigned_users?.map(u => ({ user_id: u.user_id, user_name: u.user_name || '', role: u.role || 'tecnico' })) || [])
    } else {
      setTitle(''); setDescription(''); setClientId(null); setLavorazioneId(null)
      setStatus('bozza'); setNotes(''); setItems([]); setAssignedUsers([])
    }
    setProductSearch('')
  }, [isOpen, editLista])

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 50)
    const t = productSearch.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(t) ||
      (p.sku || '').toLowerCase().includes(t) ||
      (p.category || '').toLowerCase().includes(t) ||
      (p.brand || '').toLowerCase().includes(t)
    ).slice(0, 50)
  }, [products, productSearch])

  const addProduct = (p: Product) => {
    const exists = items.find(i => i.product_id === p.id)
    if (exists) {
      setItems(prev => prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems(prev => [...prev, {
        product_id: p.id, product_name: p.name, product_sku: p.sku || '',
        product_category: p.category || '', quantity: 1, unit: p.unit || 'pz',
        unit_price: p.sell_price || 0, notes: ''
      }])
    }
    setProductSearch('')
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItemQty = (idx: number, qty: number) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(0.01, qty) } : it))
  const updateItemNote = (idx: number, note: string) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, notes: note } : it))

  const toggleUser = (u: { id: string; full_name: string; email: string }) => {
    const exists = assignedUsers.find(au => au.user_id === u.id)
    if (exists) {
      setAssignedUsers(prev => prev.filter(au => au.user_id !== u.id))
    } else {
      setAssignedUsers(prev => [...prev, { user_id: u.id, user_name: u.full_name || u.email, role: 'tecnico' }])
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), description, client_id: clientId, lavorazione_id: lavorazioneId, status, notes, items, assigned_users: assignedUsers })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{editLista ? 'Modifica Lista' : 'Nuova Lista Lavorazione'}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Titolo *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Impianto antintrusione Rossi..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all font-medium" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Descrizione</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrizione..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Cliente</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select value={clientId || ''} onChange={e => setClientId(e.target.value || null)}
                    className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all appearance-none cursor-pointer">
                    <option value="">Nessun cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stato</label>
                <select value={status} onChange={e => setStatus(e.target.value as ListaLavorazione['status'])}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all cursor-pointer">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Lavorazione Associata</label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select value={lavorazioneId || ''} onChange={e => setLavorazioneId(e.target.value || null)}
                    className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all appearance-none cursor-pointer">
                    <option value="">Nessuna lavorazione</option>
                    {lavorazioni.map(l => <option key={l.id} value={l.id}>{l.title} — {l.status === 'da_fare' ? 'Da fare' : l.status === 'in_corso' ? 'In corso' : l.status}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Tecnici assegnati */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Tecnici Assegnati
              </label>
              <div className="flex flex-wrap gap-2">
                {managedUsers.map(u => {
                  const sel = assignedUsers.some(au => au.user_id === u.id)
                  return (
                    <button key={u.id} onClick={() => toggleUser(u)} type="button"
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        sel
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}>
                      {sel && <Check className="w-3 h-3" />}
                      {u.full_name || u.email}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Componenti */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Componenti dal Magazzino ({items.length})
              </label>
              {/* Search prodotti */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="Cerca prodotto per nome, SKU, categoria..."
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all" />
              </div>
              {productSearch.trim() && filteredProducts.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden mb-3 max-h-48 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)} type="button"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-violet-50 transition-colors border-b border-slate-100 last:border-0">
                      <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.sku && `SKU: ${p.sku} · `}{p.category}{p.brand ? ` · ${p.brand}` : ''}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-bold text-violet-600">{p.quantity} {p.unit}</p>
                        {p.sell_price > 0 && <p className="text-[11px] text-slate-400">€{p.sell_price.toFixed(2)}</p>}
                      </div>
                      <Plus className="w-4 h-4 text-violet-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {/* Lista items selezionati */}
              {items.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400">
                  Cerca e aggiungi componenti dal magazzino
                </div>
              )}
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                      {item.product_sku && <p className="text-[11px] text-slate-400">{item.product_sku}</p>}
                    </div>
                    <input type="number" min={0.01} step={0.01} value={item.quantity}
                      onChange={e => updateItemQty(idx, parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40" />
                    <span className="text-xs text-slate-500 w-6">{item.unit}</span>
                    <input type="text" value={item.notes} onChange={e => updateItemNote(idx, e.target.value)}
                      placeholder="nota..."
                      className="w-28 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 text-slate-500" />
                    <button onClick={() => removeItem(idx)} type="button"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Note</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Note aggiuntive..."
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{items.length} componenti · {assignedUsers.length} tecnici</p>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Annulla
              </button>
              <button onClick={handleSave} disabled={!title.trim() || saving}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-95">
                {saving ? 'Salvataggio...' : editLista ? 'Salva Modifiche' : 'Crea Lista'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
