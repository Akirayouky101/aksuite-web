'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Package, Check, CheckCircle2, XCircle, Search,
  Trash2, BookMarked, ChevronDown, ChevronUp, AlertCircle, Scan, Users
} from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { Impegno, useImpegniMagazzino } from '../hooks/useImpegniMagazzino'

interface ImpegnoMagazzinoModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  currentUser?: string
  findByBarcode: (barcode: string) => Product | undefined
}

type ViewFilter = 'attivo' | 'evaso' | 'annullato' | 'tutti'

export default function ImpegnoMagazzinoModal({ isOpen, onClose, products, currentUser, findByBarcode }: ImpegnoMagazzinoModalProps) {
  const { impegni, loading, loadImpegni, addImpegno, updateImpegnoStatus, updateImpegnoQty, deleteImpegno } = useImpegniMagazzino()

  const [viewFilter, setViewFilter] = useState<ViewFilter>('attivo')
  const [userFilter, setUserFilter] = useState<string>('tutti')
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addQty, setAddQty] = useState(1)
  const [addJobRef, setAddJobRef] = useState('')
  const [addNote, setAddNote] = useState('')
  const [addUser, setAddUser] = useState(currentUser || '')
  const [saving, setSaving] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Enrich impegni with product data
  const enrichedImpegni = impegni.map(i => ({
    ...i,
    product: products.find(p => p.id === i.product_id)
  }))

  const filteredImpegni = enrichedImpegni.filter(i => {
    if (viewFilter !== 'tutti' && i.status !== viewFilter) return false
    if (userFilter !== 'tutti' && i.user_name !== userFilter) return false
    return true
  })

  const uniqueUsers = Array.from(new Set(impegni.map(i => i.user_name))).sort()

  useEffect(() => {
    if (isOpen) {
      loadImpegni()
      if (currentUser) setAddUser(currentUser)
    }
  }, [isOpen, loadImpegni, currentUser])

  useEffect(() => {
    if (scanMode && scanRef.current) {
      setTimeout(() => scanRef.current?.focus(), 100)
    }
  }, [scanMode])

  const searchResults = searchProduct.trim().length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchProduct.toLowerCase())
      ).slice(0, 8)
    : []

  const handleScan = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const product = findByBarcode(trimmed)
    if (product) {
      setSelectedProduct(product)
      setSearchProduct(product.name)
      setScanMode(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedProduct || !addUser.trim() || saving) return
    setSaving(true)
    try {
      await addImpegno(addUser.trim(), selectedProduct.id, addQty, addJobRef, addNote)
      setShowAddForm(false)
      setSelectedProduct(null)
      setSearchProduct('')
      setAddQty(1)
      setAddJobRef('')
      setAddNote('')
    } finally {
      setSaving(false)
    }
  }

  const statusColor = (status: string) => {
    if (status === 'attivo') return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    if (status === 'evaso') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  }

  const statusLabel = (status: string) => {
    if (status === 'attivo') return 'Attivo'
    if (status === 'evaso') return 'Evaso'
    return 'Annullato'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl mx-4 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Impegni Magazzino</h2>
              <p className="text-slate-500 text-xs">{filteredImpegni.length} impegni</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAddForm(true); setTimeout(() => searchRef.current?.focus(), 100) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/30"
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-slate-100">
          {/* Status filter */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(['attivo', 'evaso', 'annullato', 'tutti'] as ViewFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setViewFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${viewFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'tutti' ? 'Tutti' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* User filter */}
          {uniqueUsers.length > 1 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="text-sm text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="tutti">Tutti gli utenti</option>
                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-100"
            >
              <div className="px-6 py-5 bg-violet-50/50">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Nuovo impegno</h3>

                {/* Utente */}
                <div className="mb-3">
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Operatore</label>
                  <input
                    value={addUser}
                    onChange={e => setAddUser(e.target.value)}
                    placeholder="Nome operatore..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-violet-400"
                  />
                </div>

                {/* Prodotto search / scan */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-500 font-semibold">Prodotto</label>
                    <button
                      onClick={() => setScanMode(!scanMode)}
                      className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${scanMode ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Scan className="w-3 h-3" /> Scansiona
                    </button>
                  </div>

                  {scanMode ? (
                    <input
                      ref={scanRef}
                      placeholder="Scansiona barcode..."
                      className="w-full px-3 py-2 rounded-xl border border-violet-300 bg-white text-sm font-mono text-slate-800 focus:outline-none focus:border-violet-400"
                      onKeyDown={e => { if (e.key === 'Enter') { handleScan((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' } }}
                      autoFocus
                    />
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchRef}
                        value={searchProduct}
                        onChange={e => { setSearchProduct(e.target.value); setSelectedProduct(null) }}
                        placeholder="Cerca prodotto..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-violet-400"
                      />
                      {selectedProduct && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search results */}
                  {searchResults.length > 0 && !selectedProduct && (
                    <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setSearchProduct(p.name) }}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-all border-b border-slate-100 last:border-0"
                        >
                          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 font-medium truncate">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.sku} · Giacenza: {p.quantity} {p.unit || 'pz'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Quantità */}
                  <div>
                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Quantità</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAddQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-all">-</button>
                      <input
                        type="number"
                        min={1}
                        value={addQty}
                        onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-violet-400"
                      />
                      <button onClick={() => setAddQty(q => q + 1)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-all">+</button>
                    </div>
                  </div>

                  {/* Cantiere / Lavoro */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Cantiere / Lavoro</label>
                    <input
                      value={addJobRef}
                      onChange={e => setAddJobRef(e.target.value)}
                      placeholder="Es. Cantiere Rossi..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="mb-4">
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Note (opzionale)</label>
                  <input
                    value={addNote}
                    onChange={e => setAddNote(e.target.value)}
                    placeholder="Note aggiuntive..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!selectedProduct || !addUser.trim() || saving}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? 'Salvataggio...' : 'Aggiungi impegno'}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-all">
                    Annulla
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredImpegni.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <BookMarked className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-400 font-semibold">Nessun impegno {viewFilter !== 'tutti' ? viewFilter : ''}</p>
              <p className="text-slate-300 text-sm mt-1">Aggiungi prodotti che i ragazzi utilizzeranno</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredImpegni.map(i => (
                <div key={i.id} className="px-6 py-4 hover:bg-slate-50/60 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="w-4 h-4 text-violet-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{i.product?.name || i.product_id}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-slate-500 text-xs">👤 {i.user_name}</span>
                            {i.job_reference && <span className="text-slate-500 text-xs">📍 {i.job_reference}</span>}
                            {i.note && <span className="text-slate-400 text-xs italic truncate max-w-[200px]">{i.note}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusColor(i.status)}`}>
                            {statusLabel(i.status)}
                          </span>
                        </div>
                      </div>

                      {/* Qty + actions */}
                      <div className="flex items-center gap-3 mt-2">
                        {/* Qty adjuster */}
                        {i.status === 'attivo' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => i.quantity > 1 && updateImpegnoQty(i.id, i.quantity - 1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold transition-all">-</button>
                            <span className="text-slate-700 font-bold text-sm w-8 text-center">{i.quantity}</span>
                            <button onClick={() => updateImpegnoQty(i.id, i.quantity + 1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold transition-all">+</button>
                            <span className="text-slate-400 text-xs">{i.product?.unit || 'pz'}</span>
                          </div>
                        )}

                        {i.status !== 'attivo' && (
                          <span className="text-slate-500 text-sm font-bold">{i.quantity} {i.product?.unit || 'pz'}</span>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          {i.status === 'attivo' && (
                            <button
                              onClick={() => updateImpegnoStatus(i.id, 'evaso')}
                              title="Segna come evaso"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-all border border-emerald-100"
                            >
                              <Check className="w-3 h-3" />
                              Evadi
                            </button>
                          )}
                          {i.status === 'attivo' && (
                            <button
                              onClick={() => updateImpegnoStatus(i.id, 'annullato')}
                              title="Annulla"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold transition-all"
                            >
                              <XCircle className="w-3 h-3" />
                              Annulla
                            </button>
                          )}
                          {i.status !== 'attivo' && (
                            <button
                              onClick={() => updateImpegnoStatus(i.id, 'attivo')}
                              title="Riattiva"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 text-xs font-semibold transition-all border border-blue-100"
                            >
                              Riattiva
                            </button>
                          )}
                          <button
                            onClick={() => deleteImpegno(i.id)}
                            title="Elimina"
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {impegni.filter(i => i.status === 'attivo').length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
            <p className="text-xs text-slate-500 text-center">
              {impegni.filter(i => i.status === 'attivo').length} impegni attivi ·{' '}
              {impegni.filter(i => i.status === 'evaso').length} evasi ·{' '}
              {impegni.filter(i => i.status === 'annullato').length} annullati
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
