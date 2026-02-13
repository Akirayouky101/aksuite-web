'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Trash2, CheckCircle, Clock, AlertCircle, Building2, Mail, MessageSquare, Calendar, Search, Download, ExternalLink, PhoneCall, TrendingUp, AlertTriangle, MapPin, User } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import CallDetailModal from './CallDetailModal'

interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  call_date: string
  address?: string
  city?: string
  zip_code?: string
  province?: string
  assigned_to?: string
}

interface CallsListModalProps {
  isOpen: boolean
  onClose: () => void
  calls: Call[]
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: Call['status']) => Promise<void>
  onEdit?: (call: Call) => void
}

const statusConfig = {
  pending: { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', dot: 'bg-amber-400', label: 'In Attesa', icon: Clock },
  completed: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', dot: 'bg-emerald-400', label: 'Completata', icon: CheckCircle },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-500', dot: 'bg-red-400', label: 'Annullata', icon: AlertCircle }
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  bassa: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  media: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  alta: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  urgente: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' }
}

const callTypeLabels: Record<string, string> = {
  informazioni: 'Informazioni',
  assistenza: 'Assistenza',
  vendita: 'Vendita',
  reclamo: 'Reclamo',
  altro: 'Altro'
}

export default function CallsListModal({ isOpen, onClose, calls, onDelete, onStatusChange, onEdit }: CallsListModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | Call['status']>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'priority'>('date')
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false)
  const [showStats, setShowStats] = useState(true)

  // Stats
  const pendingCount = calls.filter(c => c.status === 'pending').length
  const completedCount = calls.filter(c => c.status === 'completed').length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followUpTodayCount = calls.filter(c => {
    if (!c.follow_up || !c.follow_up_date || c.status !== 'pending') return false
    const d = new Date(c.follow_up_date); d.setHours(0, 0, 0, 0)
    return d <= today
  }).length

  // Tipo stats
  const callsByType: Record<string, number> = {}
  const callsByPriority: Record<string, number> = {}
  calls.forEach(c => {
    callsByType[c.call_type] = (callsByType[c.call_type] || 0) + 1
    callsByPriority[c.priority] = (callsByPriority[c.priority] || 0) + 1
  })

  // Filtering
  let filteredCalls = calls.filter(call => {
    if (selectedFilter !== 'all' && call.status !== selectedFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !call.caller_name.toLowerCase().includes(term) &&
        !call.company.toLowerCase().includes(term) &&
        !call.phone.includes(term) &&
        !call.email.toLowerCase().includes(term) &&
        !call.notes.toLowerCase().includes(term) &&
        !(call.address || '').toLowerCase().includes(term) &&
        !(call.city || '').toLowerCase().includes(term) &&
        !(call.assigned_to || '').toLowerCase().includes(term)
      ) return false
    }
    if (selectedType !== 'all' && call.call_type !== selectedType) return false
    if (selectedPriority !== 'all' && call.priority !== selectedPriority) return false
    if (showFollowUpOnly && !call.follow_up) return false
    return true
  })

  // Sorting
  filteredCalls = [...filteredCalls].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.call_date).getTime() - new Date(a.call_date).getTime()
    if (sortBy === 'name') return a.caller_name.localeCompare(b.caller_name)
    if (sortBy === 'priority') {
      const order = { urgente: 0, alta: 1, media: 2, bassa: 3 }
      return (order[a.priority as keyof typeof order] ?? 4) - (order[b.priority as keyof typeof order] ?? 4)
    }
    return 0
  })

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Data', 'Nome', 'Azienda', 'Telefono', 'Email', 'Tipo', 'Priorità', 'Stato', 'Indirizzo', 'Città', 'CAP', 'Provincia', 'Assegnata A', 'Note', 'Follow-up', 'Data Follow-up']
    const rows = filteredCalls.map(call => [
      new Date(call.call_date).toLocaleString('it-IT'),
      call.caller_name, call.company, call.phone, call.email,
      call.call_type, call.priority, call.status,
      call.address || '', call.city || '', call.zip_code || '', call.province || '', call.assigned_to || '',
      call.notes.replace(/"/g, '""'),
      call.follow_up ? 'Sì' : 'No',
      call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString('it-IT') : ''
    ])
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `chiamate_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDelete(id); setDeleteConfirmId(null) } finally { setDeletingId(null) }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full my-4"
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 max-h-[90vh] flex flex-col">
            
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Registro Chiamate</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{calls.length} chiamate registrate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/60 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-all hover:shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* ── Mini Stats Row ── */}
            <div className="px-6 py-3 border-b border-slate-100/80 bg-slate-50/50 flex-shrink-0">
              <button onClick={() => setShowStats(!showStats)} className="w-full">
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-slate-200/40">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs text-slate-500">Totale</span>
                    <span className="text-sm font-bold text-slate-800 ml-auto">{calls.length}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-slate-200/40">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-slate-500">In Attesa</span>
                    <span className="text-sm font-bold text-amber-600 ml-auto">{pendingCount}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-slate-200/40">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-500">Completate</span>
                    <span className="text-sm font-bold text-emerald-600 ml-auto">{completedCount}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-slate-200/40">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-slate-500">Follow-up</span>
                    <span className="text-sm font-bold text-red-500 ml-auto">{followUpTodayCount}</span>
                  </div>
                </div>
              </button>

              {/* Expanded stats */}
              <AnimatePresence>
                {showStats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {/* Per tipo */}
                      <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Per Tipo
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(callsByType).map(([type, count]) => {
                            const max = Math.max(...Object.values(callsByType))
                            return (
                              <div key={type} className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 capitalize w-20 truncate">{callTypeLabels[type] || type}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all duration-700"
                                    style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {/* Per priorità */}
                      <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Per Priorità
                        </h4>
                        <div className="space-y-2">
                          {(['bassa', 'media', 'alta', 'urgente'] as const).map(priority => {
                            const count = callsByPriority[priority] || 0
                            const max = Math.max(...Object.values(callsByPriority), 1)
                            const colors = { bassa: 'from-emerald-400 to-green-400', media: 'from-amber-400 to-yellow-400', alta: 'from-orange-400 to-amber-400', urgente: 'from-red-400 to-rose-400' }
                            return (
                              <div key={priority} className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 capitalize w-20">{priority}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${colors[priority]} rounded-full transition-all duration-700`}
                                    style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Search + Filters ── */}
            <div className="px-6 py-3 border-b border-slate-100/80 bg-white/40 flex-shrink-0 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca per nome, azienda, telefono, email, note..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 text-slate-700 rounded-xl border border-slate-200/60 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none text-sm placeholder:text-slate-300 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{filteredCalls.length} di {calls.length} chiamate</span>
              </div>

              {/* Filter row */}
              <div className="flex flex-wrap gap-2">
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50/80 text-slate-600 rounded-lg border border-slate-200/60 focus:border-indigo-300 focus:outline-none text-xs">
                  <option value="all">Tutti i tipi</option>
                  <option value="informazioni">Informazioni</option>
                  <option value="assistenza">Assistenza</option>
                  <option value="vendita">Vendita</option>
                  <option value="reclamo">Reclamo</option>
                  <option value="altro">Altro</option>
                </select>
                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50/80 text-slate-600 rounded-lg border border-slate-200/60 focus:border-indigo-300 focus:outline-none text-xs">
                  <option value="all">Tutte le priorità</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'priority')}
                  className="px-3 py-1.5 bg-slate-50/80 text-slate-600 rounded-lg border border-slate-200/60 focus:border-indigo-300 focus:outline-none text-xs">
                  <option value="date">Data</option>
                  <option value="name">Nome</option>
                  <option value="priority">Priorità</option>
                </select>
                <button
                  onClick={() => setShowFollowUpOnly(!showFollowUpOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showFollowUpOnly
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                      : 'bg-slate-50/80 text-slate-400 border border-slate-200/60 hover:text-slate-600'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Follow-up
                </button>
              </div>
            </div>

            {/* ── Status Tabs ── */}
            <div className="px-6 py-2.5 border-b border-slate-100/80 bg-white/30 flex-shrink-0">
              <div className="flex gap-1.5">
                {[
                  { key: 'all' as const, label: 'Tutte', count: calls.length },
                  { key: 'pending' as const, label: 'In Attesa', count: pendingCount },
                  { key: 'completed' as const, label: 'Completate', count: completedCount },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedFilter === tab.key
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* ── Call Cards ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    {calls.length === 0 ? 'Nessuna chiamata registrata' : 'Nessuna chiamata con questi filtri'}
                  </p>
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const status = statusConfig[call.status]
                  const priority = priorityConfig[call.priority] || priorityConfig.media
                  const isFollowUpDue = call.follow_up && call.follow_up_date && 
                    new Date(call.follow_up_date) <= today && call.status === 'pending'

                  return (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`group bg-white/70 hover:bg-white/90 backdrop-blur-lg rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 ${
                        isFollowUpDue ? 'border-amber-200 ring-1 ring-amber-200/50' : 'border-slate-200/50'
                      }`}
                    >
                      <div className="p-4">
                        {/* Top row: Name + Priority + Status + Actions */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedCall(call)}>
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                              <span className="text-base font-bold text-slate-400">{call.caller_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-800 truncate">{call.caller_name}</h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${priority.bg} ${priority.text}`}>
                                  {call.priority.toUpperCase()}
                                </span>
                                {isFollowUpDue && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 animate-pulse">
                                    FOLLOW-UP
                                  </span>
                                )}
                              </div>
                              {call.company && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3" />
                                  {call.company}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right side: status + actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${status.bg} ${status.text} border ${status.border}`}>
                              {status.label}
                            </span>
                            {call.status === 'pending' && (
                              <button
                                onClick={() => onStatusChange(call.id, 'completed')}
                                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 flex items-center justify-center transition-all"
                                title="Segna completata"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirmId(call.id)}
                              disabled={deletingId === call.id}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/60 flex items-center justify-center transition-all disabled:opacity-50"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1.5 mb-3 flex-wrap">
                          <a
                            href={`tel:${call.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <PhoneCall className="w-3 h-3" />
                            Chiama
                          </a>
                          {onEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(call) }}
                              className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200/60 text-violet-600 text-xs font-medium flex items-center gap-1 transition-all"
                            >
                              ✏️ Modifica
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCall(call) }}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-500 text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Dettagli
                          </button>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-indigo-400" />
                            {call.phone}
                          </span>
                          {call.email && (
                            <a href={`mailto:${call.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-indigo-500 transition-colors truncate">
                              <Mail className="w-3 h-3 text-indigo-400" />
                              {call.email}
                            </a>
                          )}
                        </div>

                        {/* Address + Assigned */}
                        {(call.address || call.city || call.assigned_to) && (
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2 flex-wrap">
                            {(call.address || call.city) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-violet-400" />
                                {[call.address, call.city, call.province].filter(Boolean).join(', ')}
                                {call.zip_code && ` (${call.zip_code})`}
                              </span>
                            )}
                            {call.assigned_to && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-500 font-medium">
                                <User className="w-3 h-3" />
                                {call.assigned_to}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {call.notes && (
                          <div className="bg-slate-50/80 rounded-lg p-2.5 mb-2">
                            <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-300" />
                              <span className="line-clamp-2">{call.notes}</span>
                            </p>
                          </div>
                        )}

                        {/* Follow-up + Date */}
                        <div className="flex items-center justify-between text-xs mt-1">
                          {call.follow_up && call.follow_up_date ? (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${isFollowUpDue ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                              <Calendar className="w-3 h-3" />
                              Follow-up: {new Date(call.follow_up_date).toLocaleDateString('it-IT')}
                            </span>
                          ) : <span />}
                          <span className="text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(call.call_date)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmId !== null}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          title="Elimina Chiamata"
          message="Sei sicuro di voler eliminare questa chiamata? Questa azione non può essere annullata."
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />

        {/* Call Detail Modal */}
        <CallDetailModal
          isOpen={selectedCall !== null}
          onClose={() => setSelectedCall(null)}
          call={selectedCall}
        />
      </div>
    </AnimatePresence>
  )
}
