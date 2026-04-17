'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Plus, Minus, Trash2, PackageCheck, ArrowRight, CheckCircle2, Package, ChevronLeft } from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { RequestItem, WarehouseRequest } from '../hooks/useWarehouseRequests'

interface MaterialRequestModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onSubmit: (requestedBy: string, items: RequestItem[], notes?: string) => Promise<WarehouseRequest | null>
}

type Step = 'welcome' | 'form' | 'done'

export default function MaterialRequestModal({ isOpen, onClose, products, onSubmit }: MaterialRequestModalProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [requestedBy, setRequestedBy] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<RequestItem[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [qtyPicker, setQtyPicker] = useState<{ product: Product; qty: number } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const searchResults = search.trim().length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 12)
    : []

  const addItem = (product: Product, qty: number) => {
    if (qty <= 0) return
    setItems(prev => {
      const existing = prev.findIndex(i => i.product_id === product.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + qty }
        return updated
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: qty,
        unit: product.unit || 'pz',
      }]
    })
    setQtyPicker(null)
    setSearch('')
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  const updateItemQty = (productId: string, delta: number) => {
    setItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ).filter(i => i.quantity > 0))
  }

  const handleSubmit = async () => {
    if (!requestedBy.trim() || items.length === 0 || submitting) return
    setSubmitting(true)
    const result = await onSubmit(requestedBy, items, notes)
    setSubmitting(false)
    if (result) setStep('done')
  }

  const handleClose = () => {
    setStep('welcome')
    setRequestedBy('')
    setSearch('')
    setItems([])
    setNotes('')
    setQtyPicker(null)
    onClose()
  }

  const handleNewRequest = () => {
    setStep('welcome')
    setRequestedBy('')
    setSearch('')
    setItems([])
    setNotes('')
    setQtyPicker(null)
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop — molto scuro per dare senso "kiosk" */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={step === 'welcome' ? handleClose : undefined} />

      <AnimatePresence mode="wait">

        {/* ══════ STEP 1: WELCOME — grande pulsante centrale ══════ */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            <button onClick={handleClose} className="absolute top-[-60px] right-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all" title="Chiudi">
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Icona grande */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 shadow-2xl shadow-orange-500/40 flex items-center justify-center mb-8"
            >
              <PackageCheck className="w-16 h-16 text-white" />
            </motion.div>

            {/* Pulsante enorme */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setStep('form'); setTimeout(() => searchRef.current?.focus(), 200) }}
              className="w-[320px] sm:w-[420px] py-8 px-10 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all border border-orange-300/30"
            >
              <p className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">PRELIEVO</p>
              <p className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">MATERIALE</p>
              <p className="text-sm font-medium text-orange-100/80 mt-3">Tocca per iniziare</p>
            </motion.button>

            <p className="text-white/40 text-sm mt-8">Magazzino AK Suite</p>
          </motion.div>
        )}

        {/* ══════ STEP 2: FORM ══════ */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-2xl mx-4"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[92vh]">

              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-orange-400 to-red-500 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('welcome')} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Torna indietro">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">PRELIEVO MATERIALE</h2>
                    <p className="text-orange-100/80 text-xs mt-0.5">{totalItems > 0 ? `${items.length} prodott${items.length === 1 ? 'o' : 'i'} • ${totalItems} pezzi totali` : 'Compila la richiesta'}</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Chiudi">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Chi sei */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Chi sei? *</label>
                  <input
                    value={requestedBy}
                    onChange={e => setRequestedBy(e.target.value)}
                    placeholder="Scrivi il tuo nome..."
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 font-medium"
                  />
                </div>

                {/* Cerca prodotto */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cerca prodotto</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Nome, SKU, marca..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300"
                    />
                  </div>

                  {/* Risultati ricerca */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setQtyPicker({ product: p, qty: 1 })}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-slate-100/80 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.sku ? `SKU: ${p.sku} • ` : ''}{p.brand || ''} • Disponibile: {p.quantity} {p.unit}</p>
                          </div>
                          <Plus className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {search.trim().length > 1 && searchResults.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400 text-center py-2">Nessun prodotto trovato</p>
                  )}
                </div>

                {/* Selezione quantità */}
                <AnimatePresence>
                  {qtyPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-orange-50 border border-orange-200/60"
                    >
                      <p className="text-sm font-bold text-slate-700 mb-3 truncate">{qtyPicker.product.name}</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQtyPicker(p => p ? { ...p, qty: Math.max(1, p.qty - 1) } : null)}
                          title="Diminuisci quantità"
                          className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-all">
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <input
                          type="number" min="1"
                          value={qtyPicker.qty}
                          onChange={e => setQtyPicker(p => p ? { ...p, qty: Math.max(1, Number(e.target.value)) } : null)}
                          className="w-20 text-center text-xl font-bold text-slate-800 bg-white border border-orange-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                          title="Quantità"
                        />
                        <button onClick={() => setQtyPicker(p => p ? { ...p, qty: p.qty + 1 } : null)}
                          title="Aumenta quantità"
                          className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-all">
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-sm text-slate-400 flex-1">{qtyPicker.product.unit}</span>
                        <button
                          onClick={() => addItem(qtyPicker.product, qtyPicker.qty)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-sm shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 transition-all flex items-center gap-2"
                        >
                          Aggiungi <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => setQtyPicker(null)} title="Annulla" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50 transition-all">
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lista prodotti aggiunti */}
                {items.length > 0 && (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Prodotti richiesti ({items.length})</label>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.product_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400/20 to-red-400/20 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                            {item.sku && <p className="text-xs text-slate-400 font-mono">{item.sku}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateItemQty(item.product_id, -1)} title="Riduci quantità" className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 transition-all">
                              <Minus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                            <button onClick={() => updateItemQty(item.product_id, 1)} title="Aumenta quantità" className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-emerald-300 transition-all">
                              <Plus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className="text-xs text-slate-400 ml-1 w-6">{item.unit}</span>
                          </div>
                          <button onClick={() => removeItem(item.product_id)} title="Rimuovi" className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Note (opzionale)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Motivo del prelievo, progetto, ecc..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 resize-none"
                  />
                </div>
              </div>

              {/* Footer pulsante invia */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white/60 flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={!requestedBy.trim() || items.length === 0 || submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-black text-lg shadow-xl shadow-orange-400/30 hover:shadow-orange-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <span className="text-base">Invio in corso...</span>
                  ) : (
                    <>
                      <PackageCheck className="w-6 h-6" />
                      INVIA RICHIESTA
                      {items.length > 0 && <span className="text-sm font-medium text-orange-100">({totalItems} pezzi)</span>}
                    </>
                  )}
                </button>
                {(!requestedBy.trim() || items.length === 0) && (
                  <p className="text-center text-xs text-slate-400 mt-2">
                    {!requestedBy.trim() ? 'Inserisci il tuo nome' : 'Aggiungi almeno un prodotto'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 3: DONE ══════ */}
        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-400/40 flex items-center justify-center mb-8"
            >
              <CheckCircle2 className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-4xl font-black text-white mb-3">RICHIESTA INVIATA</h2>
            <p className="text-emerald-300 text-lg mb-2">L&apos;ufficio riceverà la notifica</p>
            <p className="text-white/50 text-sm mb-10">e approverà il prelievo a breve</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleNewRequest}
                className="px-8 py-4 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-base shadow-xl shadow-orange-500/30"
              >
                Nuovo Prelievo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition-all"
              >
                Chiudi
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
