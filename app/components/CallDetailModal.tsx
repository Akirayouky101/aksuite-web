'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Mail, Building2, Calendar, Clock, MessageSquare, AlertTriangle, User } from 'lucide-react'

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

interface CallDetailModalProps {
  isOpen: boolean
  onClose: () => void
  call: Call | null
}

const callTypeEmojis: Record<string, string> = {
  informazioni: '📞',
  assistenza: '🛠️',
  vendita: '💼',
  reclamo: '⚠️',
  altro: '📋'
}

const callTypeLabels: Record<string, string> = {
  informazioni: 'Informazioni',
  assistenza: 'Assistenza Tecnica',
  vendita: 'Opportunità Vendita',
  reclamo: 'Reclamo Cliente',
  altro: 'Altro'
}

const priorityColors: Record<string, string> = {
  bassa: 'bg-green-500/20 border-green-500/30 text-green-300',
  media: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  alta: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  urgente: 'bg-red-500/20 border-red-500/30 text-red-300'
}

const statusColors = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: '⏳ In Attesa' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-300', label: '✅ Completata' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-300', label: '❌ Annullata' }
}

export default function CallDetailModal({ isOpen, onClose, call }: CallDetailModalProps) {
  if (!isOpen || !call) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFollowUpDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40  z-[90] flex items-center justify-center p-4 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-3xl w-full overflow-x-hidden"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-violet-500 rounded-3xl hidden" />
          
          {/* Main modal */}
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-6 border-b-2 border-indigo-300 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-5xl">
                    {callTypeEmojis[call.call_type] || '📞'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                      {call.caller_name}
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${priorityColors[call.priority]}`}>
                        {call.priority.toUpperCase()}
                      </span>
                    </h2>
                    {call.company && (
                      <p className="text-lg text-blue-100 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {call.company}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 bg-slate-200 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Chiudi"
                >
                  <X className="w-7 h-7 text-slate-800" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden">
              {/* Type and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="text-sm text-slate-400 mb-1">Tipo Chiamata</div>
                  <div className="text-xl font-bold text-slate-800">
                    {callTypeEmojis[call.call_type]} {callTypeLabels[call.call_type]}
                  </div>
                </div>
                <div className={`${statusColors[call.status].bg} rounded-xl p-4 border border-slate-200`}>
                  <div className="text-sm text-slate-400 mb-1">Stato</div>
                  <div className={`text-xl font-bold ${statusColors[call.status].text}`}>
                    {statusColors[call.status].label}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-5 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Informazioni Contatto
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Telefono</div>
                      <a 
                        href={`tel:${call.phone}`} 
                        className="text-lg font-semibold text-indigo-400 hover:text-blue-200 transition-colors"
                      >
                        {call.phone}
                      </a>
                    </div>
                  </div>
                  {call.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Email</div>
                        <a 
                          href={`mailto:${call.email}`} 
                          className="text-lg font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                        >
                          {call.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gradient-to-br from-violet-50 to-blue-900/30 rounded-xl p-5 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Note e Richiesta
                </h3>
                <p className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {call.notes}
                </p>
              </div>

              {/* Follow-up */}
              {call.follow_up && call.follow_up_date && (
                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-5 border-2 border-orange-500/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-orange-300" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-200 font-semibold">Follow-up Programmato</div>
                      <div className="text-xl font-bold text-slate-800">
                        {formatFollowUpDate(call.follow_up_date)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Date */}
              <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-50 rounded-lg p-4">
                <Clock className="w-4 h-4" />
                <span>Chiamata ricevuta il {formatDate(call.call_date)}</span>
              </div>
            </div>

            {/* Decorative borders */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-400 opacity-70" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-400 opacity-70" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
