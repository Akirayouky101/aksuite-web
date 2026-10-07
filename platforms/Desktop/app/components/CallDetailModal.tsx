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
  status: 'pending' | 'in_corso' | 'completed' | 'cancelled'
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
  bassa: { bg: 'bg-ak-success-bg', text: 'text-ak-success' },
  media: { bg: 'bg-ak-warning-bg', text: 'text-ak-warning' },
  alta: { bg: 'bg-ak-orange-bg', text: 'text-ak-orange' },
  urgente: { bg: 'bg-ak-danger-bg', text: 'text-ak-danger' }
}

const statusConfig = {
  pending: { bg: 'bg-ak-warning-bg', border: 'border-ak-warning/60', text: 'text-ak-warning', label: 'In Attesa', icon: '⏳' },
  in_corso: { bg: 'bg-ak-hover', border: 'border-ak-line/60', text: 'text-ak-cyan', label: 'In Corso', icon: '🔧' },
  completed: { bg: 'bg-ak-success-bg', border: 'border-ak-success/60', text: 'text-ak-success', label: 'Completata', icon: '✅' },
  cancelled: { bg: 'bg-ak-danger-bg', border: 'border-ak-danger/60', text: 'text-ak-danger', label: 'Annullata', icon: '❌' }
}

export default function CallDetailModal({ isOpen, onClose, call }: CallDetailModalProps) {
  if (!isOpen || !call) return null

  const status = statusConfig[call.status] || statusConfig.pending

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
      <div className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          <div className="bg-ak-panel/90 backdrop-blur-2xl rounded-2xl border border-ak-line/60 shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ak-line/60 bg-ak-panel/60 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ak-inset to-ak-panel border border-ak-line/60 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-ak-subtle">{call.caller_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-ak-text truncate">{call.caller_name}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${status.bg} ${status.text}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  {call.company && (
                    <p className="text-xs text-ak-subtle flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {call.company}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-ak-inset hover:bg-ak-danger-bg border border-ak-line/60 hover:border-ak-danger flex items-center justify-center transition-all flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-ak-subtle hover:text-ak-danger" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Motivo */}
              {call.notes && (
                <div className="bg-ak-panel/70 rounded-xl p-4 border border-ak-line/40">
                  <h3 className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Motivo della chiamata
                  </h3>
                  <p className="text-sm text-ak-text leading-relaxed whitespace-pre-wrap">
                    {call.notes}
                  </p>
                </div>
              )}

              {/* Contatto */}
              <div className="bg-ak-panel/70 rounded-xl p-4 border border-ak-line/40">
                <h3 className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Informazioni Contatto
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-ak-hover rounded-lg flex items-center justify-center border border-ak-line">
                      <Phone className="w-4 h-4 text-ak-cyan" />
                    </div>
                    <div>
                      <div className="text-[10px] text-ak-subtle uppercase tracking-wider">Telefono</div>
                      <a href={`tel:${call.phone}`} className="text-sm font-semibold text-ak-cyan hover:text-ak-cyan transition-colors">
                        {call.phone}
                      </a>
                    </div>
                  </div>
                  {call.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-ak-purple-bg rounded-lg flex items-center justify-center border border-ak-purple">
                        <Mail className="w-4 h-4 text-ak-purple" />
                      </div>
                      <div>
                        <div className="text-[10px] text-ak-subtle uppercase tracking-wider">Email</div>
                        <a href={`mailto:${call.email}`} className="text-sm font-semibold text-ak-purple hover:text-ak-purple transition-colors">
                          {call.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Indirizzo */}
              {(call.address || call.city || call.province || call.zip_code) && (
                <div className="bg-ak-panel/70 rounded-xl p-4 border border-ak-line/40">
                  <h3 className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Indirizzo Cliente
                  </h3>
                  <div className="space-y-1.5">
                    {call.address && (
                      <p className="text-sm font-semibold text-ak-text">{call.address}</p>
                    )}
                    <p className="text-sm text-ak-muted">
                      {[call.city, call.province && `(${call.province})`, call.zip_code].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Data chiamata */}
              <div className="flex items-center gap-2 text-xs text-ak-subtle px-1">
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
