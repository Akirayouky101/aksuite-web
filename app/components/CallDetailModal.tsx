'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Mail, Building2, Calendar, Clock, MessageSquare, User, MapPin } from 'lucide-react'

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

interface CallDetailModalProps {
  isOpen: boolean
  onClose: () => void
  call: Call | null
}

const callTypeLabels: Record<string, string> = {
  informazioni: 'Informazioni',
  assistenza: 'Assistenza Tecnica',
  vendita: 'Vendita',
  reclamo: 'Reclamo',
  altro: 'Altro'
}

const priorityConfig: Record<string, { bg: string; text: string }> = {
  bassa: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  media: { bg: 'bg-amber-50', text: 'text-amber-700' },
  alta: { bg: 'bg-orange-50', text: 'text-orange-700' },
  urgente: { bg: 'bg-red-50', text: 'text-red-700' }
}

const statusConfig = {
  pending: { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', label: 'In Attesa', icon: '⏳' },
  completed: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', label: 'Completata', icon: '✅' },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-500', label: 'Annullata', icon: '❌' }
}

export default function CallDetailModal({ isOpen, onClose, call }: CallDetailModalProps) {
  if (!isOpen || !call) return null

  const priority = priorityConfig[call.priority] || priorityConfig.media
  const status = statusConfig[call.status]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const formatFollowUpDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-slate-400">{call.caller_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-800 truncate">{call.caller_name}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${priority.bg} ${priority.text}`}>
                      {call.priority.toUpperCase()}
                    </span>
                  </div>
                  {call.company && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {call.company}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Tipo + Stato */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Tipo Chiamata</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {callTypeLabels[call.call_type] || call.call_type}
                  </div>
                </div>
                <div className={`${status.bg} rounded-xl p-4 border ${status.border}`}>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Stato</div>
                  <div className={`text-sm font-semibold ${status.text} flex items-center gap-1.5`}>
                    <span>{status.icon}</span>
                    {status.label}
                  </div>
                </div>
              </div>

              {/* Contatto */}
              <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Informazioni Contatto
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                      <Phone className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Telefono</div>
                      <a href={`tel:${call.phone}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        {call.phone}
                      </a>
                    </div>
                  </div>
                  {call.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
                        <Mail className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Email</div>
                        <a href={`mailto:${call.email}`} className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                          {call.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Indirizzo */}
              {(call.address || call.city || call.province || call.zip_code) && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Indirizzo Cliente
                  </h3>
                  <div className="space-y-1.5">
                    {call.address && (
                      <p className="text-sm font-semibold text-slate-700">{call.address}</p>
                    )}
                    <p className="text-sm text-slate-500">
                      {[call.city, call.province && `(${call.province})`, call.zip_code].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Assegnata A */}
              {call.assigned_to && (
                <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-200/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center border border-indigo-200/60">
                      <User className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-medium">Assegnata A</div>
                      <div className="text-sm font-bold text-indigo-700">{call.assigned_to}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Note */}
              {call.notes && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/40">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Note e Richiesta
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {call.notes}
                  </p>
                </div>
              )}

              {/* Follow-up */}
              {call.follow_up && call.follow_up_date && (
                <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center border border-amber-200/60">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-500 uppercase tracking-wider font-medium">Follow-up Programmato</div>
                      <div className="text-base font-bold text-slate-800">
                        {formatFollowUpDate(call.follow_up_date)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data chiamata */}
              <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Chiamata ricevuta il {formatDate(call.call_date)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
