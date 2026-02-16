'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ScanLine, AlertTriangle, ArrowUpDown, MapPin, Tag, Minus } from 'lucide-react'
import { Product, StockMovement } from '../hooks/useWarehouse'
import { Supplier } from '../hooks/useSuppliers'

interface WarehouseListModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  suppliers: Supplier[]
  onAdd: () => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onUpdateStock: (productId: string, type: string, quantity: number, notes: string) => void
  onFindByBarcode: (code: string) => Product | undefined
  onLoadMovements: (productId: string) => Promise<StockMovement[]>
}

export default function WarehouseListModal({ isOpen, onClose, products, suppliers, onAdd, onEdit, onDelete, onUpdateStock, onFindByBarcode, onLoadMovements }: WarehouseListModalProps) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [movements, setMovements] = useState<Record<string, StockMovement[]>>({})
  const [scanMode, setScanMode] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [stockAction, setStockAction] = useState<{productId: string, type: string, qty: number, notes: string} | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()

  const getStockStatus = (p: Product): 'ok' | 'low' | 'out' => {
    if (p.quantity <= 0) return 'out'
    if (p.min_quantity > 0 && p.quantity <= p.min_quantity) return 'low'
    return 'ok'
  }

  const stockStatusColors = { ok: 'text-emerald-600 bg-emerald-50', low: 'text-amber-600 bg-amber-50', out: 'text-red-600 bg-red-50' }
  const stockStatusLabels = { ok: 'OK', low: 'Scorta Bassa', out: 'Esaurito' }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || p.category === filterCategory
    const stockStatus = getStockStatus(p)
    const matchStock = filterStock === 'all' || filterStock === stockStatus
    return matchSearch && matchCat && matchStock
  }).sort((a, b) => {
    const sa = getStockStatus(a)
    const sb = getStockStatus(b)
    const order = { out: 0, low: 1, ok: 2 }
    if (order[sa] !== order[sb]) return order[sa] - order[sb]
    return a.name.localeCompare(b.name)
  })

  const lowStock = products.filter(p => getStockStatus(p) === 'low').length
  const outStock = products.filter(p => getStockStatus(p) === 'out').length

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!movements[id]) {
      const mvts = await onLoadMovements(id)
      setMovements(prev => ({ ...prev, [id]: mvts }))
    }
  }

  const handleScan = useCallback((code: string) => {
    if (!code.trim()) return
    setScanResult(null)
    const found = onFindByBarcode(code.trim())
    if (found) {
      setSearch(code.trim())
      setScanMode(false)
      setScanResult(found.name)
    } else {
      setScanResult(`Nessun prodotto trovato per: ${code}`)
    }
  }, [onFindByBarcode])

  const handleStockSave = () => {
    if (!stockAction || stockAction.qty <= 0) return
    onUpdateStock(stockAction.productId, stockAction.type, stockAction.qty, stockAction.notes)
    setStockAction(null)
  }

  const getSupplierName = (id: string | null) => suppliers.find(s => s.id === id)?.name || ''

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Magazzino</h2>
                  <p className="text-xs text-slate-400">
                    {products.length} prodotti
                    {lowStock > 0 && <span className="text-amber-500 ml-1">{'\u2022'} {lowStock} scorta bassa</span>}
                    {outStock > 0 && <span className="text-red-500 ml-1">{'\u2022'} {outStock} esauriti</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setScanMode(!scanMode); setTimeout(() => scanInputRef.current?.focus(), 100) }} title="Scansiona barcode"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${scanMode ? 'bg-violet-100 border-violet-300 text-violet-600' : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-violet-50'}`}>
                  <ScanLine className="w-3 h-3" />Scanner
                </button>
                <button onClick={onAdd} title="Aggiungi prodotto" className="px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200/60 text-violet-600 text-xs font-bold transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />Nuovo
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Scanner bar */}
            {scanMode && (
              <div className="px-5 py-3 border-b border-violet-100 bg-violet-50/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-violet-400 animate-pulse" />
                  <input ref={scanInputRef} placeholder="Scansiona o digita codice a barre / QR..." autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleScan((e.target as HTMLInputElement).value) }}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-violet-200/60 text-sm text-slate-700 placeholder:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 font-mono" />
                  <button onClick={() => { if (scanInputRef.current) handleScan(scanInputRef.current.value) }}
                    className="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold">Cerca</button>
                </div>
                {scanResult && <p className="text-xs mt-1 text-violet-500">{scanResult}</p>}
              </div>
            )}

            {/* Search + Filters */}
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/30 flex gap-2 flex-shrink-0 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca prodotto, SKU, barcode..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} title="Filtra per categoria"
                className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-600">
                <option value="all">Tutte le categorie</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterStock} onChange={e => setFilterStock(e.target.value)} title="Filtra per scorta"
                className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-600">
                <option value="all">Tutte le scorte</option>
                <option value="ok">In scorta</option>
                <option value="low">Scorta bassa</option>
                <option value="out">Esauriti</option>
              </select>
            </div>

            {/* Stock Action Modal */}
            {stockAction && (
              <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/30 flex-shrink-0">
                <p className="text-xs font-bold text-blue-600 mb-2">{'\u{1F4E6}'} Movimento Magazzino</p>
                <div className="flex items-center gap-2">
                  <select value={stockAction.type} onChange={e => setStockAction({...stockAction, type: e.target.value})} title="Tipo movimento"
                    className="px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs">
                    <option value="carico">Carico</option>
                    <option value="scarico">Scarico</option>
                    <option value="reso">Reso</option>
                    <option value="inventario">Inventario</option>
                  </select>
                  <input type="number" value={stockAction.qty} onChange={e => setStockAction({...stockAction, qty: Number(e.target.value)})} min="1" title="Quantit\u00E0 movimento" placeholder="Qt\u00E0"
                    className="w-20 px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs" />
                  <input value={stockAction.notes} onChange={e => setStockAction({...stockAction, notes: e.target.value})} placeholder="Note..."
                    className="flex-1 px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs" />
                  <button onClick={handleStockSave} className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold">Salva</button>
                  <button onClick={() => setStockAction(null)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">Annulla</button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">{'\u{1F4E6}'}</div>
                  <p className="text-slate-400 text-lg">Nessun prodotto trovato</p>
                  <button onClick={onAdd} className="mt-4 px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-bold">Aggiungi il primo</button>
                </div>
              ) : filtered.map(p => {
                const isExpanded = expandedId === p.id
                const stockStatus = getStockStatus(p)
                const supplierName = getSupplierName(p.supplier_id)
                return (
                  <div key={p.id} className={`bg-white/80 rounded-xl border overflow-hidden hover:shadow-md transition-all ${stockStatus === 'out' ? 'border-red-200/60' : stockStatus === 'low' ? 'border-amber-200/60' : 'border-slate-200/40'}`}>
                    <button onClick={() => handleExpand(p.id)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stockStatus === 'out' ? 'bg-gradient-to-br from-red-500 to-red-600' : stockStatus === 'low' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                          {p.sku && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono flex-shrink-0">{p.sku}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.brand || ''}{p.category ? ` \u2022 ${p.category}` : ''}{supplierName ? ` \u2022 ${supplierName}` : ''}
                          {p.location && ` \u2022 ${p.location}`}{p.shelf && `/${p.shelf}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-slate-700'}`}>{p.quantity} {p.unit}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${stockStatusColors[stockStatus]}`}>{stockStatusLabels[stockStatus]}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 space-y-3">
                            {/* Product details */}
                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                              {p.barcode && <div className="flex items-center gap-1"><ScanLine className="w-3 h-3" />Barcode: <span className="font-mono">{p.barcode}</span></div>}
                              {p.qr_code && <div className="flex items-center gap-1">QR: <span className="font-mono">{p.qr_code}</span></div>}
                              <div className="flex items-center gap-1"><Tag className="w-3 h-3" />Acquisto: {'\u20AC'}{p.purchase_price.toFixed(2)}</div>
                              <div className="flex items-center gap-1"><Tag className="w-3 h-3" />Vendita: {'\u20AC'}{p.sell_price.toFixed(2)}</div>
                              {p.min_quantity > 0 && <div>Scorta min: {p.min_quantity}</div>}
                              {(p.max_quantity ?? 0) > 0 && <div>Scorta max: {p.max_quantity}</div>}
                              {p.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}{p.shelf ? `/${p.shelf}` : ''}</div>}
                            </div>
                            {p.description && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{p.description}</p>}

                            {/* Stock movements */}
                            {movements[p.id] && movements[p.id].length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />Ultimi Movimenti</p>
                                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                  {movements[p.id].slice(0, 5).map(m => (
                                    <div key={m.id} className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span className={`w-14 text-center px-1 py-0.5 rounded font-bold ${m.movement_type === 'carico' ? 'bg-emerald-50 text-emerald-600' : m.movement_type === 'scarico' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {m.movement_type}
                                      </span>
                                      <span className="font-bold">{m.movement_type === 'scarico' ? '-' : '+'}{m.quantity}</span>
                                      <span className="text-slate-300">{new Date(m.created_at).toLocaleDateString('it-IT')}</span>
                                      {m.notes && <span className="truncate text-slate-400">{m.notes}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <button onClick={() => setStockAction({productId: p.id, type: 'carico', qty: 1, notes: ''})} title="Carico merce"
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200/50">
                                <Plus className="w-3 h-3" />Carico
                              </button>
                              <button onClick={() => setStockAction({productId: p.id, type: 'scarico', qty: 1, notes: ''})} title="Scarico merce"
                                className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-all flex items-center gap-1 border border-orange-200/50">
                                <Minus className="w-3 h-3" />Scarico
                              </button>
                              <button onClick={() => onEdit(p)} title="Modifica prodotto"
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200/50">
                                <Pencil className="w-3 h-3" />Modifica
                              </button>
                              <button onClick={() => { if (confirm(`Eliminare ${p.name}?`)) onDelete(p.id) }} title="Elimina prodotto"
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
