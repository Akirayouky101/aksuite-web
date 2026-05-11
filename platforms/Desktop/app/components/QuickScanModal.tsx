'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Package, ArrowUp, ArrowDown, Check, AlertCircle,
  Scan, RotateCcw, ChevronUp, ChevronDown, BookMarked, PlusCircle, Trash2
} from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { useImpegniMagazzino } from '../hooks/useImpegniMagazzino'

interface QuickScanModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onUpdateStock: (productId: string, movementType: 'carico' | 'scarico', qty: number, notes?: string) => Promise<void>
  findByBarcode: (barcode: string) => Product | undefined
  onAddProduct?: (data: Partial<Product>) => Promise<Product | null>
  canElettrico?: boolean
  canWarehouse?: boolean
}

type ScanMode = 'carico' | 'scarico' | 'impegno'

interface SessionItem {
  key: string
  product: Product
  qty: number
}

export default function QuickScanModal({
  isOpen, onClose, products, onUpdateStock, findByBarcode, onAddProduct, canElettrico, canWarehouse
}: QuickScanModalProps) {
  const [mode, setMode] = useState<ScanMode | null>(null)
  const [scanInput, setScanInput] = useState('')
  const [session, setSession] = useState<SessionItem[]>([])
  const [flash, setFlash] = useState<'success' | 'error' | 'notfound' | 'added' | null>(null)
  const [flashLabel, setFlashLabel] = useState('')
  const [processing, setProcessing] = useState(false)
  const [impegnoUser, setImpegnoUser] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState('')
  const [addForm, setAddForm] = useState({
    name: '', description: '', sku: '', brand: '', model: '',
    category: '', subcategory: '', unit: 'pz', warehouse: '',
    min_quantity: '0', location: '', shelf: '',
    purchase_price: '', sell_price: '', notes: ''
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const { addImpegno } = useImpegniMagazzino()

  const availableWarehouses = [
    ...(canElettrico ? [{ value: 'magazzino_elettrico', label: 'Mag. Elettrico' }] : []),
    ...(canWarehouse ? [{ value: 'magazzino_astzg', label: 'Mag. AST/ZG' }] : []),
  ]

  useEffect(() => {
    if (isOpen) {
      setMode(null)
      setScanInput('')
      setSession([])
      setFlash(null)
      setShowAddForm(false)
      setNotFoundBarcode('')
      setAddForm({ name: '', description: '', sku: '', brand: '', model: '', category: '', subcategory: '', unit: 'pz', warehouse: availableWarehouses[0]?.value || '', min_quantity: '0', location: '', shelf: '', purchase_price: '', sell_price: '', notes: '' })
      setImpegnoUser('')
      setProcessing(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (mode && !showAddForm) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [mode, showAddForm])

  const focusInput = () => setTimeout(() => inputRef.current?.focus(), 100)

  const triggerFlash = (type: typeof flash, label = '') => {
    setFlashLabel(label)
    setFlash(type)
    setTimeout(() => { setFlash(null); focusInput() }, type === 'success' ? 1500 : 900)
  }

  const handleScan = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setScanInput('')

    const product = findByBarcode(trimmed) || products.find(p =>
      p.name.toLowerCase() === trimmed.toLowerCase()
    )

    if (!product) {
      if (onAddProduct && availableWarehouses.length > 0) {
        setNotFoundBarcode(trimmed)
        setAddForm({ name: '', description: '', sku: '', brand: '', model: '', category: '', subcategory: '', unit: 'pz', warehouse: availableWarehouses[0].value, min_quantity: '0', location: '', shelf: '', purchase_price: '', sell_price: '', notes: '' })
        setShowAddForm(true)
      } else {
        triggerFlash('notfound')
      }
      return
    }

    setSession(prev => {
      const existing = prev.find(i => i.key === product.id)
      if (existing) {
        return prev.map(i => i.key === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { key: product.id, product, qty: 1 }]
    })
    triggerFlash('added', product.name)
  }

  const handleAddProduct = async () => {
    if (!addForm.name.trim() || !addForm.warehouse || !onAddProduct || processing) return
    setProcessing(true)
    try {
      const newProduct = await onAddProduct({
        name: addForm.name.trim(),
        description: addForm.description.trim() || null,
        sku: addForm.sku.trim() || null,
        barcode: notFoundBarcode || null,
        brand: addForm.brand.trim() || null,
        model: addForm.model.trim() || null,
        category: addForm.category.trim() || 'Generale',
        subcategory: addForm.subcategory.trim() || null,
        unit: addForm.unit || 'pz',
        quantity: 0,
        min_quantity: parseInt(addForm.min_quantity) || 0,
        location: addForm.location.trim() || null,
        shelf: addForm.shelf.trim() || null,
        purchase_price: parseFloat(addForm.purchase_price) || 0,
        sell_price: parseFloat(addForm.sell_price) || 0,
        notes: addForm.notes.trim() || null,
        warehouse: addForm.warehouse,
        is_active: true,
      })
      if (newProduct) {
        setShowAddForm(false)
        setNotFoundBarcode('')
        setSession(prev => [...prev, { key: newProduct.id, product: newProduct, qty: 1 }])
        focusInput()
      } else {
        triggerFlash('error')
      }
    } catch {
      triggerFlash('error')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!mode || session.length === 0 || processing) return
    if (mode === 'impegno' && !impegnoUser.trim()) return
    setProcessing(true)
    try {
      for (const item of session) {
        if (mode === 'impegno') {
          await addImpegno(impegnoUser.trim(), item.product.id, item.qty, 'Scansione veloce', '')
        } else {
          await onUpdateStock(item.product.id, mode, item.qty, 'Scansione veloce')
        }
      }
      const tot = session.reduce((a, i) => a + i.qty, 0)
      triggerFlash('success', `${session.length} prodotti · ${tot} pz`)
      setSession([])
    } catch {
      triggerFlash('error')
    } finally {
      setProcessing(false)
    }
  }

  const totalQty = session.reduce((a, i) => a + i.qty, 0)

  if (!isOpen) return null

  // ── STEP 1: scegli modalità ──────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">SCANSIONE VELOCE</h1>
              <p className="text-white/40 text-xs">Seleziona il tipo di movimento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <p className="text-white/50 text-base text-center">Che operazione vuoi fare?</p>
          <div className="flex gap-4 w-full max-w-lg">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setMode('carico')}
              className="flex-1 py-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center gap-3 font-black text-xl shadow-xl shadow-emerald-500/30"
            >
              <ArrowUp className="w-12 h-12" />
              CARICO
              <span className="text-sm font-normal opacity-70">Aggiungi al magazzino</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setMode('scarico')}
              className="flex-1 py-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex flex-col items-center justify-center gap-3 font-black text-xl shadow-xl shadow-red-500/30"
            >
              <ArrowDown className="w-12 h-12" />
              SCARICO
              <span className="text-sm font-normal opacity-70">Togli dal magazzino</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setMode('impegno')}
              className="flex-1 py-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex flex-col items-center justify-center gap-3 font-black text-xl shadow-xl shadow-violet-500/30"
            >
              <BookMarked className="w-12 h-12" />
              IMPEGNO
              <span className="text-sm font-normal opacity-70">Prenota prodotto</span>
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: scansione + lista ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none">SCANSIONE VELOCE</h1>
            <p className="text-white/40 text-xs">
              {session.length === 0
                ? 'Scansiona il primo prodotto...'
                : `${session.length} prodott${session.length === 1 ? 'o' : 'i'} · ${totalQty} pz totali`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode(null); setSession([]); setScanInput(''); setShowAddForm(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
              mode === 'carico'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : mode === 'scarico'
                ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                : 'bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25'
            }`}
          >
            {mode === 'carico' && <ArrowUp className="w-4 h-4" />}
            {mode === 'scarico' && <ArrowDown className="w-4 h-4" />}
            {mode === 'impegno' && <BookMarked className="w-4 h-4" />}
            {mode.toUpperCase()}
            <RotateCcw className="w-3 h-3 opacity-60" />
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Input area */}
        <div className="px-5 pt-4 pb-3 flex flex-col gap-3 flex-shrink-0">
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleScan(scanInput) }}
            disabled={showAddForm || processing}
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white text-xl font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-40 transition-all"
            placeholder="Scansiona o digita codice..."
            autoComplete="off"
            autoFocus
          />

          {mode === 'impegno' && (
            <input
              value={impegnoUser}
              onChange={e => setImpegnoUser(e.target.value)}
              placeholder="Nome operatore (obbligatorio)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          )}
        </div>

        {/* Add product form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-5 pb-3 flex-shrink-0"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-2 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-300 font-bold text-xs">Prodotto non trovato</p>
                  <p className="text-amber-400/60 text-xs font-mono">{notFoundBarcode}</p>
                </div>
                <button
                  onClick={() => { setShowAddForm(false); setNotFoundBarcode(''); focusInput() }}
                  className="text-white/30 hover:text-white/60 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <p className="text-white font-bold text-sm">Aggiungi al magazzino</p>
                </div>

                {/* Identificazione */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Identificazione</p>
                  <input
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome prodotto *"
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descrizione"
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all resize-none"
                  />
                  <div className="flex gap-2">
                    <input
                      value={addForm.sku}
                      onChange={e => setAddForm(f => ({ ...f, sku: e.target.value }))}
                      placeholder="SKU / Cod. articolo"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={addForm.unit}
                      onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="Unità"
                      className="w-20 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={addForm.brand}
                      onChange={e => setAddForm(f => ({ ...f, brand: e.target.value }))}
                      placeholder="Marca / Brand"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={addForm.model}
                      onChange={e => setAddForm(f => ({ ...f, model: e.target.value }))}
                      placeholder="Modello"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                {/* Classificazione */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Classificazione</p>
                  <div className="flex gap-2">
                    <input
                      value={addForm.category}
                      onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="Categoria"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={addForm.subcategory}
                      onChange={e => setAddForm(f => ({ ...f, subcategory: e.target.value }))}
                      placeholder="Sottocategoria"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                {/* Posizione */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Posizione magazzino</p>
                  <div className="flex gap-2">
                    <input
                      value={addForm.location}
                      onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Zona / Locale"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                    <input
                      value={addForm.shelf}
                      onChange={e => setAddForm(f => ({ ...f, shelf: e.target.value }))}
                      placeholder="Scaffale"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <input
                    value={addForm.min_quantity}
                    type="number"
                    min="0"
                    onChange={e => setAddForm(f => ({ ...f, min_quantity: e.target.value }))}
                    placeholder="Quantità minima scorta"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                {/* Prezzi */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Prezzi (€)</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        value={addForm.purchase_price}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={e => setAddForm(f => ({ ...f, purchase_price: e.target.value }))}
                        placeholder="Prezzo acquisto"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        value={addForm.sell_price}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={e => setAddForm(f => ({ ...f, sell_price: e.target.value }))}
                        placeholder="Prezzo vendita"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Note</p>
                  <textarea
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Note aggiuntive..."
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all resize-none"
                  />
                </div>

                {/* Magazzino */}
                {availableWarehouses.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Magazzino *</p>
                    <div className="flex gap-2">
                      {availableWarehouses.map(w => (
                        <button
                          key={w.value}
                          onClick={() => setAddForm(f => ({ ...f, warehouse: w.value }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            addForm.warehouse === w.value
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {availableWarehouses.length === 1 && (
                  <p className="text-white/30 text-xs">
                    Magazzino: <span className="text-white/60 font-semibold">{availableWarehouses[0].label}</span>
                  </p>
                )}

                <button
                  onClick={handleAddProduct}
                  disabled={processing || !addForm.name.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  AGGIUNGI E CONTINUA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {session.length === 0 && !showAddForm && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-25 select-none">
              <Scan className="w-16 h-16 text-white" />
              <p className="text-white text-sm font-semibold">Inizia a scansionare...</p>
              <p className="text-white/70 text-xs text-center">
                Ogni barcode viene aggiunto alla lista.<br />
                Ri-scansiona lo stesso prodotto per aumentare la quantità.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 py-2">
            <AnimatePresence initial={false}>
              {session.map(item => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    mode === 'carico' ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : mode === 'scarico' ? 'bg-red-500/20 border border-red-500/30'
                    : 'bg-violet-500/20 border border-violet-500/30'
                  }`}>
                    <Package className={`w-4 h-4 ${
                      mode === 'carico' ? 'text-emerald-400'
                      : mode === 'scarico' ? 'text-red-400'
                      : 'text-violet-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate leading-tight">{item.product.name}</p>
                    <p className="text-white/40 text-xs truncate">{item.product.sku || item.product.barcode || '—'}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSession(prev =>
                        prev.map(i => i.key === item.key ? { ...i, qty: Math.max(1, i.qty - 1) } : i)
                      )}
                      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 transition-all active:scale-90"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    <span className={`text-2xl font-black w-9 text-center tabular-nums ${
                      mode === 'carico' ? 'text-emerald-400'
                      : mode === 'scarico' ? 'text-red-400'
                      : 'text-violet-400'
                    }`}>
                      {item.qty}
                    </span>

                    <button
                      onClick={() => setSession(prev =>
                        prev.map(i => i.key === item.key ? { ...i, qty: i.qty + 1 } : i)
                      )}
                      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 transition-all active:scale-90"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSession(prev => prev.filter(i => i.key !== item.key))}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all active:scale-90 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Confirm bar */}
        {session.length > 0 && (
          <div className="px-5 pb-5 pt-3 border-t border-white/10 flex-shrink-0">
            {mode === 'impegno' && !impegnoUser.trim() && (
              <p className="text-amber-400 text-xs text-center mb-2">
                ⚠ Inserisci il nome operatore prima di confermare
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={processing || (mode === 'impegno' && !impegnoUser.trim())}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 text-white shadow-xl disabled:opacity-50 transition-all ${
                mode === 'carico'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30'
                  : mode === 'scarico'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
                  : 'bg-gradient-to-r from-violet-500 to-purple-700 shadow-violet-500/30'
              }`}
            >
              {mode === 'carico' && <ArrowUp className="w-6 h-6" />}
              {mode === 'scarico' && <ArrowDown className="w-6 h-6" />}
              {mode === 'impegno' && <BookMarked className="w-6 h-6" />}
              CONFERMA {mode.toUpperCase()} — {session.length} prodott{session.length === 1 ? 'o' : 'i'} · {totalQty} pz
            </motion.button>
          </div>
        )}
      </div>

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className={`px-8 py-6 rounded-3xl flex flex-col items-center justify-center shadow-2xl gap-2 min-w-[160px] max-w-xs ${
                flash === 'success' ? 'bg-emerald-500'
                : flash === 'added' ? 'bg-cyan-600'
                : flash === 'notfound' ? 'bg-amber-500'
                : 'bg-red-500'
              }`}
            >
              {flash === 'success' && <Check className="w-14 h-14 text-white" />}
              {flash === 'added' && <PlusCircle className="w-10 h-10 text-white" />}
              {(flash === 'notfound' || flash === 'error') && <AlertCircle className="w-10 h-10 text-white" />}
              <p className="text-white text-sm font-black text-center leading-tight">
                {flash === 'success' ? 'COMPLETATO!'
                  : flash === 'added' ? (flashLabel || 'AGGIUNTO')
                  : flash === 'notfound' ? 'NON TROVATO'
                  : 'ERRORE'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
