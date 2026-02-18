'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ChevronRight, ScanLine, AlertTriangle, ArrowUpDown, MapPin, Tag, Minus, Upload, FolderOpen, Folder, ArrowLeft, Home, Layers } from 'lucide-react'
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
  onImportCsv?: () => void
}

// Estrae la categoria "pulita" dal campo category del CSV
// Il CSV Dahua ha categorie tipo "2IN 1OUT > PFA130-E > BULLET VARI-FOCAL"
// Prendiamo la parte piu significativa
function extractSubcategory(category: string): string {
  if (!category) return 'Altro'
  const parts = category.split('>').map(s => s.trim()).filter(Boolean)
  const keywords = ['BULLET', 'EYEBALL', 'DOME', 'PTZ', 'TURRET', 'RECORDER', 'NVR', 'DVR', 'SMOKE', 'MINI CAMERA', 'ENCODER', 'SPEED DOME']
  for (const part of parts) {
    for (const kw of keywords) {
      if (part.toUpperCase().includes(kw)) return part
    }
  }
  return parts[parts.length - 1] || 'Altro'
}

// Normalizza sottocategorie simili
function normalizeSubcategory(sub: string): string {
  const upper = sub.toUpperCase()
  if (upper.includes('BULLET') && upper.includes('VARI')) return 'Bullet Vari-Focal'
  if (upper.includes('BULLET') && upper.includes('GRANDANGOL')) return 'Bullet Grandangolare'
  if (upper.includes('BULLET') && upper.includes('DOPPIA')) return 'Bullet Doppia Ottica'
  if (upper.includes('BULLET') && upper.includes('OTTICA FISSA')) return 'Bullet Ottica Fissa'
  if (upper.includes('BULLET')) return 'Bullet'
  if (upper.includes('EYEBALL') && upper.includes('VARI')) return 'Eyeball Vari-Focal'
  if (upper.includes('EYEBALL') && upper.includes('DOPPIA')) return 'Eyeball Doppia Ottica'
  if (upper.includes('EYEBALL') && upper.includes('OTTICA FISSA')) return 'Eyeball Ottica Fissa'
  if (upper.includes('EYEBALL')) return 'Eyeball'
  if (upper.includes('DOME') || upper.includes('HDBW')) return 'Dome'
  if (upper.includes('PTZ') || upper.includes('SPEED DOME')) return 'PTZ / Speed Dome'
  if (upper.includes('RECORDER') || upper.includes('NVR')) return 'NVR / Recorder'
  if (upper.includes('DVR')) return 'DVR'
  if (upper.includes('SMOKE')) return 'Smoke Detector'
  if (upper.includes('MINI CAMERA')) return 'Mini Camera'
  if (upper.includes('ENCODER')) return 'Encoder'
  return sub
}

export default function WarehouseListModal({ isOpen, onClose, products, suppliers, onAdd, onEdit, onDelete, onUpdateStock, onFindByBarcode, onLoadMovements, onImportCsv }: WarehouseListModalProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [movements, setMovements] = useState<Record<string, StockMovement[]>>({})
  const [scanMode, setScanMode] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [stockAction, setStockAction] = useState<{productId: string, type: string, qty: number, notes: string} | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Navigation state: brand -> category -> products
  const [currentBrand, setCurrentBrand] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  if (!isOpen) return null

  // Build brand -> category -> products tree
  const tree = useMemo(() => {
    const map: Record<string, Record<string, Product[]>> = {}
    for (const p of products) {
      const brand = p.brand || 'Senza Marca'
      const rawSub = extractSubcategory(p.category || '')
      const cat = normalizeSubcategory(rawSub)
      if (!map[brand]) map[brand] = {}
      if (!map[brand][cat]) map[brand][cat] = []
      map[brand][cat].push(p)
    }
    return map
  }, [products])

  const brands = useMemo(() =>
    Object.keys(tree).sort().map(b => ({
      name: b,
      count: Object.values(tree[b]).reduce((sum, arr) => sum + arr.length, 0),
      categories: Object.keys(tree[b]).length
    })),
  [tree])

  const categoriesForBrand = useMemo(() => {
    if (!currentBrand || !tree[currentBrand]) return []
    return Object.keys(tree[currentBrand]).sort().map(c => ({
      name: c,
      count: tree[currentBrand][c].length
    }))
  }, [currentBrand, tree])

  const productsForCategory = useMemo(() => {
    if (!currentBrand || !currentCategory || !tree[currentBrand]?.[currentCategory]) return []
    return tree[currentBrand][currentCategory].sort((a, b) => a.name.localeCompare(b.name))
  }, [currentBrand, currentCategory, tree])

  // Search mode: flat list across all products
  const isSearching = search.trim().length > 0
  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q)
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [search, products, isSearching])

  const getStockStatus = (p: Product): 'ok' | 'low' | 'out' => {
    if (p.quantity <= 0) return 'out'
    if (p.min_quantity > 0 && p.quantity <= p.min_quantity) return 'low'
    return 'ok'
  }

  const stockStatusColors = { ok: 'text-emerald-600 bg-emerald-50', low: 'text-amber-600 bg-amber-50', out: 'text-red-600 bg-red-50' }
  const stockStatusLabels = { ok: 'OK', low: 'Scorta Bassa', out: 'Esaurito' }

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

  const goHome = () => { setCurrentBrand(null); setCurrentCategory(null); setSearch('') }
  const goBrand = (brand: string) => { setCurrentBrand(brand); setCurrentCategory(null); setSearch('') }
  const goCategory = (cat: string) => { setCurrentCategory(cat); setSearch('') }
  const goBack = () => {
    if (currentCategory) setCurrentCategory(null)
    else if (currentBrand) setCurrentBrand(null)
  }

  // --- Render product card (reused in category view + search) ---
  const renderProduct = (p: Product) => {
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
              {p.brand || ''}{p.model ? ` \u2022 ${p.model}` : ''}{supplierName ? ` \u2022 ${supplierName}` : ''}
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
                {p.notes && <p className="text-xs text-slate-400 bg-slate-50/50 rounded-lg p-2 italic">{p.notes}</p>}

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
  }

  // Brand colors (cycle through)
  const brandColors = [
    'from-violet-500 to-purple-600 shadow-violet-500/25',
    'from-blue-500 to-indigo-600 shadow-blue-500/25',
    'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    'from-orange-500 to-red-500 shadow-orange-500/25',
    'from-pink-500 to-rose-600 shadow-pink-500/25',
    'from-cyan-500 to-blue-600 shadow-cyan-500/25',
    'from-amber-500 to-orange-600 shadow-amber-500/25',
  ]

  const categoryIcons: Record<string, string> = {
    'Bullet Ottica Fissa': '\uD83D\uDCF7',
    'Bullet Vari-Focal': '\uD83D\uDD2D',
    'Bullet Grandangolare': '\uD83D\uDCF7',
    'Bullet Doppia Ottica': '\uD83D\uDCF7',
    'Bullet': '\uD83D\uDCF7',
    'Eyeball Ottica Fissa': '\uD83D\uDC41',
    'Eyeball Vari-Focal': '\uD83D\uDC41',
    'Eyeball Doppia Ottica': '\uD83D\uDC41',
    'Eyeball': '\uD83D\uDC41',
    'Dome': '\u26AB',
    'PTZ / Speed Dome': '\uD83C\uDFAF',
    'NVR / Recorder': '\uD83D\uDCBE',
    'DVR': '\uD83D\uDCBE',
    'Smoke Detector': '\uD83D\uDEA8',
    'Mini Camera': '\uD83D\uDD0D',
    'Encoder': '\u2699\uFE0F',
  }

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
                    {products.length} prodotti {'\u2022'} {brands.length} marche
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
                {onImportCsv && (
                  <button onClick={onImportCsv} title="Importa da CSV" className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-emerald-600 text-xs font-bold transition-all flex items-center gap-1">
                    <Upload className="w-3 h-3" />CSV
                  </button>
                )}
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

            {/* Breadcrumb + Search */}
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/30 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={goHome} className={`flex items-center gap-1 text-xs font-medium transition-all rounded-lg px-2 py-1 ${!currentBrand ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                  <Home className="w-3 h-3" />Magazzino
                </button>
                {currentBrand && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <button onClick={() => goBrand(currentBrand)} className={`text-xs font-medium transition-all rounded-lg px-2 py-1 ${!currentCategory ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                      {currentBrand}
                    </button>
                  </>
                )}
                {currentCategory && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs font-medium text-violet-600 bg-violet-50 rounded-lg px-2 py-1">{currentCategory}</span>
                  </>
                )}
                {(currentBrand || currentCategory) && (
                  <button onClick={goBack} title="Indietro" className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-all rounded-lg px-2 py-1 hover:bg-slate-100">
                    <ArrowLeft className="w-3 h-3" />Indietro
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={currentCategory ? 'Cerca in questa categoria...' : currentBrand ? 'Cerca in questa marca...' : 'Cerca prodotto, SKU, marca...'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
            </div>

            {/* Stock Action Modal */}
            {stockAction && (
              <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/30 flex-shrink-0">
                <p className="text-xs font-bold text-blue-600 mb-2">{'\uD83D\uDCE6'} Movimento Magazzino</p>
                <div className="flex items-center gap-2">
                  <select value={stockAction.type} onChange={e => setStockAction({...stockAction, type: e.target.value})} title="Tipo movimento"
                    className="px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs">
                    <option value="carico">Carico</option>
                    <option value="scarico">Scarico</option>
                    <option value="reso">Reso</option>
                    <option value="inventario">Inventario</option>
                  </select>
                  <input type="number" value={stockAction.qty} onChange={e => setStockAction({...stockAction, qty: Number(e.target.value)})} min="1" title="Quantita movimento" placeholder="Qta"
                    className="w-20 px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs" />
                  <input value={stockAction.notes} onChange={e => setStockAction({...stockAction, notes: e.target.value})} placeholder="Note..."
                    className="flex-1 px-2 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs" />
                  <button onClick={handleStockSave} className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold">Salva</button>
                  <button onClick={() => setStockAction(null)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">Annulla</button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">

              {/* SEARCH RESULTS (flat list) */}
              {isSearching && (
                <>
                  <p className="text-xs text-slate-400 px-1 mb-2">{searchResults.length} risultat{searchResults.length === 1 ? 'o' : 'i'} per &quot;{search}&quot;</p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">{'\uD83D\uDD0D'}</div>
                      <p className="text-slate-400">Nessun prodotto trovato</p>
                    </div>
                  ) : searchResults.map(p => renderProduct(p))}
                </>
              )}

              {/* LEVEL 1: BRANDS */}
              {!isSearching && !currentBrand && (
                <>
                  {brands.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">{'\uD83D\uDCE6'}</div>
                      <p className="text-slate-400 text-lg">Magazzino vuoto</p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button onClick={onAdd} className="px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-bold">Aggiungi prodotto</button>
                        {onImportCsv && <button onClick={onImportCsv} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold">Importa CSV</button>}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {brands.map((b, i) => (
                        <button key={b.name} onClick={() => goBrand(b.name)}
                          className="text-left p-4 rounded-2xl bg-white/80 border border-slate-200/40 hover:shadow-lg hover:border-slate-300/60 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${brandColors[i % brandColors.length]} flex items-center justify-center shadow-lg`}>
                              <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate">{b.name}</h3>
                              <p className="text-xs text-slate-400">{b.count} prodott{b.count === 1 ? 'o' : 'i'} {'\u2022'} {b.categories} categori{b.categories === 1 ? 'a' : 'e'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* LEVEL 2: CATEGORIES (within brand) */}
              {!isSearching && currentBrand && !currentCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoriesForBrand.map((c, i) => (
                    <button key={c.name} onClick={() => goCategory(c.name)}
                      className="text-left p-4 rounded-2xl bg-white/80 border border-slate-200/40 hover:shadow-lg hover:border-slate-300/60 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl">
                          {categoryIcons[c.name] || '\uD83D\uDCE6'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate">{c.name}</h3>
                          <p className="text-xs text-slate-400">{c.count} prodott{c.count === 1 ? 'o' : 'i'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* LEVEL 3: PRODUCTS (within category) */}
              {!isSearching && currentBrand && currentCategory && (
                <>
                  {productsForCategory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">Nessun prodotto in questa categoria</p>
                    </div>
                  ) : productsForCategory.map(p => renderProduct(p))}
                </>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
