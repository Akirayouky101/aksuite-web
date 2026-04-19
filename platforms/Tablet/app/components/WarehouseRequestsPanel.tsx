'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Package, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  AlertTriangle, Scan, Calendar, Truck, RefreshCw, CheckSquare
} from 'lucide-react'
import { WarehouseRequest, RequestItem } from '../hooks/useWarehouseRequests'
import { StockMovement } from '../hooks/useWarehouse'

interface WarehouseRequestsPanelProps {
  isOpen: boolean
  onClose: () => void
  requests: WarehouseRequest[]
  approverName: string
  onApprove: (id: string, approverName: string) => Promise<boolean>
  onReject: (id: string, approverName: string) => Promise<boolean>
  onUpdateStock: (productId: string, movementType: StockMovement['movement_type'], qty: number, reference?: string, notes?: string) => Promise<void>
  onFulfillItem: (requestId: string, productId: string, qty: number) => Promise<boolean>
  onUnfulfillItem: (requestId: string, productId: string) => Promise<boolean>
}

type Tab = 'prelievi' | 'ordini' | 'storico'

function isOrderComplete(req: WarehouseRequest) {
  return req.items.every(item => (item.fulfilled_quantity ?? 0) >= item.quantity)
}

function itemFulfillPercent(item: RequestItem) {
  if (item.quantity === 0) return 100
  return Math.min(100, Math.round(((item.fulfilled_quantity ?? 0) / item.quantity) * 100))
}

export default function WarehouseRequestsPanel({
  isOpen, onClose, requests, approverName, onApprove, onReject, onUpdateStock, onFulfillItem, onUnfulfillItem
}: WarehouseRequestsPanelProps) {
  const [tab, setTab] = useState<Tab>('prelievi')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<Record<string, 'approving' | 'rejecting'>>({})
  const [confirmReject, setConfirmReject] = useState<string | null>(null)
  const [scanInputs, setScanInputs] = useState<Record<string, string>>({})
  const [scanFeedback, setScanFeedback] = useState<Record<string, { ok: boolean; msg: string } | null>>({})
  const scanRefs = useRef<Record<string, HTMLInputElement | null>>({})

  if (!isOpen) return null

  const prelievi = requests.filter(r => r.request_type === 'prelievo')
  const ordini = requests.filter(r => r.request_type === 'ordine' && r.status === 'pending')
  const storico = requests.filter(r => r.status !== 'pending' || (r.request_type === 'ordine' && r.status === 'approved'))

  const pendingPrelievi = prelievi.filter(r => r.status === 'pending')

  const displayed =
    tab === 'prelievi' ? prelievi :
    tab === 'ordini' ? ordini :
    requests.filter(r => r.status !== 'pending')

  const formatDate = (iso: string) => new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  const formatExpectedDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  const statusBadge = (status: WarehouseRequest['status']) => {
    const map = {
      pending: { label: 'In attesa', cls: 'bg-amber-50 text-amber-600 border-amber-200', Icon: Clock },
      approved: { label: 'Approvato', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', Icon: CheckCircle2 },
      rejected: { label: 'Rifiutato', cls: 'bg-red-50 text-red-500 border-red-200', Icon: XCircle },
    }
    const s = map[status]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
        <s.Icon className="w-3 h-3" />
        {s.label}
      </span>
    )
  }

  const handleApprove = async (req: WarehouseRequest) => {
    if (processing[req.id]) return
    setProcessing(prev => ({ ...prev, [req.id]: 'approving' }))
    try {
      if (req.request_type === 'prelievo') {
        for (const item of req.items) {
          await onUpdateStock(item.product_id, 'scarico', item.quantity, `Prelievo - ${req.requested_by}`, `ID ${req.id.slice(-8).toUpperCase()}`)
        }
      }
      await onApprove(req.id, approverName)
      setExpandedId(null)
    } finally {
      setProcessing(prev => { const n = { ...prev }; delete n[req.id]; return n })
    }
  }

  const handleReject = async (id: string) => {
    if (processing[id]) return
    setConfirmReject(null)
    setProcessing(prev => ({ ...prev, [id]: 'rejecting' }))
    try { await onReject(id, approverName) }
    finally { setProcessing(prev => { const n = { ...prev }; delete n[id]; return n }) }
  }

  // Scanning: parse input, find product in order, call fulfillItem
  const handleScan = async (req: WarehouseRequest) => {
    const raw = (scanInputs[req.id] || '').trim()
    if (!raw) return

    // Cerca per SKU o barcode (esatto o parziale)
    const found = req.items.find(item =>
      item.sku?.toLowerCase() === raw.toLowerCase() ||
      item.sku?.toLowerCase().includes(raw.toLowerCase()) ||
      item.product_name.toLowerCase().includes(raw.toLowerCase())
    )

    if (!found) {
      setScanFeedback(prev => ({ ...prev, [req.id]: { ok: false, msg: `"${raw}" non trovato nell'ordine` } }))
      setTimeout(() => setScanFeedback(prev => ({ ...prev, [req.id]: null })), 2500)
      setScanInputs(prev => ({ ...prev, [req.id]: '' }))
      return
    }

    const currentFilled = found.fulfilled_quantity ?? 0
    if (currentFilled >= found.quantity) {
      setScanFeedback(prev => ({ ...prev, [req.id]: { ok: false, msg: `${found.product_name} già completo (${found.quantity}/${found.quantity})` } }))
      setTimeout(() => setScanFeedback(prev => ({ ...prev, [req.id]: null })), 2500)
      setScanInputs(prev => ({ ...prev, [req.id]: '' }))
      return
    }

    const ok = await onFulfillItem(req.id, found.product_id, 1)
    const newFilled = currentFilled + 1
    if (ok) {
      const complete = newFilled >= found.quantity
      setScanFeedback(prev => ({ ...prev, [req.id]: { ok: true, msg: complete ? `✓ ${found.product_name} COMPLETO!` : `✓ ${found.product_name}: ${newFilled}/${found.quantity}` } }))
    } else {
      setScanFeedback(prev => ({ ...prev, [req.id]: { ok: false, msg: 'Errore aggiornamento' } }))
    }
    setTimeout(() => setScanFeedback(prev => ({ ...prev, [req.id]: null })), 2000)
    setScanInputs(prev => ({ ...prev, [req.id]: '' }))
    scanRefs.current[req.id]?.focus()
  }

  const handleCompleteOrder = async (req: WarehouseRequest) => {
    if (processing[req.id]) return
    setProcessing(prev => ({ ...prev, [req.id]: 'approving' }))
    try {
      for (const item of req.items) {
        const qty = item.fulfilled_quantity ?? 0
        if (qty > 0) await onUpdateStock(item.product_id, 'scarico', qty, `Ordine preparato - ${req.requested_by}`, `ID ${req.id.slice(-8).toUpperCase()}`)
      }
      await onApprove(req.id, approverName)
      setExpandedId(null)
    } finally {
      setProcessing(prev => { const n = { ...prev }; delete n[req.id]; return n })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
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
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Magazzino — Movimenti</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {pendingPrelievi.length} prelievi · {ordini.length} ordini da preparare
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all" title="Chiudi">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
            {[
              { key: 'prelievi' as Tab, label: 'Prelievi', badge: pendingPrelievi.length, color: 'orange' },
              { key: 'ordini' as Tab, label: 'Ordini', badge: ordini.length, color: 'blue' },
              { key: 'storico' as Tab, label: 'Storico', badge: 0, color: 'slate' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className={tab === t.key ? (t.color === 'orange' ? 'text-orange-600' : t.color === 'blue' ? 'text-blue-600' : 'text-slate-700') : ''}>{t.label}</span>
                {t.badge > 0 && (
                  <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${tab === t.key ? (t.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500') + ' text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayed.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  {tab === 'prelievi' ? 'Nessun prelievo' : tab === 'ordini' ? 'Nessun ordine da preparare' : 'Nessuna voce nello storico'}
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {displayed.map(req => {
                const isOrder = req.request_type === 'ordine'
                const complete = isOrder ? isOrderComplete(req) : false
                const expanded = expandedId === req.id

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl border overflow-hidden ${
                      isOrder
                        ? complete ? 'border-emerald-200 bg-emerald-50/30' : 'border-blue-200 bg-blue-50/30'
                        : req.status === 'pending' ? 'border-orange-200 bg-orange-50/40'
                        : req.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    {/* Card header */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : req.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/40 transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg ${
                        isOrder ? (complete ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-500') : req.status === 'pending' ? 'bg-orange-100 text-orange-500' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-400'
                      }`}>
                        {isOrder ? (complete ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />) : req.requested_by.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">{req.requested_by}</p>
                          {!isOrder && statusBadge(req.status)}
                          {isOrder && req.expected_date && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${complete ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatExpectedDate(req.expected_date)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(req.created_at)} · {req.items.length} art.
                          {isOrder && ` · ${req.items.filter(i => (i.fulfilled_quantity ?? 0) >= i.quantity).length}/${req.items.length} pronti`}
                          {req.approved_by && ` · ${req.status === 'approved' ? '✓' : '✗'} ${req.approved_by}`}
                        </p>
                        {/* Progress bar ordine */}
                        {isOrder && !complete && (
                          <div className="mt-1.5 h-1.5 bg-blue-100 rounded-full overflow-hidden w-full max-w-48">
                            <div
                              className="h-full bg-blue-400 rounded-full transition-all w-[var(--pct)]"
                              ref={el => { if (el) el.style.setProperty('width', `${Math.round((req.items.filter(i => (i.fulfilled_quantity ?? 0) >= i.quantity).length / req.items.length) * 100)}%`) }}
                            />
                          </div>
                        )}
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>

                    {/* Expanded */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-white/50">

                            {/* Items list */}
                            <div className="mt-3 space-y-2">
                              {req.items.map((item, idx) => {
                                const filled = item.fulfilled_quantity ?? 0
                                const pct = itemFulfillPercent(item)
                                const itemComplete = filled >= item.quantity
                                return (
                                  <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isOrder ? (itemComplete ? 'bg-emerald-50 border border-emerald-200/60' : filled > 0 ? 'bg-amber-50 border border-amber-200/60' : 'bg-white border border-slate-200/60') : 'bg-white/60'}`}>
                                    {isOrder && (
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${itemComplete ? 'bg-emerald-400' : filled > 0 ? 'bg-amber-400' : 'bg-slate-200'}`}>
                                        {itemComplete && <CheckCircle2 className="w-3 h-3 text-white" />}
                                      </div>
                                    )}
                                    {!isOrder && <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-700 truncate">{item.product_name}</p>
                                      {item.sku && <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>}
                                    </div>
                                    {isOrder ? (
                                      <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-black ${itemComplete ? 'text-emerald-600' : filled > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                                          {filled}/{item.quantity}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{item.unit}</p>
                                        {!itemComplete && (
                                          <button
                                            onClick={() => onUnfulfillItem(req.id, item.product_id)}
                                            title="Reset"
                                            className="mt-0.5 text-[10px] text-slate-300 hover:text-red-400 transition-colors"
                                          >
                                            <RefreshCw className="w-3 h-3 inline" />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-sm font-bold text-slate-700 flex-shrink-0">{item.quantity} {item.unit}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* Scanner per ordini */}
                            {isOrder && req.status === 'pending' && (
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                  <Scan className="w-3.5 h-3.5" /> Scanner / Codice prodotto
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    ref={el => { scanRefs.current[req.id] = el }}
                                    value={scanInputs[req.id] || ''}
                                    onChange={e => setScanInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleScan(req)}
                                    placeholder="SKU o nome prodotto... (Enter)"
                                    className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 font-mono"
                                  />
                                  <button
                                    onClick={() => handleScan(req)}
                                    title="Scansiona"
                                    className="px-4 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all flex items-center gap-1.5"
                                  >
                                    <Scan className="w-4 h-4" />
                                  </button>
                                </div>
                                <AnimatePresence>
                                  {scanFeedback[req.id] && (
                                    <motion.p
                                      initial={{ opacity: 0, y: -4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0 }}
                                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${scanFeedback[req.id]!.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
                                    >
                                      {scanFeedback[req.id]!.msg}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Note */}
                            {req.notes && (
                              <div className="px-3 py-2 bg-amber-50/60 rounded-xl">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Note</p>
                                <p className="text-sm text-slate-600">{req.notes}</p>
                              </div>
                            )}

                            {/* Azioni prelievo */}
                            {!isOrder && req.status === 'pending' && (
                              <div className="flex gap-2 pt-1">
                                {confirmReject === req.id ? (
                                  <>
                                    <div className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                      <span className="text-xs text-red-600 font-semibold">Annulli questo prelievo?</span>
                                    </div>
                                    <button onClick={() => handleReject(req.id)} disabled={!!processing[req.id]} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50">Sì</button>
                                    <button onClick={() => setConfirmReject(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">No</button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleApprove(req)}
                                      disabled={!!processing[req.id]}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40 transition-all disabled:opacity-50"
                                    >
                                      {processing[req.id] === 'approving' ? 'Elaborazione...' : <><CheckCircle2 className="w-4 h-4" /> Conferma & Scarica</>}
                                    </button>
                                    <button
                                      onClick={() => setConfirmReject(req.id)}
                                      disabled={!!processing[req.id]}
                                      className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      <XCircle className="w-4 h-4" /> Annulla
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Azioni ordine */}
                            {isOrder && req.status === 'pending' && (
                              <div className="flex gap-2 pt-1">
                                {complete ? (
                                  <button
                                    onClick={() => handleCompleteOrder(req)}
                                    disabled={!!processing[req.id]}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40 transition-all disabled:opacity-50"
                                  >
                                    {processing[req.id] === 'approving' ? 'Salvataggio...' : <><CheckSquare className="w-4 h-4" /> Segna come PRONTO & Scarica</>}
                                  </button>
                                ) : (
                                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500 font-medium">
                                      Completa tutti i prodotti per segnare l&apos;ordine come pronto
                                    </span>
                                  </div>
                                )}
                                {confirmReject === req.id ? (
                                  <>
                                    <button onClick={() => handleReject(req.id)} disabled={!!processing[req.id]} className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold">Sì, annulla</button>
                                    <button onClick={() => setConfirmReject(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold">No</button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmReject(req.id)} disabled={!!processing[req.id]} title="Annulla ordine" className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-400 text-sm font-bold hover:bg-red-100 transition-all">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
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


import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { WarehouseRequest } from '../hooks/useWarehouseRequests'
import { StockMovement } from '../hooks/useWarehouse'

interface WarehouseRequestsPanelProps {
  isOpen: boolean
  onClose: () => void
  requests: WarehouseRequest[]
  approverName: string
  onApprove: (id: string, approverName: string) => Promise<boolean>
  onReject: (id: string, approverName: string) => Promise<boolean>
  onUpdateStock: (productId: string, movementType: StockMovement['movement_type'], qty: number, reference?: string, notes?: string) => Promise<void>
}

type Tab = 'pending' | 'history'

export default function WarehouseRequestsPanel({
  isOpen, onClose, requests, approverName, onApprove, onReject, onUpdateStock
}: WarehouseRequestsPanelProps) {
  const [tab, setTab] = useState<Tab>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<Record<string, 'approving' | 'rejecting'>>({})
  const [confirmReject, setConfirmReject] = useState<string | null>(null)

  if (!isOpen) return null

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const historyRequests = requests.filter(r => r.status !== 'pending')
  const displayed = tab === 'pending' ? pendingRequests : historyRequests

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const handleApprove = async (req: WarehouseRequest) => {
    if (processing[req.id]) return
    setProcessing(prev => ({ ...prev, [req.id]: 'approving' }))
    try {
      // Deduct stock for each item
      for (const item of req.items) {
        await onUpdateStock(
          item.product_id,
          'scarico',
          item.quantity,
          `Prelievo approvato - ${req.requested_by}`,
          `Richiesta #${req.id.slice(-8).toUpperCase()}`
        )
      }
      await onApprove(req.id, approverName)
      setExpandedId(null)
    } finally {
      setProcessing(prev => { const next = { ...prev }; delete next[req.id]; return next })
    }
  }

  const handleReject = async (id: string) => {
    if (processing[id]) return
    setConfirmReject(null)
    setProcessing(prev => ({ ...prev, [id]: 'rejecting' }))
    try {
      await onReject(id, approverName)
    } finally {
      setProcessing(prev => { const next = { ...prev }; delete next[id]; return next })
    }
  }

  const statusBadge = (status: WarehouseRequest['status']) => {
    const map = {
      pending: { label: 'In attesa', cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
      approved: { label: 'Approvato', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
      rejected: { label: 'Rifiutato', cls: 'bg-red-50 text-red-500 border-red-200', icon: XCircle },
    }
    const s = map[status]
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-2xl mx-4 mb-0 sm:mb-0"
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Richieste Prelievo</h2>
              <p className="text-xs text-slate-400 mt-0.5">{pendingRequests.length} in attesa di approvazione</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all" title="Chiudi">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
            <button
              onClick={() => setTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'pending' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              In attesa
              {pendingRequests.length > 0 && (
                <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${tab === 'pending' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'history' ? 'bg-white text-slate-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Storico
              <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${tab === 'history' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                {historyRequests.length}
              </span>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayed.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  {tab === 'pending' ? 'Nessuna richiesta in attesa' : 'Nessuna richiesta nello storico'}
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {displayed.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl border overflow-hidden ${req.status === 'pending' ? 'border-orange-200 bg-orange-50/40' : req.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'}`}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/40 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg ${req.status === 'pending' ? 'bg-orange-100 text-orange-500' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-400'}`}>
                      {req.requested_by.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{req.requested_by}</p>
                        {statusBadge(req.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(req.created_at)} · {req.items.length} prodott{req.items.length === 1 ? 'o' : 'i'}
                        {req.approved_by && ` · ${req.status === 'approved' ? 'Approvato' : 'Rifiutato'} da ${req.approved_by}`}
                      </p>
                    </div>
                    {expandedId === req.id
                      ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    }
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {expandedId === req.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/50">

                          {/* Items list */}
                          <div className="mt-3 space-y-1.5">
                            {req.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-white/60 rounded-xl">
                                <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-700 truncate">{item.product_name}</p>
                                  {item.sku && <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>}
                                </div>
                                <span className="text-sm font-bold text-slate-700 flex-shrink-0">{item.quantity} {item.unit}</span>
                              </div>
                            ))}
                          </div>

                          {/* Notes */}
                          {req.notes && (
                            <div className="px-3 py-2 bg-white/60 rounded-xl">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Note</p>
                              <p className="text-sm text-slate-600">{req.notes}</p>
                            </div>
                          )}

                          {/* Actions — only for pending */}
                          {req.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                              {confirmReject === req.id ? (
                                <>
                                  <div className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-xs text-red-600 font-semibold">Confermi il rifiuto?</span>
                                  </div>
                                  <button
                                    onClick={() => handleReject(req.id)}
                                    disabled={!!processing[req.id]}
                                    className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                  >
                                    Sì, rifiuta
                                  </button>
                                  <button
                                    onClick={() => setConfirmReject(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
                                  >
                                    No
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleApprove(req)}
                                    disabled={!!processing[req.id]}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40 transition-all disabled:opacity-50"
                                  >
                                    {processing[req.id] === 'approving' ? (
                                      <span className="text-xs">Approvazione...</span>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approva & Scarica
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setConfirmReject(req.id)}
                                    disabled={!!processing[req.id]}
                                    className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Rifiuta
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
