'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Trash2, CheckCircle, Clock, AlertCircle, Building2, Mail, MessageSquare, Calendar } from 'lucide-react'

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

  const filteredCalls = selectedFilter === 'all' 
    ? calls 
    : calls.filter(call => call.status === selectedFilter)

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa chiamata?')) {
      setDeletingId(id)
      try {
        await onDelete(id)
      } finally {
        setDeletingId(null)
      }
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

            {/* Filters */}
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
                      : 'Nessuna chiamata con questo filtro'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCalls.map((call) => {
                    const StatusIcon = statusColors[call.status].icon
                    return (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`rounded-xl border-2 p-4 ${statusColors[call.status].bg} ${statusColors[call.status].border}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className="text-3xl mt-1">
                                {callTypeEmojis[call.call_type] || '📞'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-white">{call.caller_name}</h3>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[call.priority]}`}>
                                    {call.priority.toUpperCase()}
                                  </span>
                                </div>
                                {call.company && (
                                  <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {call.company}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Phone className="w-4 h-4 text-blue-400" />
                                <a href={`tel:${call.phone}`} className="hover:text-blue-400 transition-colors">
                                  {call.phone}
                                </a>
                              </div>
                              {call.email && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Mail className="w-4 h-4 text-cyan-400" />
                                  <a href={`mailto:${call.email}`} className="hover:text-cyan-400 transition-colors">
                                    {call.email}
                                  </a>
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
                          <div className="flex flex-col gap-2">
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
                              onClick={() => handleDelete(call.id)}
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
      </div>
    </AnimatePresence>
  )
}
