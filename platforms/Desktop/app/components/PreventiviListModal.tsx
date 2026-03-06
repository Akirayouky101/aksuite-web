'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Search, Plus, Pencil, Trash2, Send, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Printer, Euro } from 'lucide-react'
import { Preventivo } from '../hooks/usePreventivi'
import { Client } from '../hooks/useClients'

interface PreventiviListModalProps {
  isOpen: boolean
  onClose: () => void
  preventivi: Preventivo[]
  clients: Client[]
  onAdd: () => void
  onEdit: (preventivo: Preventivo) => void
  onDelete: (id: string) => void
  onUpdateStato: (id: string, stato: Preventivo['stato']) => void
}

const statoColors: Record<string, string> = {
  bozza: 'bg-slate-100 text-slate-600 border-slate-200',
  inviato: 'bg-blue-50 text-blue-600 border-blue-200',
  accettato: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rifiutato: 'bg-red-50 text-red-600 border-red-200',
  scaduto: 'bg-amber-50 text-amber-600 border-amber-200',
}

const statoLabels: Record<string, string> = {
  bozza: 'Bozza',
  inviato: 'Inviato',
  accettato: 'Accettato',
  rifiutato: 'Rifiutato',
  scaduto: 'Scaduto',
}

const statoIcons: Record<string, JSX.Element> = {
  bozza: <Clock className="w-3 h-3" />,
  inviato: <Send className="w-3 h-3" />,
  accettato: <CheckCircle className="w-3 h-3" />,
  rifiutato: <XCircle className="w-3 h-3" />,
  scaduto: <AlertCircle className="w-3 h-3" />,
}

export default function PreventiviListModal({
  isOpen, onClose, preventivi, clients, onAdd, onEdit, onDelete, onUpdateStato
}: PreventiviListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getClientName = (id: string | null) => clients.find(c => c.id === id)?.name || 'Cliente non specificato'

  const filtered = preventivi.filter(p => {
    const clientName = getClientName(p.client_id)
    const matchSearch = !search ||
      p.numero?.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.oggetto?.toLowerCase().includes(search.toLowerCase())
    const matchStato = filterStato === 'all' || p.stato === filterStato
    return matchSearch && matchStato
  })

  const totaleAccettati = preventivi.filter(p => p.stato === 'accettato').reduce((s, p) => s + p.totale, 0)
  const totaleBozze = preventivi.filter(p => p.stato === 'bozza' || p.stato === 'inviato').reduce((s, p) => s + p.totale, 0)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full my-8"
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Preventivi</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{preventivi.length} preventivi totali</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onAdd}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 hover:shadow-emerald-500/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuovo Preventivo</span>
                </button>
                <button
                  onClick={onClose}
                  title="Chiudi"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Accettati</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">€ {fmt(totaleAccettati)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">In attesa</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5">€ {fmt(totaleBozze)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Totale</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{preventivi.length} prev.</p>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2 px-4 sm:px-6 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca per numero, cliente, oggetto..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-700 text-sm rounded-xl border border-slate-200/60 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <select
                value={filterStato}
                onChange={(e) => setFilterStato(e.target.value)}
                title="Filtra per stato"
                className="px-3 py-2 bg-slate-50 text-slate-700 text-sm rounded-xl border border-slate-200/60 focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Tutti gli stati</option>
                {Object.entries(statoLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    {preventivi.length === 0 ? 'Nessun preventivo ancora' : 'Nessun risultato'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {preventivi.length === 0 ? 'Clicca "+ Nuovo Preventivo" per iniziare' : 'Prova a cambiare i filtri'}
                  </p>
                </div>
              ) : (
                filtered.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                    {/* Row */}
                    <div
                      className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-slate-50/60 transition-all"
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 font-mono">{p.numero}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statoColors[p.stato]}`}>
                            {statoIcons[p.stato]}
                            {statoLabels[p.stato]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {getClientName(p.client_id)}
                          {p.oggetto ? <span className="text-slate-400"> · {p.oggetto}</span> : null}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(p.data_preventivo).toLocaleDateString('it-IT')} · Validità {p.validita}gg
                        </p>
                      </div>

                      {/* Totale */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-700">€ {fmt(p.totale)}</p>
                        <p className="text-[10px] text-slate-400">{p.items?.length || 0} voci</p>
                      </div>

                      {/* Expand arrow */}
                      <div className="flex-shrink-0 text-slate-300">
                        {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {expandedId === p.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                            {/* Voci */}
                            {p.items && p.items.filter(i => i.description).length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Voci</p>
                                <div className="space-y-1">
                                  {p.items.filter(i => i.description).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-xs">
                                      <div className="flex-1 min-w-0">
                                        <span className="text-slate-700">{item.description}</span>
                                        {item.sku && <span className="text-slate-400 font-mono ml-1">({item.sku})</span>}
                                      </div>
                                      <div className="flex-shrink-0 text-right ml-4">
                                        <span className="text-slate-500">{item.quantity} {item.unit} × €{fmt(item.unit_price)}</span>
                                        <span className="text-slate-700 font-semibold ml-2">€{fmt(item.quantity * item.unit_price)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Totali */}
                            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                              <div className="flex justify-between text-slate-500">
                                <span>Imponibile</span><span>€ {fmt(p.imponibile)}</span>
                              </div>
                              {p.sconto > 0 && (
                                <div className="flex justify-between text-red-500">
                                  <span>Sconto ({p.sconto}%)</span>
                                  <span>- € {fmt(p.subtotal * p.sconto / 100)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-500">
                                <span>IVA ({p.iva_percent}%)</span><span>€ {fmt(p.iva_amount)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-700 text-sm pt-1 border-t border-slate-200">
                                <span>TOTALE</span><span>€ {fmt(p.totale)}</span>
                              </div>
                            </div>

                            {p.note && (
                              <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2">📝 {p.note}</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              {/* Stato quick change */}
                              <select
                                value={p.stato}
                                onChange={(e) => onUpdateStato(p.id, e.target.value as Preventivo['stato'])}
                                onClick={(e) => e.stopPropagation()}
                                title="Cambia stato"
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold border focus:outline-none ${statoColors[p.stato]}`}
                              >
                                {Object.entries(statoLabels).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>

                              <button
                                onClick={(e) => { e.stopPropagation(); onEdit(p) }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Modifica
                              </button>

                              {deleteConfirmId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); setDeleteConfirmId(null) }}
                                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold transition-all"
                                  >Conferma</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null) }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-all"
                                  >Annulla</button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id) }}
                                  title="Elimina preventivo"
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 border border-red-100 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
