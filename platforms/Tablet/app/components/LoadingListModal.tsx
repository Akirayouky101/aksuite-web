'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, Package, Plus, Minus, Check, AlertTriangle,
  Search, Trash2, FileSpreadsheet, ArrowRight, CheckCircle2,
  XCircle, PackagePlus, PackageCheck, ChevronDown, BarChart3
} from 'lucide-react'
import { Product } from '../hooks/useWarehouse'

interface LoadingItem {
  id: string
  sku: string
  name: string
  brand: string
  quantity: number
  // Se il prodotto esiste in magazzino
  existingProduct?: Product
  // Se non esiste
  isNew: boolean
  // Dati extra per i nuovi prodotti
  category?: string
  model?: string
  description?: string
  purchase_price?: number
  unit?: string
}

interface LoadingListModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onUpdateStock: (productId: string, type: 'carico', qty: number, ref?: string, notes?: string) => Promise<void>
  onOpenProductModal: (prefill: Partial<Product>) => void
}

export default function LoadingListModal({ isOpen, onClose, products, onUpdateStock, onOpenProductModal }: LoadingListModalProps) {
  const [items, setItems] = useState<LoadingItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [manualSku, setManualSku] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState(1)
  const [showAddManual, setShowAddManual] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'none' | 'confirm' | 'loading' | 'done'>('none')
  const [processedCount, setProcessedCount] = useState(0)
  const [newProductQueue, setNewProductQueue] = useState<LoadingItem[]>([])
  const [currentNewIdx, setCurrentNewIdx] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setItems([])
      setSearchQuery('')
      setManualSku('')
      setManualName('')
      setManualQty(1)
      setShowAddManual(false)
      setConfirmMode('none')
      setProcessedCount(0)
      setNewProductQueue([])
      setCurrentNewIdx(0)
    }
  }, [isOpen])

  // Prodotti esistenti e nuovi nella lista
  const existingItems = useMemo(() => items.filter(i => !i.isNew), [items])
  const newItems = useMemo(() => items.filter(i => i.isNew), [items])

  // Cerca prodotto per SKU/barcode nel magazzino
  const findProduct = useCallback((sku: string): Product | undefined => {
    const q = sku.trim().toLowerCase()
    return products.find(p =>
      p.sku?.toLowerCase() === q ||
      p.barcode?.toLowerCase() === q ||
      p.qr_code?.toLowerCase() === q ||
      p.model?.toLowerCase() === q
    )
  }, [products])

  // Aggiungi un articolo alla lista
  const addItem = useCallback((sku: string, name: string, qty: number, extra?: Partial<LoadingItem>) => {
    if (!sku.trim()) return

    // Controlla se gia' nella lista
    const existingIdx = items.findIndex(i => i.sku.toLowerCase() === sku.trim().toLowerCase())
    if (existingIdx >= 0) {
      // Incrementa quantita'
      setItems(prev => prev.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity + qty } : item
      ))
      return
    }

    const product = findProduct(sku)
    const newItem: LoadingItem = {
      id: crypto.randomUUID(),
      sku: sku.trim(),
      name: product ? product.name : name || sku,
      brand: product ? (product.brand || '') : (extra?.brand || ''),
      quantity: qty,
      existingProduct: product || undefined,
      isNew: !product,
      category: extra?.category || product?.category || '',
      model: extra?.model || product?.model || '',
      description: extra?.description || '',
      purchase_price: extra?.purchase_price || product?.purchase_price || 0,
      unit: extra?.unit || product?.unit || 'Pezzi',
    }

    setItems(prev => [...prev, newItem])
  }, [items, findProduct])

  // Rimuovi articolo
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // Aggiorna quantita'
  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const newQty = Math.max(1, i.quantity + delta)
      return { ...i, quantity: newQty }
    }))
  }

  // Imposta quantita' diretta
  const setQty = (id: string, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  // Import CSV
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return

      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return

      // Detect separator
      const sep = lines[0].includes(';') ? ';' : ','
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

      // Trova colonne
      const skuCol = headers.findIndex(h => h.includes('sku') || h.includes('codice') || h.includes('code'))
      const nameCol = headers.findIndex(h => h.includes('nome') || h.includes('name') || h.includes('prodotto'))
      const qtyCol = headers.findIndex(h => h.includes('quantit') || h.includes('qty') || h.includes('qta'))
      const brandCol = headers.findIndex(h => h.includes('marca') || h.includes('brand'))
      const catCol = headers.findIndex(h => h.includes('categoria') || h.includes('category'))
      const priceCol = headers.findIndex(h => h.includes('prezzo') || h.includes('price') || h.includes('acquisto'))

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
        const sku = skuCol >= 0 ? cols[skuCol] : ''
        const name = nameCol >= 0 ? cols[nameCol] : ''
        const qty = qtyCol >= 0 ? (parseInt(cols[qtyCol]) || 1) : 1
        const brand = brandCol >= 0 ? cols[brandCol] : ''
        const category = catCol >= 0 ? cols[catCol] : ''
        const priceStr = priceCol >= 0 ? cols[priceCol] : '0'
        const price = parseFloat(priceStr.replace('.', '').replace(',', '.')) || 0

        if (sku || name) {
          addItem(sku || name, name, qty, { brand, category, purchase_price: price })
        }
      }
    }
    reader.readAsText(file, 'utf-8')
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Aggiunta manuale
  const handleAddManual = () => {
    if (!manualSku.trim() && !manualName.trim()) return
    addItem(manualSku || manualName, manualName, manualQty)
    setManualSku('')
    setManualName('')
    setManualQty(1)
    setShowAddManual(false)
  }

  // Ricerca rapida: scansione barcode/SKU
  const handleQuickSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addItem(searchQuery.trim(), '', 1)
      setSearchQuery('')
    }
  }

  // === CONFERMA E CARICAMENTO ===
  const handleConfirmLoad = async (includeNew: boolean) => {
    setConfirmMode('loading')
    setProcessedCount(0)

    // 1. Carica prodotti esistenti (aggiorna quantita')
    for (const item of existingItems) {
      if (item.existingProduct) {
        try {
          await onUpdateStock(item.existingProduct.id, 'carico', item.quantity, 'Lista di caricamento', `Caricamento ${item.quantity}x ${item.sku}`)
          setProcessedCount(prev => prev + 1)
        } catch (err) {
          console.error('Errore caricamento:', item.sku, err)
        }
      }
    }

    // 2. Se include nuovi, apri modale creazione per ognuno
    if (includeNew && newItems.length > 0) {
      setNewProductQueue([...newItems])
      setCurrentNewIdx(0)
      setConfirmMode('done')
      // Apri la prima modale di creazione prodotto
      openNewProductModal(newItems[0])
    } else {
      setConfirmMode('done')
    }
  }

  // Apri modale creazione prodotto con dati precompilati
  const openNewProductModal = (item: LoadingItem) => {
    onOpenProductModal({
      name: item.name,
      sku: item.sku,
      brand: item.brand,
      category: item.category || '',
      model: item.model || item.sku,
      unit: item.unit || 'Pezzi',
      quantity: item.quantity,
      purchase_price: item.purchase_price || 0,
      description: item.description || '',
    })
  }

  // Avanza al prossimo prodotto nuovo
  const handleNextNewProduct = () => {
    const nextIdx = currentNewIdx + 1
    if (nextIdx < newProductQueue.length) {
      setCurrentNewIdx(nextIdx)
      openNewProductModal(newProductQueue[nextIdx])
    }
  }

  if (!isOpen) return null

  const totalExistingQty = existingItems.reduce((s, i) => s + i.quantity, 0)
  const totalNewQty = newItems.reduce((s, i) => s + i.quantity, 0)
  const totalItems = items.length
  const totalQty = totalExistingQty + totalNewQty

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full my-4"
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[92vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Lista di Caricamento</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {totalItems > 0 ? `${totalItems} articoli | ${existingItems.length} esistenti | ${newItems.length} nuovi` : 'Scansiona, cerca o importa CSV per creare la lista'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Quick Input Bar */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-200/40 flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleQuickSearch}
                  placeholder="Scansiona barcode o digita SKU + Invio..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                  autoFocus
                />
              </div>
              <button onClick={() => setShowAddManual(!showAddManual)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Manuale
              </button>
              <label className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Importa CSV
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCsvImport} className="hidden" />
              </label>
            </div>

            {/* Manual Add Form */}
            <AnimatePresence>
              {showAddManual && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-6 py-3 bg-indigo-50/50 border-b border-indigo-200/40 flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">SKU / Codice</label>
                      <input type="text" value={manualSku} onChange={(e) => setManualSku(e.target.value)}
                        placeholder="Codice articolo"
                        className="w-full px-3 py-2 bg-white text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nome prodotto</label>
                      <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
                        placeholder="Nome (opzionale se SKU esiste)"
                        className="w-full px-3 py-2 bg-white text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm" />
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Qty</label>
                      <input type="number" value={manualQty} onChange={(e) => setManualQty(Math.max(1, Number(e.target.value)))} min={1}
                        className="w-full px-3 py-2 bg-white text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm text-center" />
                    </div>
                    <button onClick={handleAddManual}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                      Aggiungi
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Split View: Existing | New */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Lista vuota</p>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    Scansiona un barcode, cerca un SKU, aggiungi manualmente o importa un CSV per iniziare
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60">
                  {/* LEFT: Existing Products */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <PackageCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-700">Prodotti Esistenti</h3>
                        <p className="text-[10px] text-slate-400">{existingItems.length} articoli | +{totalExistingQty} pz da caricare</p>
                      </div>
                    </div>
                    {existingItems.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-300">Nessun prodotto esistente nella lista</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                        {existingItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/40 group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                                {item.brand && <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{item.brand}</span>}
                                <span className="text-[10px] text-slate-400">
                                  Stock: {item.existingProduct?.quantity || 0} {'\u2192'} {(item.existingProduct?.quantity || 0) + item.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 transition-all">
                                <Minus className="w-3 h-3 text-slate-500" />
                              </button>
                              <input type="number" value={item.quantity} onChange={(e) => setQty(item.id, Number(e.target.value))} min={1}
                                className="w-12 text-center text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg py-1" />
                              <button onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-emerald-300 transition-all">
                                <Plus className="w-3 h-3 text-slate-500" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 transition-all">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: New Products */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <PackagePlus className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-700">Prodotti Non Esistenti</h3>
                        <p className="text-[10px] text-slate-400">{newItems.length} articoli | Da creare in magazzino</p>
                      </div>
                    </div>
                    {newItems.length === 0 ? (
                      <div className="py-8 text-center">
                        <XCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-300">Tutti i prodotti sono gia presenti in magazzino</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                        {newItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/40 group">
                            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{item.name || item.sku}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                                {item.brand && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{item.brand}</span>}
                                <span className="text-[10px] text-amber-500 font-bold">NUOVO</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 transition-all">
                                <Minus className="w-3 h-3 text-slate-500" />
                              </button>
                              <input type="number" value={item.quantity} onChange={(e) => setQty(item.id, Number(e.target.value))} min={1}
                                className="w-12 text-center text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg py-1" />
                              <button onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-amber-300 transition-all">
                                <Plus className="w-3 h-3 text-slate-500" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 transition-all">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with actions */}
            {items.length > 0 && confirmMode === 'none' && (
              <div className="px-4 sm:px-6 py-4 border-t border-slate-200/60 bg-white/60 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">{totalItems} articoli</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">{existingItems.length} esistenti (+{totalExistingQty} pz)</span>
                    </div>
                    {newItems.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <PackagePlus className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">{newItems.length} nuovi</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setItems([])}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-all">
                      Svuota lista
                    </button>
                    <button onClick={() => setConfirmMode('confirm')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Conferma Caricamento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Dialog */}
            <AnimatePresence>
              {confirmMode === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Conferma Caricamento</h3>
                        <p className="text-xs text-slate-400">Riepilogo operazione</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {/* Existing */}
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
                        <PackageCheck className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">{existingItems.length} prodotti esistenti</p>
                          <p className="text-xs text-slate-400">Quantit{'\u00E0'} aggiornata: +{totalExistingQty} pezzi</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>

                      {/* New */}
                      {newItems.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700">{newItems.length} prodotti non in magazzino</p>
                            <p className="text-xs text-slate-400">Vuoi crearli e caricarli?</p>
                          </div>
                          <PackagePlus className="w-5 h-5 text-amber-500" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Se ci sono nuovi prodotti, offri la scelta */}
                      {newItems.length > 0 ? (
                        <>
                          <button onClick={() => handleConfirmLoad(true)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> S{'\u00EC'}, crea e carica tutto
                          </button>
                          <button onClick={() => handleConfirmLoad(false)}
                            className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                            <PackageCheck className="w-4 h-4" /> No, carica solo gli esistenti
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleConfirmLoad(false)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Conferma caricamento
                        </button>
                      )}
                      <button onClick={() => setConfirmMode('none')}
                        className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-200 transition-all">
                        Annulla
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Progress */}
            <AnimatePresence>
              {confirmMode === 'loading' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Caricamento in corso...</h3>
                    <p className="text-sm text-slate-400 mb-4">{processedCount} / {existingItems.length} prodotti caricati</p>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${existingItems.length > 0 ? (processedCount / existingItems.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Done */}
            <AnimatePresence>
              {confirmMode === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Caricamento Completato!</h3>
                    <p className="text-sm text-slate-400 mb-1">{processedCount} prodotti aggiornati in magazzino</p>
                    {newProductQueue.length > 0 && (
                      <p className="text-sm text-amber-600 font-medium mb-1">
                        {currentNewIdx < newProductQueue.length
                          ? `Creazione prodotto ${currentNewIdx + 1} di ${newProductQueue.length}...`
                          : `${newProductQueue.length} nuovi prodotti da creare`
                        }
                      </p>
                    )}
                    <div className="flex gap-2 mt-6">
                      {newProductQueue.length > 0 && currentNewIdx < newProductQueue.length && (
                        <button onClick={handleNextNewProduct}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                          <ArrowRight className="w-4 h-4" /> Prossimo prodotto
                        </button>
                      )}
                      <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Chiudi
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
