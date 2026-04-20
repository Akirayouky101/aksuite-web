'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Layers, Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp,
  Package, CheckCircle2, AlertTriangle, ScanLine, QrCode, Printer,
  Tag, RefreshCw, XCircle
} from 'lucide-react'
import { Kit, KitAvailability } from '../hooks/useKits'
import { Product } from '../hooks/useWarehouse'
import { UserProfile, RequestItem } from '../hooks/useWarehouseRequests'

interface KitsListModalProps {
  isOpen: boolean
  onClose: () => void
  kits: Kit[]
  products: Product[]
  warehouseUsers: UserProfile[]
  onAdd: () => void
  onEdit: (kit: Kit) => void
  onDelete: (id: string) => Promise<boolean>
  onGetAvailability: (kitId: string) => Promise<KitAvailability[]>
  onPrintLabel: (kit: Kit) => void
  onCreatePrelievo: (kit: Kit, items: RequestItem[]) => void
  readOnly?: boolean
}

export default function KitsListModal({
  isOpen, onClose, kits, products, warehouseUsers,
  onAdd, onEdit, onDelete, onGetAvailability, onPrintLabel, onCreatePrelievo,
  readOnly = false
}: KitsListModalProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<Record<string, KitAvailability[]>>({})
  const [loadingAvail, setLoadingAvail] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const scanRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return kits
    return kits.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.sku?.toLowerCase().includes(q) ||
      k.category.toLowerCase().includes(q) ||
      k.description?.toLowerCase().includes(q)
    )
  }, [kits, search])

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!availability[id]) {
      setLoadingAvail(prev => ({ ...prev, [id]: true }))
      const avail = await onGetAvailability(id)
      setAvailability(prev => ({ ...prev, [id]: avail }))
      setLoadingAvail(prev => ({ ...prev, [id]: false }))
    }
  }

  const refreshAvailability = async (id: string) => {
    setLoadingAvail(prev => ({ ...prev, [id]: true }))
    const avail = await onGetAvailability(id)
    setAvailability(prev => ({ ...prev, [id]: avail }))
    setLoadingAvail(prev => ({ ...prev, [id]: false }))
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
    setConfirmDelete(null)
    if (expandedId === id) setExpandedId(null)
  }

  const handleScan = (code: string) => {
    const q = code.trim().toLowerCase()
    setScanValue('')
    setScanMode(false)
    // Find kit by qr_code or sku
    const found = kits.find(k => k.qr_code?.toLowerCase() === q || k.sku?.toLowerCase() === q)
    if (found) {
      setSearch('')
      setExpandedId(found.id)
      refreshAvailability(found.id)
    }
  }

  const handleCreatePrelievo = (kit: Kit) => {
    const avail = availability[kit.id] || []
    const items: RequestItem[] = (kit.items || []).map(ki => {
      const product = products.find(p => p.id === ki.product_id)
      return {
        product_id: ki.product_id || '',
        product_name: ki.product_name,
        sku: ki.product_sku,
        quantity: ki.quantity,
        unit: product?.unit || 'pz',
      }
    }).filter(i => i.product_id)

    if (items.length === 0) return
    onCreatePrelievo(kit, items)
  }

  const getKitStatus = (id: string): 'available' | 'partial' | 'unavailable' | 'unknown' => {
    const avail = availability[id]
    if (!avail) return 'unknown'
    if (avail.every(a => a.is_available)) return 'available'
    if (avail.some(a => a.is_available)) return 'partial'
    return 'unavailable'
  }

  const statusConfig = {
    available: { label: 'Disponibile', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', Icon: CheckCircle2 },
    partial: { label: 'Parziale', cls: 'bg-amber-50 text-amber-600 border-amber-200', Icon: AlertTriangle },
    unavailable: { label: 'Non disponibile', cls: 'bg-red-50 text-red-500 border-red-200', Icon: XCircle },
    unknown: { label: 'Verifica', cls: 'bg-slate-50 text-slate-400 border-slate-200', Icon: RefreshCw },
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-2xl mx-4"
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">KIT Magazzino</h2>
                <p className="text-xs text-slate-400">{kits.length} kit configurati</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setScanMode(!scanMode); setTimeout(() => scanRef.current?.focus(), 100) }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${scanMode ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                title="Modalità scan QR"
              >
                <ScanLine className="w-5 h-5" />
              </button>
              {!readOnly && (
                <button onClick={onAdd} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold transition-all">
                  <Plus className="w-4 h-4" /> Nuovo KIT
                </button>
              )}
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scan mode input */}
          <AnimatePresence>
            {scanMode && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden border-b border-violet-100 bg-violet-50 flex-shrink-0">
                <div className="px-6 py-3 flex items-center gap-3">
                  <QrCode className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <input
                    ref={scanRef}
                    value={scanValue}
                    onChange={e => setScanValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && scanValue.trim()) handleScan(scanValue) }}
                    placeholder="Scansiona QR o SKU kit..."
                    className="flex-1 bg-transparent text-sm text-violet-800 font-mono placeholder-violet-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cerca kit..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">
                  {search ? 'Nessun kit trovato' : 'Nessun kit configurato'}
                </p>
                {!search && !readOnly && (
                  <button onClick={onAdd} className="mt-3 text-xs text-violet-600 font-bold hover:underline">
                    Crea il primo KIT
                  </button>
                )}
              </div>
            )}

            <AnimatePresence initial={false}>
              {filtered.map(kit => {
                const expanded = expandedId === kit.id
                const avail = availability[kit.id]
                const status = getKitStatus(kit.id)
                const sConf = statusConfig[status]
                const itemCount = kit.items?.length || 0

                return (
                  <motion.div
                    key={kit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleExpand(kit.id)}
                        className="flex-1 flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-5 h-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800">{kit.name}</p>
                            {kit.sku && (
                              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{kit.sku}</span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sConf.cls}`}>
                              <sConf.Icon className="w-3 h-3" />
                              {sConf.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {itemCount} componenti · {kit.category}
                            {kit.description && ` · ${kit.description}`}
                          </p>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {/* Actions */}
                      {!readOnly && (
                        <div className="flex items-center gap-1 pr-3">
                          <button onClick={() => onPrintLabel(kit)} title="Stampa etichetta QR" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(kit)} title="Modifica" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100 flex items-center justify-center text-slate-400 hover:text-violet-500 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {confirmDelete === kit.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => setConfirmDelete(null)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all text-xs font-bold">No</button>
                              <button onClick={() => handleDelete(kit.id)} disabled={deleting === kit.id} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all text-xs font-bold">Sì</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(kit.id)} title="Elimina" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                            {/* QR code info */}
                            {kit.qr_code && (
                              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                                <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="font-mono">{kit.qr_code}</span>
                              </div>
                            )}

                            {/* Availability */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponibilità Componenti</span>
                                <button onClick={() => refreshAvailability(kit.id)} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                                  <RefreshCw className={`w-3 h-3 ${loadingAvail[kit.id] ? 'animate-spin' : ''}`} />
                                  Aggiorna
                                </button>
                              </div>

                              {loadingAvail[kit.id] ? (
                                <div className="text-center py-4 text-slate-400 text-xs">Verifica disponibilità...</div>
                              ) : avail ? (
                                <div className="space-y-1.5">
                                  {avail.map((a, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${a.is_available ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                      {a.is_available
                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                        : <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                      }
                                      <span className={`flex-1 font-medium ${a.is_available ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {a.product_name}
                                        {a.product_sku && <span className="ml-1 font-mono opacity-60">({a.product_sku})</span>}
                                      </span>
                                      <span className={`font-mono font-bold ${a.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {a.current_qty}/{a.required_qty}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <button onClick={() => refreshAvailability(kit.id)} className="text-xs text-violet-600 font-bold hover:underline">
                                    Verifica disponibilità
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {!readOnly && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleCreatePrelievo(kit)}
                                  disabled={status === 'unavailable'}
                                  className="flex-1 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  <Package className="w-3.5 h-3.5" /> Crea Prelievo
                                </button>
                                <button
                                  onClick={() => onPrintLabel(kit)}
                                  className="py-2 px-4 rounded-xl bg-orange-100 text-orange-600 text-xs font-bold hover:bg-orange-200 transition-all flex items-center gap-1.5"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Etichetta
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
