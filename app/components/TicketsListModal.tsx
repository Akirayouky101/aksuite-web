'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Ticket, Plus, Search, Filter, ChevronDown, Calendar, Clock, User, Users, AlertCircle, CheckCircle2, Circle, PlayCircle, XCircle, Trash2, Edit2, Flag } from 'lucide-react'
import { Ticket as TicketType } from '../hooks/useTickets'

interface UserProfile {
  id: string
  full_name: string
  email?: string
}

interface TicketsListModalProps {
  isOpen: boolean
  onClose: () => void
  tickets: TicketType[]
  currentUserId: string
  isAdmin: boolean
  canCreate: boolean
  onAdd: () => void
  onEdit: (ticket: TicketType) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TicketType['status']) => void
}

const STATUS_CONFIG: Record<TicketType['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  aperto:     { label: 'Aperto',     color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',   icon: <Circle size={14} /> },
  in_corso:   { label: 'In Corso',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: <PlayCircle size={14} /> },
  completato: { label: 'Completato', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',  icon: <CheckCircle2 size={14} /> },
  chiuso:     { label: 'Chiuso',     color: 'text-gray-400',   bg: 'bg-gray-400/10 border-gray-400/30',    icon: <XCircle size={14} /> },
}

const PRIORITY_CONFIG: Record<TicketType['priority'], { label: string; color: string; dot: string }> = {
  bassa:    { label: 'Bassa',    color: 'text-green-400',  dot: 'bg-green-400' },
  normale:  { label: 'Normale',  color: 'text-blue-400',   dot: 'bg-blue-400' },
  alta:     { label: 'Alta',     color: 'text-orange-400', dot: 'bg-orange-400' },
  urgente:  { label: 'Urgente',  color: 'text-red-400',    dot: 'bg-red-400' },
}

const STATUS_NEXT: Record<TicketType['status'], TicketType['status']> = {
  aperto: 'in_corso',
  in_corso: 'completato',
  completato: 'chiuso',
  chiuso: 'aperto',
}

type FilterStatus = 'tutti' | TicketType['status']
type FilterView = 'miei' | 'tutti'

export default function TicketsListModal({
  isOpen, onClose, tickets, currentUserId, isAdmin, canCreate,
  onAdd, onEdit, onDelete, onStatusChange,
}: TicketsListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('tutti')
  const [filterView, setFilterView] = useState<FilterView>('miei')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const visibleTickets = useMemo(() => {
    let list = tickets

    // Filtro vista: miei = assegnati a me O creati da me; tutti = admin vede tutto
    if (filterView === 'miei') {
      list = list.filter(t =>
        t.created_by === currentUserId ||
        t.assignees.some(a => a.user_id === currentUserId)
      )
    }

    // Filtro status
    if (filterStatus !== 'tutti') {
      list = list.filter(t => t.status === filterStatus)
    }

    // Ricerca
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.assignees.some(a => a.user_name.toLowerCase().includes(q))
      )
    }

    return list
  }, [tickets, filterView, filterStatus, search, currentUserId])

  const countMiei = useMemo(() =>
    tickets.filter(t => t.status !== 'chiuso' && (t.created_by === currentUserId || t.assignees.some(a => a.user_id === currentUserId))).length,
    [tickets, currentUserId]
  )

  const isOverdue = (due: string | null) => {
    if (!due) return false
    return new Date(due) < new Date(new Date().toDateString())
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                  <Ticket size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Ticket</h2>
                  <p className="text-gray-400 text-sm">{countMiei} aperti assegnati a te</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canCreate && (
                  <button
                    onClick={onAdd}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Plus size={16} /> Nuovo
                  </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 ml-1">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Filtri */}
            <div className="px-6 py-4 border-b border-gray-700/50 shrink-0 space-y-3">
              {/* Vista miei / tutti (solo admin) */}
              {isAdmin && (
                <div className="flex gap-2">
                  {(['miei', 'tutti'] as FilterView[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setFilterView(v)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filterView === v ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      {v === 'miei' ? 'I miei' : 'Tutti'}
                    </button>
                  ))}
                </div>
              )}

              {/* Ricerca */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca ticket..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Filtro status */}
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {(['tutti', 'aperto', 'in_corso', 'completato', 'chiuso'] as FilterStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    {s === 'tutti' ? 'Tutti' : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {visibleTickets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Ticket size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Nessun ticket trovato</p>
                </div>
              )}

              {visibleTickets.map(ticket => {
                const statusCfg = STATUS_CONFIG[ticket.status]
                const priorityCfg = PRIORITY_CONFIG[ticket.priority]
                const overdue = isOverdue(ticket.due_date) && ticket.status !== 'chiuso' && ticket.status !== 'completato'
                const isExpanded = expandedId === ticket.id

                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
                  >
                    {/* Riga principale */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority dot */}
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${priorityCfg.dot}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-white font-medium text-sm leading-snug truncate flex-1">{ticket.title}</span>
                            {/* Status badge */}
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0 ${statusCfg.color} ${statusCfg.bg}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {/* Assignees */}
                            <span className="flex items-center gap-1">
                              <Users size={11} />
                              {ticket.assignees.length > 0
                                ? ticket.assignees.map(a => a.user_name).join(', ')
                                : 'Nessuno'}
                            </span>
                            {/* Scadenza */}
                            {ticket.due_date && (
                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                                <Calendar size={11} />
                                {overdue && <AlertCircle size={10} />}
                                {new Date(ticket.due_date + 'T00:00:00').toLocaleDateString('it-IT')}
                              </span>
                            )}
                            {/* Creato da */}
                            <span className="flex items-center gap-1">
                              <User size={11} /> {ticket.created_by_name || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Espanso: descrizione + azioni */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-700 pt-3 space-y-3">
                            {/* Descrizione */}
                            {ticket.description && (
                              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                            )}

                            {/* Tutti gli assegnatari */}
                            {ticket.assignees.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {ticket.assignees.map(a => (
                                  <span key={a.user_id} className="flex items-center gap-1.5 bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs rounded-lg px-2.5 py-1">
                                    <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white text-[9px] font-bold">
                                      {a.user_name[0]?.toUpperCase()}
                                    </div>
                                    {a.user_name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Azioni */}
                            <div className="flex items-center gap-2 pt-1">
                              {/* Avanza status */}
                              <button
                                onClick={() => onStatusChange(ticket.id, STATUS_NEXT[ticket.status])}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusCfg.color} ${statusCfg.bg} hover:opacity-80`}
                              >
                                {statusCfg.icon}
                                → {STATUS_CONFIG[STATUS_NEXT[ticket.status]].label}
                              </button>

                              <div className="flex-1" />

                              {/* Modifica */}
                              {(canCreate) && (
                                <button
                                  onClick={() => onEdit(ticket)}
                                  className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg px-3 py-1.5 text-xs transition-colors"
                                >
                                  <Edit2 size={12} /> Modifica
                                </button>
                              )}

                              {/* Elimina */}
                              {(canCreate) && (
                                <button
                                  onClick={() => handleDelete(ticket.id)}
                                  disabled={deletingId === ticket.id}
                                  className="flex items-center gap-1.5 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={12} /> {deletingId === ticket.id ? '...' : 'Elimina'}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
