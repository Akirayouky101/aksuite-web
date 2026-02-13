'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wrench, Search, Filter, Calendar, Clock, MapPin, User, Trash2, ChevronRight, Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Lavorazione } from '../hooks/useLavorazioni'

interface LavorazioniListModalProps {
  isOpen: boolean
  onClose: () => void
  lavorazioni: Lavorazione[]
  onToggleStatus: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNew?: () => void
  teamMembers?: Array<{ id: string; name: string; role: string }>
}

const statusConfig = {
  da_fare: { label: 'Da Fare', bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', icon: Circle },
  in_corso: { label: 'In Corso', bg: 'bg-indigo-50', border: 'border-indigo-200/60', text: 'text-indigo-500', icon: AlertCircle },
  completata: { label: 'Completata', bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', icon: CheckCircle2 },
  annullata: { label: 'Annullata', bg: 'bg-slate-100', border: 'border-slate-200/60', text: 'text-slate-400', icon: X },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
  media: { label: 'Media', color: 'text-amber-600 bg-amber-50 border-amber-200/60' },
  alta: { label: 'Alta', color: 'text-orange-600 bg-orange-50 border-orange-200/60' },
  urgente: { label: 'Urgente', color: 'text-red-500 bg-red-50 border-red-200/60' },
}

export default function LavorazioniListModal({
  isOpen,
  onClose,
  lavorazioni,
  onToggleStatus,
  onDelete,
  onNew,
  teamMembers = []
}: LavorazioniListModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isOpen) return null

  // Filtering
  const filtered = lavorazioni.filter(l => {
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
    return true
  })

  // Counts
  const counts = {
    da_fare: lavorazioni.filter(l => l.status === 'da_fare').length,
    in_corso: lavorazioni.filter(l => l.status === 'in_corso').length,
    completata: lavorazioni.filter(l => l.status === 'completata').length,
    annullata: lavorazioni.filter(l => l.status === 'annullata').length,
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

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
          {/* Main modal */}
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
              <div className="flex gap-2">
                {onNew && (
                  <button
                    onClick={onNew}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 text-sm"
                    title="Nuova lavorazione"
                  >
                    <Plus className="w-4 h-4" />
                    Nuova
                  </button>
                )}
                <button
                  onClick={onClose}
                  title="Chiudi"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Status Summary */}
            <div className="px-6 py-3 border-b border-slate-100/80 bg-slate-50/50 flex-shrink-0">
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(counts) as [keyof typeof counts, number][]).map(([status, count]) => {
                  const config = statusConfig[status]
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                      title={config.label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        filterStatus === status
                          ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                          : `${config.bg} ${config.border}`
                      }`}
                    >
                      <config.icon className={`w-3.5 h-3.5 ${config.text}`} />
                      <span className={config.text}>{config.label}</span>
                      <span className={`ml-auto font-bold ${config.text}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="px-6 py-3 border-b border-slate-100/80 bg-white/40 flex-shrink-0">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cerca lavorazioni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  title="Filtra per priorità"
                  className="px-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                >
                  <option value="all">Tutte le priorità</option>
                  <option value="urgente">🔴 Urgente</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="bassa">🟢 Bassa</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Nessuna lavorazione trovata</p>
                  <p className="text-slate-300 text-xs mt-1">
                    {lavorazioni.length === 0 ? 'Crea la prima lavorazione da una chiamata' : 'Prova a modificare i filtri'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((lav, index) => {
                    const status = statusConfig[lav.status] || statusConfig.da_fare
                    const priority = priorityConfig[lav.priority] || priorityConfig.media
                    const StatusIcon = status.icon

                    return (
                      <motion.div
                        key={lav.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`bg-gradient-to-r from-white to-slate-50/50 border ${status.border} rounded-xl p-4 hover:shadow-md hover:shadow-slate-200/30 transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Status toggle */}
                          <button
                            onClick={() => onToggleStatus(lav.id)}
                            title={`Stato: ${status.label}`}
                            className={`w-10 h-10 rounded-xl ${status.bg} border ${status.border} flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform`}
                          >
                            <StatusIcon className={`w-5 h-5 ${status.text}`} />
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold text-sm ${lav.status === 'completata' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {lav.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${priority.color}`}>
                                {priority.label}
                              </span>
                            </div>

                            {lav.description && (
                              <p className="text-xs text-slate-500 mb-2 line-clamp-2">{lav.description}</p>
                            )}

                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              {lav.scheduled_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(lav.scheduled_date).toLocaleDateString('it-IT')}
                                  {lav.scheduled_time && ` ${lav.scheduled_time.substring(0, 5)}`}
                                </span>
                              )}
                              {lav.assigned_to && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {lav.assigned_to}
                                </span>
                              )}
                              {(lav.address || lav.city) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {[lav.address, lav.city, lav.province].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(lav.id)}
                            disabled={deletingId === lav.id}
                            title="Elimina lavorazione"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all flex-shrink-0"
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${deletingId === lav.id ? 'text-slate-300 animate-spin' : 'text-slate-400 hover:text-red-500'}`} />
                          </button>
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
