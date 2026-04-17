'use client'

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
