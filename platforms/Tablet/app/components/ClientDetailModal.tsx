'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Phone, Mail, MapPin, Building2, Star, Wrench, Calendar, Clock, FileText, ChevronDown, ChevronUp, PhoneCall, Eye, StickyNote, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Client } from '../hooks/useClients'
import { Call } from '../hooks/useCalls'
import { Lavorazione } from '../hooks/useLavorazioni'
import { Visit } from '../hooks/useVisits'

interface ClientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  calls: Call[]
  lavorazioni: Lavorazione[]
  visits: Visit[]
  onEditClient?: (client: Client) => void
  onOpenLavorazione?: (lav: Lavorazione) => void
  onNewCall?: (clientData: { caller_name: string; company: string; phone: string; email: string; address: string; city: string; zip_code: string; province: string }) => void
  onNewLavorazione?: (clientData: { client_id: string; client_name: string; address: string; city: string; zip_code: string; province: string }) => void
}

type TimelineItem = {
  id: string
  type: 'call' | 'lavorazione' | 'visit'
  date: string
  title: string
  subtitle: string
  status: string
  priority?: string
  raw: Call | Lavorazione | Visit
}

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  in_corso: 'In Corso',
  completed: 'Completata',
  cancelled: 'Annullata',
  scheduled: 'Programmata',
  in_progress: 'In Corso',
  da_fare: 'Da Fare',
  completata: 'Completata',
  annullata: 'Annullata',
}

const typeConfig = {
  call: { icon: PhoneCall, label: 'Chiamata', bg: 'bg-blue-50', border: 'border-blue-200/60', text: 'text-blue-600', dot: 'bg-blue-500' },
  lavorazione: { icon: Wrench, label: 'Lavorazione', bg: 'bg-indigo-50', border: 'border-indigo-200/60', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  visit: { icon: Eye, label: 'Visita', bg: 'bg-violet-50', border: 'border-violet-200/60', text: 'text-violet-600', dot: 'bg-violet-500' },
}

export default function ClientDetailModal({ isOpen, onClose, client, calls, lavorazioni, visits, onEditClient, onOpenLavorazione, onNewCall, onNewLavorazione }: ClientDetailModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'call' | 'lavorazione' | 'visit'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Match client data across entities
  const timeline = useMemo(() => {
    if (!client) return []
    const items: TimelineItem[] = []
    const nameL = client.name.toLowerCase()
    const companyL = client.company?.toLowerCase() || ''
    const phoneClean = client.phone?.replace(/\s/g, '') || ''
    const phone2Clean = client.phone2?.replace(/\s/g, '') || ''

    // Generic/category company names should NOT be used for matching
    const genericCompanies = ['privato', 'private', 'azienda', 'company', 'altro', 'other', 'nessuna', 'none', '']
    const companyIsGeneric = !companyL || genericCompanies.includes(companyL)

    // Match calls by name, company, or phone
    calls.forEach(c => {
      const matchName = c.caller_name?.toLowerCase() === nameL
      const matchCompany = !companyIsGeneric && companyL && c.company?.toLowerCase() === companyL
      const matchPhone = phoneClean && c.phone?.replace(/\s/g, '') === phoneClean
      const matchPhone2 = phone2Clean && c.phone?.replace(/\s/g, '') === phone2Clean
      if (matchName || matchCompany || matchPhone || matchPhone2) {
        items.push({
          id: `call-${c.id}`, type: 'call', date: c.call_date || c.created_at,
          title: `Chiamata: ${c.caller_name}${c.company ? ` (${c.company})` : ''}`,
          subtitle: c.notes || 'Nessuna nota',
          status: c.status, priority: c.priority, raw: c
        })
      }
    })

    // Match lavorazioni by client_id
    lavorazioni.forEach(l => {
      if (l.client_id === client.id) {
        items.push({
          id: `lav-${l.id}`, type: 'lavorazione', date: l.scheduled_date || l.created_at,
          title: l.title,
          subtitle: l.description || l.address ? `${l.address}${l.city ? ', ' + l.city : ''}` : 'Nessuna descrizione',
          status: l.status, priority: l.priority, raw: l
        })
      }
    })

    // Match visits by name, company, or phone
    visits.forEach(v => {
      const matchName = v.visitor_name?.toLowerCase() === nameL
      const matchCompany = !companyIsGeneric && companyL && v.company?.toLowerCase() === companyL
      const matchPhone = phoneClean && v.phone?.replace(/\s/g, '') === phoneClean
      if (matchName || matchCompany || matchPhone) {
        items.push({
          id: `visit-${v.id}`, type: 'visit', date: v.visit_date || v.created_at,
          title: `Visita: ${v.visitor_name}${v.company ? ` (${v.company})` : ''}`,
          subtitle: v.notes || 'Nessuna nota',
          status: v.status, priority: v.priority, raw: v
        })
      }
    })

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return items
  }, [client, calls, lavorazioni, visits])

  if (!isOpen || !client) return null

  const filteredTimeline = filterType === 'all' ? timeline : timeline.filter(t => t.type === filterType)

  const counts = {
    all: timeline.length,
    call: timeline.filter(t => t.type === 'call').length,
    lavorazione: timeline.filter(t => t.type === 'lavorazione').length,
    visit: timeline.filter(t => t.type === 'visit').length,
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {client.name}
                    {client.is_favorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {client.company && `${client.company} \u2022 `}Storico interazioni
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onNewCall && client && (
                  <button onClick={() => { onNewCall({ caller_name: client.name, company: client.company || '', phone: client.phone || '', email: client.email || '', address: client.address || '', city: client.city || '', zip_code: client.zip_code || '', province: client.province || '' }); onClose() }} title="Nuova chiamata"
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-600 text-xs font-bold transition-all flex items-center gap-1">
                    <Phone className="w-3 h-3" />Chiamata
                  </button>
                )}
                {onNewLavorazione && client && (
                  <button onClick={() => { onNewLavorazione({ client_id: client.id, client_name: client.name, address: client.address || '', city: client.city || '', zip_code: client.zip_code || '', province: client.province || '' }); onClose() }} title="Nuova lavorazione"
                    className="px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200/60 text-violet-600 text-xs font-bold transition-all flex items-center gap-1">
                    <Wrench className="w-3 h-3" />Lavorazione
                  </button>
                )}
                {onEditClient && (
                  <button onClick={() => onEditClient(client)} title="Modifica cliente"
                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-bold transition-all">
                    Modifica
                  </button>
                )}
                <button onClick={onClose} title="Chiudi"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100/80 bg-slate-50/50 flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{client.phone}</span>
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{[client.address, client.city, client.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {client.company && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{client.company}</span>
                  </div>
                )}
              </div>
              {(client.fiscal_code || client.vat_number) && (
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  {client.fiscal_code && <span>C.F.: {client.fiscal_code}</span>}
                  {client.vat_number && <span>P.IVA: {client.vat_number}</span>}
                </div>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100/80 bg-white flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                {(['all', 'call', 'lavorazione', 'visit'] as const).map(type => {
                  const isActive = filterType === type
                  const config = type === 'all'
                    ? { label: 'Tutto', bg: 'bg-slate-50', text: 'text-slate-600' }
                    : typeConfig[type]
                  return (
                    <button key={type} onClick={() => setFilterType(type)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}>
                      {type === 'all' ? 'Tutto' : config.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-200/60'}`}>
                        {counts[type]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100/80 bg-white flex-shrink-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-xl bg-blue-50 border border-blue-200/40">
                  <div className="text-lg font-bold text-blue-600">{counts.call}</div>
                  <div className="text-[10px] text-blue-400 font-medium">Chiamate</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-indigo-50 border border-indigo-200/40">
                  <div className="text-lg font-bold text-indigo-600">{counts.lavorazione}</div>
                  <div className="text-[10px] text-indigo-400 font-medium">Lavorazioni</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-violet-50 border border-violet-200/40">
                  <div className="text-lg font-bold text-violet-600">{counts.visit}</div>
                  <div className="text-[10px] text-violet-400 font-medium">Visite</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4">
              {filteredTimeline.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">{'\u{1F4CB}'}</div>
                  <p className="text-slate-400 text-lg">Nessuna interazione registrata</p>
                  <p className="text-slate-300 text-sm mt-1">Le chiamate, lavorazioni e visite appariranno qui</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200/60" />

                  <div className="space-y-4">
                    {filteredTimeline.map((item) => {
                      const config = typeConfig[item.type]
                      const ItemIcon = config.icon
                      const isExpanded = expandedId === item.id

                      return (
                        <div key={item.id} className="relative pl-10">
                          {/* Dot */}
                          <div className={`absolute left-[9px] top-4 w-3 h-3 rounded-full ${config.dot} ring-2 ring-white`} />

                          <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md ${config.bg} ${config.border}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ItemIcon className={`w-4 h-4 flex-shrink-0 ${config.text}`} />
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                                  {config.label}
                                </span>
                                <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                              </div>
                            </div>

                            {/* Status badge */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                ['completed', 'completata'].includes(item.status) ? 'bg-emerald-100 text-emerald-600' :
                                ['in_corso', 'in_progress'].includes(item.status) ? 'bg-amber-100 text-amber-600' :
                                ['cancelled', 'annullata'].includes(item.status) ? 'bg-red-100 text-red-500' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {statusLabels[item.status] || item.status}
                              </span>
                              {item.priority && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  item.priority === 'urgente' || item.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                  item.priority === 'alta' || item.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                  item.priority === 'media' || item.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t border-slate-200/40 space-y-2">
                                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                                    {item.type === 'lavorazione' && onOpenLavorazione && (
                                      <button onClick={(e) => { e.stopPropagation(); onOpenLavorazione(item.raw as Lavorazione) }}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 text-xs font-bold transition-all">
                                        Apri Lavorazione
                                      </button>
                                    )}
                                    {item.type === 'call' && (
                                      <div className="text-xs text-slate-400 space-y-1">
                                        {(item.raw as Call).phone && <div>Tel: {(item.raw as Call).phone}</div>}
                                        {(item.raw as Call).assigned_to && <div>Assegnato: {(item.raw as Call).assigned_to}</div>}
                                      </div>
                                    )}
                                    {item.type === 'visit' && (
                                      <div className="text-xs text-slate-400 space-y-1">
                                        {(item.raw as Visit).visit_type && <div>Tipo: {(item.raw as Visit).visit_type}</div>}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
