'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wrench, Search, Download, Plus, Calendar, Clock, MapPin, User, Trash2, Pencil, CheckCircle2, Circle, AlertCircle, ArrowUpDown, History } from 'lucide-react'
import { Lavorazione } from '../hooks/useLavorazioni'

interface LavorazioniListModalProps {
  isOpen: boolean
  onClose: () => void
  lavorazioni: Lavorazione[]
  onToggleStatus: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNew?: () => void
  onEdit?: (lavorazione: Lavorazione) => void
  onViewTimeline?: (lavorazione: Lavorazione) => void
  teamMembers?: Array<{ id: string; name: string; role: string }>
}

const statusConfig = {
  da_fare: { label: 'Da Fare', bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', icon: Circle },
  in_corso: { label: 'In Corso', bg: 'bg-indigo-50', border: 'border-indigo-200/60', text: 'text-indigo-500', icon: AlertCircle },
  completata: { label: 'Completata', bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', icon: CheckCircle2 },
  annullata: { label: 'Annullata', bg: 'bg-slate-100', border: 'border-slate-200/60', text: 'text-slate-400', icon: X },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  bassa: { label: 'BASSA', color: 'bg-emerald-50 border-emerald-200/60 text-emerald-600' },
  media: { label: 'MEDIA', color: 'bg-amber-50 border-amber-200/60 text-amber-600' },
  alta: { label: 'ALTA', color: 'bg-orange-50 border-orange-200/60 text-orange-600' },
  urgente: { label: 'URGENTE', color: 'bg-red-50 border-red-200/60 text-red-500' },
}

export default function LavorazioniListModal({
  isOpen, onClose, lavorazioni, onToggleStatus, onDelete, onNew, onEdit, onViewTimeline, teamMembers = []
}: LavorazioniListModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'scheduled'>('date')
  const [showCompleted, setShowCompleted] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isOpen) return null

  // Stats
  const counts = {
    da_fare: lavorazioni.filter(l => l.status === 'da_fare').length,
    in_corso: lavorazioni.filter(l => l.status === 'in_corso').length,
    completata: lavorazioni.filter(l => l.status === 'completata').length,
    annullata: lavorazioni.filter(l => l.status === 'annullata').length,
  }

  // Filtering
  let filtered = lavorazioni.filter(l => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !l.title.toLowerCase().includes(term) &&
        !l.description.toLowerCase().includes(term) &&
        !l.assigned_to.toLowerCase().includes(term) &&
        !l.address.toLowerCase().includes(term) &&
        !l.city.toLowerCase().includes(term)
      ) return false
    }
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (filterPriority !== 'all' && l.priority !== filterPriority) return false
    if (!showCompleted && l.status === 'completata') return false
    return true
  })

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'priority') {
      const order = { urgente: 0, alta: 1, media: 2, bassa: 3 }
      return (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9)
    }
    if (sortBy === 'scheduled') {
      if (!a.scheduled_date) return 1
      if (!b.scheduled_date) return -1
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    }
    return 0
  })

  // CSV Export
  const exportCSV = () => {
    const headers = ['Titolo', 'Descrizione', 'Assegnatario', 'Data', 'Ora', 'Stato', 'Priorità', 'Indirizzo', 'Città', 'Note', 'Creata il']
    const rows = filtered.map(l => [
      l.title, l.description, l.assigned_to,
      l.scheduled_date ? new Date(l.scheduled_date).toLocaleDateString('it-IT') : '',
      l.scheduled_time ? l.scheduled_time.substring(0, 5) : '',
      statusConfig[l.status]?.label || l.status,
      l.priority, l.address, l.city, l.notes,
      new Date(l.created_at).toLocaleString('it-IT')
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `lavorazioni_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full my-8"
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Lavorazioni</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{lavorazioni.length} lavorazioni registrate</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* New Button */}
            <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
              {onNew && (
                <button onClick={onNew}
                  className="w-full px-4 py-3 rounded-lg font-bold text-base transition-all bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nuova Lavorazione
                </button>
              )}
            </div>

            {/* Search + CSV */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3 flex-shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cerca per titolo, descrizione, tag..."
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800" title="Cancella ricerca">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button onClick={exportCSV} title="Esporta in CSV"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm flex items-center gap-2 transition-all">
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              <div className="text-xs text-slate-400">{filtered.length} di {lavorazioni.length} lavorazioni</div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} title="Filtra per priorità"
                  className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm">
                  <option value="all">Tutte le priorità</option>
                  <option value="urgente">🔴 Urgente</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="bassa">🟢 Bassa</option>
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} title="Filtra per stato"
                  className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm">
                  <option value="all">Tutti gli stati</option>
                  <option value="da_fare">📋 Da Fare</option>
                  <option value="in_corso">🔄 In Corso</option>
                  <option value="completata">✅ Completata</option>
                  <option value="annullata">❌ Annullata</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} title="Ordina per"
                  className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm">
                  <option value="date">📅 Data Creazione</option>
                  <option value="priority">⚡ Priorità</option>
                  <option value="scheduled">🗓️ Data Programmata</option>
                </select>

                <button onClick={() => setShowCompleted(!showCompleted)} title={showCompleted ? 'Mostra tutti' : 'Solo attivi'}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    showCompleted ? 'bg-slate-50 text-slate-400 hover:bg-slate-100' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {showCompleted ? 'Tutti' : 'Solo Attivi'}
                </button>
              </div>
            </div>

            {/* Status Summary Cards */}
            <div className="px-4 py-3 border-b border-slate-100/80 bg-slate-50/50 flex-shrink-0">
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(counts) as [keyof typeof counts, number][]).map(([status, count]) => {
                  const config = statusConfig[status]
                  return (
                    <button key={status} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                      title={config.label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        filterStatus === status
                          ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                          : `${config.bg} ${config.border}`
                      }`}>
                      <config.icon className={`w-3.5 h-3.5 ${config.text}`} />
                      <span className={config.text}>{config.label}</span>
                      <span className={`ml-auto font-bold ${config.text}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔧</div>
                  <p className="text-slate-400 text-lg">
                    {lavorazioni.length === 0 ? 'Nessuna lavorazione registrata' : 'Nessuna lavorazione con questi filtri'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((lav) => {
                    const status = statusConfig[lav.status] || statusConfig.da_fare
                    const priority = priorityConfig[lav.priority] || priorityConfig.media
                    const StatusIcon = status.icon

                    return (
                      <motion.div key={lav.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`rounded-xl border-2 p-4 ${status.bg} ${status.border} transition-all`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Status icon */}
                            <button onClick={() => onToggleStatus(lav.id)} title={`Stato: ${status.label}`}
                              className="mt-1 flex-shrink-0">
                              <StatusIcon className={`w-6 h-6 ${status.text}`} />
                            </button>

                            <div className="flex-1 space-y-2">
                              {/* Title + Priority */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className={`text-xl font-bold ${lav.status === 'completata' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {lav.title}
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${priority.color}`}>
                                  {priority.label}
                                </span>
                              </div>

                              {/* Description */}
                              {lav.description && (
                                <p className="text-sm text-slate-400">{lav.description}</p>
                              )}

                              {/* Info row */}
                              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                {lav.scheduled_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Programmata: {formatDate(lav.scheduled_date)}
                                    {lav.scheduled_time && ` alle ${lav.scheduled_time.substring(0, 5)}`}
                                  </span>
                                )}
                                {lav.assigned_to && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {lav.assigned_to}
                                  </span>
                                )}
                                {(lav.address || lav.city) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {[lav.address, lav.city, lav.province].filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </div>

                              {/* Meta */}
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Creato il {formatDate(lav.created_at)}
                                </div>
                                <div className={status.text}>
                                  {lav.status === 'da_fare' ? '📋 Da Fare' : lav.status === 'in_corso' ? '🔄 In Corso' : lav.status === 'completata' ? '✅ Completata' : '❌ Annullata'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Completa Button */}
                            {lav.status !== 'completata' && (
                              <button onClick={() => onToggleStatus(lav.id)} title="Segna come completata"
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 hidden md:inline">Completa</span>
                              </button>
                            )}
                            {lav.status === 'completata' && (
                              <button onClick={() => onToggleStatus(lav.id)} title="Riapri lavorazione"
                                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-lg transition-colors flex items-center gap-1.5">
                                <Circle className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-amber-600 hidden md:inline">Riapri</span>
                              </button>
                            )}
                            {/* Edit */}
                            {onEdit && (
                              <button onClick={() => onEdit(lav)} title="Modifica"
                                className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors">
                                <Pencil className="w-5 h-5 text-indigo-400" />
                              </button>
                            )}
                            {/* Timeline */}
                            {onViewTimeline && (
                              <button onClick={() => onViewTimeline(lav)} title="Cronologia"
                                className="px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200/60 rounded-lg transition-colors flex items-center gap-1.5">
                                <History className="w-4 h-4 text-violet-500" />
                                <span className="text-xs font-bold text-violet-600 hidden md:inline">Cronologia</span>
                              </button>
                            )}
                            {/* Delete */}
                            <button onClick={() => handleDelete(lav.id)} disabled={deletingId === lav.id} title="Elimina"
                              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg transition-colors disabled:opacity-50">
                              <Trash2 className={`w-5 h-5 ${deletingId === lav.id ? 'text-slate-300 animate-spin' : 'text-red-400'}`} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
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
