'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Package, ArrowUp, ArrowDown, Check, AlertCircle,
  Scan, RotateCcw, ChevronUp, ChevronDown, BookMarked, PlusCircle
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

interface RecentScan {
  id: string
  product: Product
  mode: ScanMode
  qty: number
  userName?: string
}

export default function QuickScanModal({ isOpen, onClose, products, onUpdateStock, findByBarcode, onAddProduct, canElettrico, canWarehouse }: QuickScanModalProps) {
  const [mode, setMode] = useState<ScanMode | null>(null)
  const [scanInput, setScanInput] = useState('')
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [flash, setFlash] = useState<'success' | 'error' | 'notfound' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showModeChoice, setShowModeChoice] = useState(false)
  const [impegnoUser, setImpegnoUser] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState('')
  const [addForm, setAddForm] = useState({ name: '', category: '', unit: 'pz', warehouse: '' })
  const inputRef = useRef<HTMLInputElement>(null)
  const { addImpegno } = useImpegniMagazzino()

  const availableWarehouses = [
    ...(canElettrico ? [{ value: 'magazzino_elettrico', label: 'Magazzino Elettrico' }] : []),
    ...(canWarehouse ? [{ value: 'magazzino_astzg', label: 'Magazzino AST/ZG' }] : []),
  ]

  useEffect(() => {
    if (isOpen) {
      setMode(null)
      setScanInput('')
      setFoundProduct(null)
      setQty(1)
      setFlash(null)
      setShowModeChoice(false)
      setShowAddForm(false)
      setNotFoundBarcode('')
      setAddForm({ name: '', category: '', unit: 'pz', warehouse: availableWarehouses[0]?.value || '' })
      setRecentScans([])
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  const resetToScan = () => {
    setScanInput('')
    setFoundProduct(null)
    setQty(1)
    setShowModeChoice(false)
    setShowAddForm(false)
    setNotFoundBarcode('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleScan = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    const product = findByBarcode(trimmed) || products.find(p =>
      p.name.toLowerCase() === trimmed.toLowerCase()
    )

    if (!product) {
      if (onAddProduct && availableWarehouses.length > 0) {
        setNotFoundBarcode(trimmed)
        setAddForm({ name: '', category: '', unit: 'pz', warehouse: availableWarehouses[0].value })
        setShowAddForm(true)
        setScanInput('')
      } else {
        setFlash('notfound')
        setTimeout(() => { setFlash(null); setScanInput(''); inputRef.current?.focus() }, 1500)
      }
      return
    }

    setFoundProduct(product)
    setQty(1)

    if (!mode) {
      setShowModeChoice(true)
    }
  }

  const handleAddProduct = async () => {
    if (!addForm.name.trim() || !addForm.warehouse || !onAddProduct || processing) return
    setProcessing(true)
    try {
      const newProduct = await onAddProduct({
        name: addForm.name.trim(),
        barcode: notFoundBarcode,
        category: addForm.category.trim() || 'Generale',
        unit: addForm.unit || 'pz',
        quantity: 0,
        warehouse: addForm.warehouse,
        is_active: true,
      })
      if (newProduct) {
        setShowAddForm(false)
        setNotFoundBarcode('')
        setFoundProduct(newProduct)
        setQty(1)
        if (!mode) setShowModeChoice(true)
      } else {
        setFlash('error')
        setTimeout(() => setFlash(null), 1500)
      }
    } catch {
      setFlash('error')
      setTimeout(() => setFlash(null), 1500)
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = async (selectedMode?: ScanMode) => {
    const activeMode = selectedMode || mode
    if (!foundProduct || !activeMode || processing) return
    if (activeMode === 'impegno' && !impegnoUser.trim()) return

    setProcessing(true)
    try {
      if (activeMode === 'impegno') {
        await addImpegno(impegnoUser.trim(), foundProduct.id, qty, 'Scansione veloce', '')
      } else {
        await onUpdateStock(foundProduct.id, activeMode, qty, 'Scansione veloce')
      }
      if (selectedMode) setMode(selectedMode)

      setRecentScans(prev => [{
        id: Date.now().toString(),
        product: foundProduct,
        mode: activeMode,
        qty,
        userName: activeMode === 'impegno' ? impegnoUser.trim() : undefined,
      }, ...prev].slice(0, 8))

      setFlash('success')
      setTimeout(() => {
        setFlash(null)
        resetToScan()
      }, 1000)
    } catch {
      setFlash('error')
      setTimeout(() => setFlash(null), 1500)
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

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
            <p className="text-white/40 text-xs">Carico / Scarico rapido</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode indicator + toggle */}
          {mode && (
            <button
              onClick={() => {
                const next: ScanMode = mode === 'carico' ? 'scarico' : mode === 'scarico' ? 'impegno' : 'carico'
                setMode(next)
                resetToScan()
              }}
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
          )}

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 py-6">

        {/* Scan input */}
        <div className="w-full max-w-lg">
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleScan(scanInput) }}
            disabled={!!foundProduct || showAddForm}
            className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-5 py-5 text-white text-xl font-mono placeholder-white/25 focus:outline-none focus:border-cyan-500/50 focus:bg-white/12 disabled:opacity-40 transition-all"
            placeholder="Scansiona o digita codice..."
            autoComplete="off"
            autoFocus
          />
          {!foundProduct && !showModeChoice && !showAddForm && (
            <p className="text-white/30 text-xs text-center mt-2">Barcode · SKU · QR code — premi Enter per confermare</p>
          )}
        </div>

        {/* Add product form (barcode not found) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-lg"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 font-bold text-sm">Prodotto non trovato</p>
                  <p className="text-amber-400/60 text-xs font-mono">{notFoundBarcode}</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <p className="text-white font-bold text-sm">Aggiungi al magazzino</p>
                </div>

                {/* Nome */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-1">Nome prodotto *</label>
                  <input
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Es. Interruttore magnetotermico 16A"
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                {/* Categoria + Unità */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-1">Categoria</label>
                    <input
                      value={addForm.category}
                      onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="Es. Elettrico"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-1">Unità</label>
                    <input
                      value={addForm.unit}
                      onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="pz"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                {/* Magazzino selector (only if both available) */}
                {availableWarehouses.length > 1 && (
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Magazzino</label>
                    <div className="flex gap-2">
                      {availableWarehouses.map(w => (
                        <button
                          key={w.value}
                          onClick={() => setAddForm(f => ({ ...f, warehouse: w.value }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            addForm.warehouse === w.value
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-white/5 text-white/50 border-white/15 hover:bg-white/10'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {availableWarehouses.length === 1 && (
                  <p className="text-white/30 text-xs">Magazzino: <span className="text-white/60 font-semibold">{availableWarehouses[0].label}</span></p>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddProduct}
                  disabled={processing || !addForm.name.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  AGGIUNGI E CONTINUA
                </motion.button>
              </div>

              <button onClick={resetToScan} className="w-full mt-3 py-2 text-white/40 hover:text-white/60 text-sm transition-all">
                ← Annulla
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode choice (first scan) */}
        <AnimatePresence>
          {showModeChoice && foundProduct && (
            <motion.div
              key="mode-choice"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white/8 border border-white/15 rounded-2xl p-5 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{foundProduct.name}</p>
                    <p className="text-white/50 text-xs">{foundProduct.sku || foundProduct.barcode} · Giacenza: <span className="text-white/70">{foundProduct.quantity} {foundProduct.unit || 'pz'}</span></p>
                  </div>
                </div>
              </div>

              <p className="text-white/50 text-sm text-center mb-3">Scegli il tipo di movimento:</p>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleConfirm('carico')}
                  disabled={processing}
                  className="flex-1 py-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center gap-2 font-black text-xl shadow-xl shadow-emerald-500/30 disabled:opacity-50"
                >
                  <ArrowUp className="w-9 h-9" />
                  CARICO
                  <span className="text-xs font-normal opacity-70">Aggiungi al magazzino</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleConfirm('scarico')}
                  disabled={processing}
                  className="flex-1 py-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex flex-col items-center justify-center gap-2 font-black text-xl shadow-xl shadow-red-500/30 disabled:opacity-50"
                >
                  <ArrowDown className="w-9 h-9" />
                  SCARICO
                  <span className="text-xs font-normal opacity-70">Togli dal magazzino</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMode('impegno'); setShowModeChoice(false) }}
                  disabled={processing}
                  className="flex-1 py-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex flex-col items-center justify-center gap-2 font-black text-xl shadow-xl shadow-violet-500/30 disabled:opacity-50"
                >
                  <BookMarked className="w-9 h-9" />
                  IMPEGNO
                  <span className="text-xs font-normal opacity-70">Prenota prodotto</span>
                </motion.button>
              </div>

              <button onClick={resetToScan} className="w-full mt-3 py-2 text-white/40 hover:text-white/60 text-sm transition-all">
                ← Annulla
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product card (mode already set) */}
        <AnimatePresence>
          {foundProduct && !showModeChoice && mode && (
            <motion.div
              key="product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg"
            >
              {/* Product info */}
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm leading-tight">{foundProduct.name}</p>
                  <p className="text-white/50 text-xs">{foundProduct.sku || foundProduct.barcode} · Giacenza: <span className={foundProduct.quantity <= 0 ? 'text-red-400' : 'text-white/70'}>{foundProduct.quantity} {foundProduct.unit || 'pz'}</span></p>
                </div>
                <button onClick={resetToScan} className="text-white/30 hover:text-white/60 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Qty picker */}
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-3">
                <p className="text-white/50 text-xs text-center mb-3 uppercase tracking-wide">Quantità</p>
                <div className="flex items-center justify-center gap-5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white font-bold text-2xl transition-all"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.button>
                  <span className="text-white text-5xl font-black w-16 text-center tabular-nums">{qty}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQty(q => q + 1)}
                    className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white font-bold text-2xl transition-all"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Username field for impegno */}
              {mode === 'impegno' && (
                <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-3">
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Nome operatore</p>
                  <input
                    value={impegnoUser}
                    onChange={e => setImpegnoUser(e.target.value)}
                    placeholder="Inserisci il tuo nome..."
                    className="w-full bg-transparent text-white placeholder-white/25 text-sm outline-none border-b border-white/20 pb-1 focus:border-violet-400 transition-colors"
                  />
                </div>
              )}

              {/* Confirm button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleConfirm()}
                disabled={processing || (mode === 'impegno' && !impegnoUser.trim())}
                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 text-white shadow-xl transition-all disabled:opacity-50 ${
                  mode === 'carico'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30'
                    : mode === 'scarico'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
                    : 'bg-gradient-to-r from-violet-500 to-purple-700 shadow-violet-500/30'
                }`}
              >
                {mode === 'carico' && <ArrowUp className="w-5 h-5" />}
                {mode === 'scarico' && <ArrowDown className="w-5 h-5" />}
                {mode === 'impegno' && <BookMarked className="w-5 h-5" />}
                CONFERMA {mode?.toUpperCase()} × {qty}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No product, mode set — hint */}
        {!foundProduct && mode && (
          <p className="text-white/30 text-sm">
            Modalità: <span className={mode === 'carico' ? 'text-emerald-400 font-bold' : mode === 'scarico' ? 'text-red-400 font-bold' : 'text-violet-400 font-bold'}>{mode.toUpperCase()}</span> — scansiona il prossimo prodotto
          </p>
        )}
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="px-5 pb-5 border-t border-white/8 pt-3">
          <p className="text-white/30 text-xs mb-2 font-semibold uppercase tracking-wide">Ultime scansioni</p>
          <div className="flex flex-col gap-1">
            {recentScans.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white/5">
                {s.mode === 'carico'
                  ? <ArrowUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  : s.mode === 'scarico'
                  ? <ArrowDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                  : <BookMarked className="w-3 h-3 text-violet-400 flex-shrink-0" />
                }
                <span className="text-white/60 text-sm flex-1 truncate">
                  {s.product.name}{s.userName ? <span className="text-white/30"> · {s.userName}</span> : null}
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  s.mode === 'carico' ? 'text-emerald-400' : s.mode === 'scarico' ? 'text-red-400' : 'text-violet-400'
                }`}>
                  {s.mode === 'carico' ? '+' : s.mode === 'impegno' ? '⊕' : '-'}{s.qty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.6 }}
              className={`w-36 h-36 rounded-3xl flex flex-col items-center justify-center shadow-2xl gap-2 ${
                flash === 'success' ? 'bg-emerald-500' :
                flash === 'notfound' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
            >
              {flash === 'success' && <Check className="w-16 h-16 text-white" />}
              {flash === 'notfound' && <AlertCircle className="w-12 h-12 text-white" />}
              {flash === 'error' && <AlertCircle className="w-12 h-12 text-white" />}
              <p className="text-white text-xs font-bold">
                {flash === 'success' ? 'OK' : flash === 'notfound' ? 'NON TROVATO' : 'ERRORE'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
