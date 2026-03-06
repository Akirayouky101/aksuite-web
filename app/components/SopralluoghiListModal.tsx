'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Plus, Pencil, Trash2, CheckCircle, Clock, AlertCircle, Calendar, MapPin, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import type { Sopralluogo } from '../hooks/useSopralluoghi'
import type { Client } from '../hooks/useClients'
import type { Lavorazione } from '../hooks/useLavorazioni'

interface SopralluoghiListModalProps {
  isOpen: boolean
  onClose: () => void
  sopralluoghi: Sopralluogo[]
  clients: Client[]
  lavorazioni: Lavorazione[]
  onAdd: () => void
  onEdit: (s: Sopralluogo) => void
  onDelete: (id: string) => Promise<void>
  onUpdateStato: (id: string, stato: Sopralluogo['stato']) => Promise<void>
}

const statoColors: Record<Sopralluogo['stato'], string> = {
  da_fare:   'bg-indigo-50 text-indigo-600 border-indigo-200',
  in_corso:  'bg-amber-50 text-amber-600 border-amber-200',
  completato:'bg-emerald-50 text-emerald-600 border-emerald-200',
  annullato: 'bg-red-50 text-red-500 border-red-200',
}

const statoLabels: Record<Sopralluogo['stato'], string> = {
  da_fare:   '📅 Da Fare',
  in_corso:  '⏳ In Corso',
  completato:'✅ Completato',
  annullato: '❌ Annullato',
}

const statoIcons: Record<Sopralluogo['stato'], React.ElementType> = {
  da_fare:   Calendar,
  in_corso:  Clock,
  completato:CheckCircle,
  annullato: AlertCircle,
}

export default function SopralluoghiListModal({
  isOpen, onClose, sopralluoghi, clients, lavorazioni, onAdd, onEdit, onDelete, onUpdateStato
}: SopralluoghiListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState<'all' | Sopralluogo['stato']>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const filtered = sopralluoghi.filter(s => {
    const matchStato = filterStato === 'all' || s.stato === filterStato
    const q = search.toLowerCase()
    const client = clients.find(c => c.id === s.client_id)
    const matchSearch = !q ||
      s.titolo.toLowerCase().includes(q) ||
      s.indirizzo?.toLowerCase().includes(q) ||
      s.citta?.toLowerCase().includes(q) ||
      client?.name?.toLowerCase().includes(q) ||
      s.note?.toLowerCase().includes(q)
    return matchStato && matchSearch
  })

  const counts = {
    da_fare:    sopralluoghi.filter(s => s.stato === 'da_fare').length,
    in_corso:   sopralluoghi.filter(s => s.stato === 'in_corso').length,
    completato: sopralluoghi.filter(s => s.stato === 'completato').length,
    annullato:  sopralluoghi.filter(s => s.stato === 'annullato').length,
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-3xl w-full my-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Sopralluoghi</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{sopralluoghi.length} sopralluoghi totali</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onAdd}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-sky-500/25 text-sm"
                >
                  <Plus className="w-4 h-4" /> Nuovo
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-0 border-b border-slate-200">
              {(Object.entries(statoLabels) as [Sopralluogo['stato'], string][]).map(([stato, label]) => {
                const Icon = statoIcons[stato]
                return (
                  <button
                    key={stato}
                    onClick={() => setFilterStato(filterStato === stato ? 'all' : stato)}
                    className={`px-3 py-3 flex flex-col items-center gap-1 text-center transition-all border-r last:border-r-0 border-slate-200 ${filterStato === stato ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-lg font-bold ${filterStato === stato ? 'text-sky-600' : 'text-slate-700'}`}>{counts[stato]}</span>
                    <span className="text-xs text-slate-400 leading-tight">{label.replace(/^\S+\s/, '')}</span>
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca per titolo, indirizzo, cliente..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[55vh]">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-slate-400 font-medium">Nessun sopralluogo trovato</p>
                  <button onClick={onAdd} className="mt-4 px-4 py-2 rounded-xl bg-sky-50 text-sky-600 font-semibold text-sm hover:bg-sky-100 transition-all">
                    + Aggiungi il primo sopralluogo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map(s => {
                    const client = clients.find(c => c.id === s.client_id)
                    const lav = lavorazioni.find(l => l.id === s.lavorazione_id)
                    const isExpanded = expandedId === s.id
                    const Icon = statoIcons[s.stato]
                    const today = new Date().toDateString()
                    const isToday = s.data_prevista && new Date(s.data_prevista).toDateString() === today
                    const isPast = s.data_prevista && new Date(s.data_prevista) < new Date() && s.stato === 'da_fare'

                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${statoColors[s.stato]} border`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 text-sm truncate">{s.titolo}</span>
                              {isToday && <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 font-bold">OGGI</span>}
                              {isPast && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 font-bold">SCADUTO</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                              {s.indirizzo && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.indirizzo}{s.citta ? `, ${s.citta}` : ''}</span>}
                              {client && <span>• {client.name}</span>}
                              {s.data_prevista && <span>• {fmt(s.data_prevista)}{s.ora_prevista ? ` ${s.ora_prevista}` : ''}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${statoColors[s.stato]}`}>{statoLabels[s.stato]}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 bg-slate-50/60 border-t border-slate-100 space-y-3">
                                <div className="grid grid-cols-2 gap-2 pt-3 text-xs text-slate-500">
                                  {lav && (
                                    <div><span className="font-bold text-slate-600">Lavorazione:</span> {lav.title}</div>
                                  )}
                                  {client && (
                                    <div><span className="font-bold text-slate-600">Cliente:</span> {client.name}{client.phone ? ` • ${client.phone}` : ''}</div>
                                  )}
                                  {s.data_prevista && (
                                    <div><span className="font-bold text-slate-600">Data:</span> {fmt(s.data_prevista)}{s.ora_prevista ? ` alle ${s.ora_prevista}` : ''}</div>
                                  )}
                                </div>
                                {s.note && (
                                  <p className="text-xs text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-100">📝 {s.note}</p>
                                )}
                                {s.risultato && (
                                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">✅ Risultato: {s.risultato}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                  <select
                                    value={s.stato}
                                    onChange={e => onUpdateStato(s.id, e.target.value as Sopralluogo['stato'])}
                                    onClick={e => e.stopPropagation()}
                                    title="Cambia stato"
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold border focus:outline-none ${statoColors[s.stato]}`}
                                  >
                                    {(Object.entries(statoLabels) as [Sopralluogo['stato'], string][]).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={e => { e.stopPropagation(); onEdit(s) }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Modifica
                                  </button>
                                  {deleteConfirmId === s.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={e => { e.stopPropagation(); onDelete(s.id); setDeleteConfirmId(null) }}
                                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold"
                                      >Conferma</button>
                                      <button
                                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(null) }}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200"
                                      >Annulla</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={e => { e.stopPropagation(); setDeleteConfirmId(s.id) }}
                                      title="Elimina"
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
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
