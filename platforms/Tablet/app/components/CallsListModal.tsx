'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Trash2, CheckCircle, Clock, AlertCircle, Building2, Mail, MessageSquare, Calendar, Search, Filter, ArrowUpDown, Download, ExternalLink, PhoneCall } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import CallDetailModal from './CallDetailModal'
import CallsDashboard from './CallsDashboard'

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
}

interface CallsListModalProps {
  isOpen: boolean
  onClose: () => void
  calls: Call[]
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: Call['status']) => Promise<void>
}

const statusColors = {
  pending: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', icon: Clock },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', icon: CheckCircle },
  cancelled: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', icon: AlertCircle }
}

const statusLabels = {
  pending: '⏳ In Attesa',
  completed: '✅ Completata',
  cancelled: '❌ Annullata'
}

const priorityColors: Record<string, string> = {
  bassa: 'bg-green-500/20 border-green-500/30 text-green-300',
  media: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  alta: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  urgente: 'bg-red-500/20 border-red-500/30 text-red-300'
}

const callTypeEmojis: Record<string, string> = {
  informazioni: '📞',
  assistenza: '🛠️',
  vendita: '💼',
  reclamo: '⚠️',
  altro: '📋'
}

export default function CallsListModal({ isOpen, onClose, calls, onDelete, onStatusChange }: CallsListModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | Call['status']>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  
  // Nuovi stati per filtri avanzati
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'priority'>('date')
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)

  // Filtraggio e ordinamento
  let filteredCalls = calls.filter(call => {
    // Filtro per status
    if (selectedFilter !== 'all' && call.status !== selectedFilter) return false
    
    // Filtro per ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !call.caller_name.toLowerCase().includes(term) &&
        !call.company.toLowerCase().includes(term) &&
        !call.phone.includes(term) &&
        !call.email.toLowerCase().includes(term) &&
        !call.notes.toLowerCase().includes(term)
      ) return false
    }
    
    // Filtro per tipo
    if (selectedType !== 'all' && call.call_type !== selectedType) return false
    
    // Filtro per priorità
    if (selectedPriority !== 'all' && call.priority !== selectedPriority) return false
    
    // Filtro follow-up
    if (showFollowUpOnly && !call.follow_up) return false
    
    return true
  })

  // Ordinamento
  filteredCalls = [...filteredCalls].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.call_date).getTime() - new Date(a.call_date).getTime()
    } else if (sortBy === 'name') {
      return a.caller_name.localeCompare(b.caller_name)
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgente: 0, alta: 1, media: 2, bassa: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    }
    return 0
  })

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Nome', 'Azienda', 'Telefono', 'Email', 'Tipo', 'Priorità', 'Stato', 'Note', 'Follow-up', 'Data Follow-up']
    const rows = filteredCalls.map(call => [
      new Date(call.call_date).toLocaleString('it-IT'),
      call.caller_name,
      call.company,
      call.phone,
      call.email,
      call.call_type,
      call.priority,
      call.status,
      call.notes.replace(/"/g, '""'), // Escape quotes
      call.follow_up ? 'Sì' : 'No',
      call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString('it-IT') : ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `chiamate_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
      setDeleteConfirmId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full overflow-x-hidden"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-blue-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Registro Chiamate</h2>
                  <p className="text-sm text-slate-400">{calls.length} chiamate registrate</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dashboard Toggle */}
            <div className="p-4 border-b border-white/10 bg-slate-800/50">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {showDashboard ? '📊 Nascondi Dashboard' : '📊 Mostra Dashboard'}
              </button>
            </div>

            {/* Dashboard */}
            {showDashboard && (
              <div className="p-6 border-b border-white/10 bg-slate-800/30">
                <CallsDashboard calls={calls} />
              </div>
            )}

            {/* Search and Export */}
            <div className="p-4 border-b border-white/10 bg-slate-800/50 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cerca per nome, azienda, telefono, email, note..."
                    className="w-full pl-10 pr-10 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm flex items-center gap-2 transition-all"
                  title="Esporta in CSV"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              
              <div className="text-xs text-slate-400">
                {filteredCalls.length} di {calls.length} chiamate
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="p-4 border-b border-white/10 bg-slate-800/50 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Tipo */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="informazioni">📞 Informazioni</option>
                  <option value="assistenza">🛠️ Assistenza</option>
                  <option value="vendita">💼 Vendita</option>
                  <option value="reclamo">⚠️ Reclamo</option>
                  <option value="altro">📋 Altro</option>
                </select>

                {/* Priorità */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                >
                  <option value="all">Tutte le priorità</option>
                  <option value="urgente">🔴 Urgente</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="bassa">🟢 Bassa</option>
                </select>

                {/* Ordinamento */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'priority')}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-sm flex items-center gap-2"
                >
                  <option value="date">📅 Data</option>
                  <option value="name">👤 Nome</option>
                  <option value="priority">⚡ Priorità</option>
                </select>

                {/* Follow-up Only */}
                <button
                  onClick={() => setShowFollowUpOnly(!showFollowUpOnly)}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    showFollowUpOnly
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Follow-up
                </button>
              </div>
            </div>

            {/* Status Filters */}
            <div className="p-4 border-b border-white/10 bg-slate-800/50">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🌟 Tutte ({calls.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'pending'
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  ⏳ In Attesa ({calls.filter(c => c.status === 'pending').length})
                </button>
                <button
                  onClick={() => setSelectedFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'completed'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  ✅ Completate ({calls.filter(c => c.status === 'completed').length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-200px)]">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📞</div>
                  <p className="text-slate-400 text-lg">
                    {calls.length === 0 
                      ? 'Nessuna chiamata registrata'
                      : 'Nessuna chiamata con questi filtri'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCalls.map((call) => {
                    const StatusIcon = statusColors[call.status].icon
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isFollowUpToday = call.follow_up && call.follow_up_date && 
                      new Date(call.follow_up_date) <= today && call.status === 'pending'
                    
                    return (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`rounded-xl border-2 p-4 ${statusColors[call.status].bg} ${statusColors[call.status].border} ${
                          isFollowUpToday ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900' : ''
                        } transition-all`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3 cursor-pointer" onClick={() => setSelectedCall(call)}>
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className="text-3xl mt-1">
                                {callTypeEmojis[call.call_type] || '📞'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="text-xl font-bold text-white">{call.caller_name}</h3>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[call.priority]}`}>
                                    {call.priority.toUpperCase()}
                                  </span>
                                  {isFollowUpToday && (
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-orange-500/30 border border-orange-500/50 text-orange-300 animate-pulse">
                                      ⏰ FOLLOW-UP OGGI!
                                    </span>
                                  )}
                                </div>
                                {call.company && (
                                  <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {call.company}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 flex-wrap">
                              <a
                                href={`tel:${call.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Chiama ora"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Chiama
                              </a>
                              {call.email && (
                                <a
                                  href={`mailto:${call.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Invia email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Email
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCall(call)
                                }}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Dettagli"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Dettagli
                              </button>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Phone className="w-4 h-4 text-blue-400" />
                                <span>{call.phone}</span>
                              </div>
                              {call.email && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Mail className="w-4 h-4 text-cyan-400" />
                                  <span className="truncate">{call.email}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-300">{call.notes}</p>
                              </div>
                            </div>

                            {/* Follow-up */}
                            {call.follow_up && call.follow_up_date && (
                              <div className="flex items-center gap-2 text-sm text-orange-300 bg-orange-500/10 px-3 py-2 rounded-lg">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Follow-up: {new Date(call.follow_up_date).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                            )}

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(call.call_date)}
                              </div>
                              <div className={`flex items-center gap-1 ${statusColors[call.status].text}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusLabels[call.status]}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            {call.status === 'pending' && (
                              <button
                                onClick={() => onStatusChange(call.id, 'completed')}
                                className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors"
                                title="Segna come completata"
                              >
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirmId(call.id)}
                              disabled={deletingId === call.id}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Elimina chiamata"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
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
