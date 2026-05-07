'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Plus, Minus, Trash2, PackageCheck, ArrowRight, CheckCircle2,
  Package, ChevronLeft, ChevronDown, Calendar, Truck, ClipboardList, AlertCircle, Layers, Ticket, Users
} from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { RequestItem, WarehouseRequest, UserProfile } from '../hooks/useWarehouseRequests'

interface MaterialRequestModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  users: UserProfile[]
  kioskMode?: boolean
  onOpenKits?: () => void
  onOpenTickets?: () => void
  onSubmit: (
    requestedBy: string,
    items: RequestItem[],
    notes?: string,
    requestType?: 'prelievo' | 'ordine',
    expectedDate?: string
  ) => Promise<WarehouseRequest | null>
}

type Step = 'user_select' | 'welcome' | 'form' | 'review' | 'done'

export default function MaterialRequestModal({ isOpen, onClose, products, users, kioskMode = false, onOpenKits, onOpenTickets, onSubmit }: MaterialRequestModalProps) {
  const [step, setStep] = useState<Step>(kioskMode ? 'user_select' : 'welcome')
  const [requestType, setRequestType] = useState<'prelievo' | 'ordine'>('prelievo')
  const [selectedUser, setSelectedUser] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<RequestItem[]>([])
  const [notes, setNotes] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [qtyPicker, setQtyPicker] = useState<{ product: Product; qty: number } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  // Kiosk mode: auto-torna al welcome dopo 5s dalla schermata done (mantieni utente)
  useEffect(() => {
    if (step !== 'done' || !kioskMode) return
    const t = setTimeout(() => {
      setStep('welcome')
      setRequestType('prelievo')
      setSearch('')
      setItems([])
      setNotes('')
      setExpectedDate('')
      setQtyPicker(null)
    }, 5000)
    return () => clearTimeout(t)
  }, [step, kioskMode])

  if (!isOpen) return null

  // Tutti i profili caricati dall'hook (già filtrati con full_name o email)
  const enabledUsers = users

  const searchResults = search.trim().length > 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
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

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.product_id !== productId))

  const updateItemQty = (productId: string, delta: number) => {
    setItems(prev => prev
      .map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    )
  }

  const handleSubmit = async () => {
    if (!selectedUser || items.length === 0 || submitting) return
    setSubmitting(true)
    const result = await onSubmit(
      selectedUser,
      items,
      notes,
      requestType,
      requestType === 'ordine' ? expectedDate : undefined
    )
    setSubmitting(false)
    if (result) setStep('done')
  }

  const handleClose = () => {
    setStep('welcome')
    setRequestType('prelievo')
    setSelectedUser('')
    setSearch('')
    setItems([])
    setNotes('')
    setExpectedDate('')
    setQtyPicker(null)
    if (!kioskMode) onClose()
  }

  const handleNewRequest = () => {
    setStep('welcome')
    setRequestType('prelievo')
    if (!kioskMode) setSelectedUser('')
    setSearch('')
    setItems([])
    setNotes('')
    setExpectedDate('')
    setQtyPicker(null)
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const canGoToReview = selectedUser && items.length > 0 && (requestType === 'prelievo' || expectedDate)

  const formatDate = (d: string) => {
    if (!d) return ''
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={step === 'welcome' && !kioskMode ? handleClose : undefined} />

      <AnimatePresence mode="wait">

        {/* ══════ STEP 0: USER SELECT (Kiosk only) ══════ */}
        {step === 'user_select' && (
          <motion.div
            key="user_select"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-600 shadow-2xl shadow-violet-500/40 flex items-center justify-center mb-8"
            >
              <Users className="w-14 h-14 text-white" />
            </motion.div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">CHI SEI?</h1>
            <p className="text-white/50 text-base mb-10">Seleziona il tuo nome per iniziare</p>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              {enabledUsers.map(u => (
                <motion.button
                  key={u.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedUser(u.full_name || u.email); setStep('welcome') }}
                  className="w-[220px] py-8 px-8 rounded-3xl bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xl transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-4">
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xl font-black tracking-tight">{u.full_name || u.email}</p>
                </motion.button>
              ))}
              {enabledUsers.length === 0 && (
                <p className="text-white/50 text-sm">Nessun utente configurato</p>
              )}
            </div>

            <p className="text-white/40 text-sm mt-8">Magazzino AK Suite</p>
          </motion.div>
        )}

        {/* ══════ STEP 1: WELCOME ══════ */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            {!kioskMode && (
              <button onClick={handleClose} className="absolute top-[-60px] right-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all" title="Chiudi">
                <X className="w-5 h-5 text-white" />
              </button>
            )}

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 shadow-2xl shadow-orange-500/40 flex items-center justify-center mb-8"
            >
              <PackageCheck className="w-14 h-14 text-white" />
            </motion.div>

            {kioskMode && selectedUser && (
              <div className="flex items-center gap-3 mb-8 bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                  {selectedUser.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-bold text-lg">{selectedUser}</p>
                <button
                  onClick={() => { setSelectedUser(''); setStep('user_select') }}
                  className="ml-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white text-xs font-semibold transition-all"
                >
                  Cambia utente
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              {/* Prelievo immediato */}
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setRequestType('prelievo'); setStep('form'); setTimeout(() => searchRef.current?.focus(), 200) }}
                className="w-[280px] py-7 px-8 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all border border-orange-300/30"
              >
                <div className="flex items-center justify-center mb-3">
                  <Package className="w-10 h-10" />
                </div>
                <p className="text-2xl font-black tracking-tight">PRELIEVO</p>
                <p className="text-2xl font-black tracking-tight">MATERIALE</p>
                <p className="text-xs font-medium text-orange-100/70 mt-2">Lo prendo adesso</p>
              </motion.button>

              {/* Ordine futuro */}
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setRequestType('ordine'); setStep('form'); setTimeout(() => searchRef.current?.focus(), 200) }}
                className="w-[280px] py-7 px-8 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all border border-blue-300/30"
              >
                <div className="flex items-center justify-center mb-3">
                  <Truck className="w-10 h-10" />
                </div>
                <p className="text-2xl font-black tracking-tight">ORDINE</p>
                <p className="text-2xl font-black tracking-tight">MATERIALE</p>
                <p className="text-xs font-medium text-blue-100/70 mt-2">Mi serve per una data</p>
              </motion.button>

              {/* Consulta KIT */}
              {onOpenKits && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={onOpenKits}
                  className="w-[280px] py-7 px-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all border border-emerald-300/30"
                >
                  <div className="flex items-center justify-center mb-3">
                    <Layers className="w-10 h-10" />
                  </div>
                  <p className="text-2xl font-black tracking-tight">CONSULTA</p>
                  <p className="text-2xl font-black tracking-tight">KIT</p>
                  <p className="text-xs font-medium text-emerald-100/70 mt-2">Verifica disponibilità</p>
                </motion.button>
              )}

              {/* Ticket */}
              {onOpenTickets && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={onOpenTickets}
                  className="w-[280px] py-7 px-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all border border-violet-300/30"
                >
                  <div className="flex items-center justify-center mb-3">
                    <Ticket className="w-10 h-10" />
                  </div>
                  <p className="text-2xl font-black tracking-tight">APRI</p>
                  <p className="text-2xl font-black tracking-tight">TICKET</p>
                  <p className="text-xs font-medium text-violet-100/70 mt-2">Segnalazione o richiesta</p>
                </motion.button>
              )}
            </div>

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

              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-5 flex-shrink-0 ${requestType === 'prelievo' ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('welcome')} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Indietro">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {requestType === 'prelievo' ? 'PRELIEVO MATERIALE' : 'ORDINE MATERIALE'}
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">
                      {items.length > 0 ? `${items.length} prodott${items.length === 1 ? 'o' : 'i'} · ${totalItems} pezzi` : requestType === 'prelievo' ? 'Registra il materiale prelevato' : 'Prenotazione per data futura'}
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Chiudi">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Chi sei — in kiosk mostra chip con nome + bottone cambia; altrimenti dropdown */}
                {kioskMode ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                      {selectedUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Operatore</p>
                      <p className="text-base font-bold text-slate-800">{selectedUser}</p>
                    </div>
                    <button onClick={() => { setStep('user_select'); setSelectedUser('') }} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold underline">Cambia</button>
                  </div>
                ) : (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Chi sei? *</label>
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-50 border text-base font-medium transition-all ${selectedUser ? 'text-slate-800 border-slate-200' : 'text-slate-300 border-slate-200'} focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300`}
                    >
                      <span>{selectedUser || 'Seleziona il tuo nome...'}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute z-50 w-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
                        >
                          {enabledUsers.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">Nessun utente impostato</p>
                          )}
                          {enabledUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setSelectedUser(u.full_name || u.email); setUserDropdownOpen(false) }}
                              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-slate-100/80 last:border-0 ${selectedUser === (u.full_name || u.email) ? 'bg-orange-50/60' : ''}`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                {(u.full_name || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{u.full_name || '—'}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                              {selectedUser === (u.full_name || u.email) && <CheckCircle2 className="w-4 h-4 text-orange-400 ml-auto flex-shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                )}

                {/* Data (solo per ordini) */}
                {requestType === 'ordine' && (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Quando ti serve? *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                      <input
                        type="date"
                        value={expectedDate}
                        onChange={e => setExpectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        title="Data richiesta"
                        aria-label="Data richiesta"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300"
                      />
                    </div>
                    {expectedDate && (
                      <p className="text-xs text-blue-500 font-medium mt-1.5 capitalize">{formatDate(expectedDate)}</p>
                    )}
                  </div>
                )}

                {/* Cerca prodotto */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cerca prodotto (nome, SKU, barcode)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Cerca per nome, SKU, codice, marca..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300"
                    />
                  </div>
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
                            <p className="text-xs text-slate-400">
                              {p.sku ? `SKU: ${p.sku}` : ''}{p.brand ? ` · ${p.brand}` : ''} · Disp: <span className={`font-semibold ${p.quantity <= p.min_quantity ? 'text-red-500' : 'text-emerald-600'}`}>{p.quantity} {p.unit}</span>
                            </p>
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

                {/* Selettore quantità */}
                <AnimatePresence>
                  {qtyPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-orange-50 border border-orange-200/60"
                    >
                      <p className="text-sm font-bold text-slate-700 mb-3 truncate">{qtyPicker.product.name}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => setQtyPicker(p => p ? { ...p, qty: Math.max(1, p.qty - 1) } : null)}
                          title="Diminuisci"
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
                          title="Aumenta"
                          className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-all">
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-sm text-slate-400">{qtyPicker.product.unit}</span>
                        <button
                          onClick={() => addItem(qtyPicker.product, qtyPicker.qty)}
                          className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-sm shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 transition-all flex items-center justify-center gap-2"
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
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Prodotti selezionati ({items.length})
                    </label>
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
                            <button onClick={() => updateItemQty(item.product_id, -1)} title="Riduci" className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 transition-all">
                              <Minus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                            <button onClick={() => updateItemQty(item.product_id, 1)} title="Aumenta" className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-emerald-300 transition-all">
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
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    {requestType === 'ordine' ? 'Motivazione / Progetto' : 'Note (opzionale)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={requestType === 'ordine' ? 'Es: Per mercoledì servono 4 Serial Bus per il cantiere Rossi...' : 'Motivo del prelievo, cantiere, progetto...'}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white/60 flex-shrink-0">
                <button
                  onClick={() => canGoToReview && setStep('review')}
                  disabled={!canGoToReview}
                  className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${requestType === 'prelievo' ? 'bg-gradient-to-r from-orange-400 to-red-500 shadow-orange-400/30 hover:shadow-orange-400/50' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-400/30 hover:shadow-blue-400/50'}`}
                >
                  <ClipboardList className="w-6 h-6" />
                  CONTROLLA LISTA
                  {items.length > 0 && <span className="text-sm font-medium opacity-80">({totalItems} pezzi)</span>}
                </button>
                {(!selectedUser || items.length === 0 || (requestType === 'ordine' && !expectedDate)) && (
                  <p className="text-center text-xs text-slate-400 mt-2">
                    {!selectedUser ? 'Seleziona il tuo nome' : !expectedDate && requestType === 'ordine' ? 'Inserisci la data' : 'Aggiungi almeno un prodotto'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 3: REVIEW — lista finale prima di inviare ══════ */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-2xl mx-4"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[92vh]">

              {/* Header review */}
              <div className={`flex items-center justify-between px-6 py-5 flex-shrink-0 ${requestType === 'prelievo' ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('form')} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Modifica">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">CONTROLLA LA LISTA</h2>
                    <p className="text-white/70 text-xs mt-0.5">Verifica il materiale prima di confermare</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all" title="Chiudi">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* Riepilogo info */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-black">
                      {selectedUser.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operatore</p>
                      <p className="text-sm font-bold text-slate-800">{selectedUser}</p>
                    </div>
                  </div>
                  {requestType === 'ordine' && expectedDate && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data</p>
                        <p className="text-sm font-semibold text-blue-600 capitalize">{formatDate(expectedDate)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${requestType === 'prelievo' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                      {requestType === 'prelievo' ? 'PRELIEVO IMMEDIATO' : 'ORDINE FUTURO'}
                    </div>
                  </div>
                </div>

                {/* Lista materiale — grande e chiara */}
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Materiale ({items.length} articol{items.length === 1 ? 'o' : 'i'} · {totalItems} pezzi totali)
                  </p>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.product_id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-800 truncate">{item.product_name}</p>
                          {item.sku && <p className="text-xs text-slate-400 font-mono">{item.sku}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black text-slate-800">{item.quantity}</p>
                          <p className="text-xs text-slate-400">{item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {notes && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Note</p>
                    <p className="text-sm text-slate-700">{notes}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-500">
                    {requestType === 'prelievo'
                      ? 'Il prelievo verrà registrato nel log del magazzino. L\'ufficio potrà verificare il materiale.'
                      : 'L\'ordine sarà visibile all\'ufficio che preparerà il materiale per la data indicata.'}
                  </p>
                </div>
              </div>

              {/* Footer review */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white/60 flex-shrink-0 flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-none px-5 py-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Modifica
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 py-4 rounded-xl text-white font-black text-lg shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${requestType === 'prelievo' ? 'bg-gradient-to-r from-orange-400 to-red-500 shadow-orange-400/30 hover:shadow-orange-400/50' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-400/30 hover:shadow-blue-400/50'}`}
                >
                  {submitting ? (
                    <span className="text-base">Invio...</span>
                  ) : (
                    <>
                      <PackageCheck className="w-6 h-6" />
                      {requestType === 'prelievo' ? 'CONFERMA PRELIEVO' : 'INVIA ORDINE'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 4: DONE ══════ */}
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

            <h2 className="text-4xl font-black text-white mb-3">
              {requestType === 'prelievo' ? 'PRELIEVO REGISTRATO' : 'ORDINE INVIATO'}
            </h2>
            <p className="text-emerald-300 text-lg mb-2">
              {requestType === 'prelievo' ? 'Il log è stato aggiornato' : 'L\'ufficio preparerà il materiale'}
            </p>
            <p className="text-white/50 text-sm mb-10">Grazie, {selectedUser}!</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleNewRequest}
                className="px-8 py-4 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-base shadow-xl shadow-orange-500/30"
              >
                Altra operazione
              </motion.button>
              {!kioskMode && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition-all"
                >
                  Chiudi
                </motion.button>
              )}
            </div>
            {kioskMode && (
              <p className="text-white/40 text-sm mt-5">Ritorno automatico tra 5 secondi...</p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}


