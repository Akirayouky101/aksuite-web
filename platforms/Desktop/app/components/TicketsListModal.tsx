'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Ticket, Plus, Search, Calendar, User, Users, AlertCircle, CheckCircle2, Circle, PlayCircle, XCircle, Trash2, Edit2 } from 'lucide-react'
import { Ticket as TicketType, TicketCategory } from '../hooks/useTickets'
import { CATEGORY_CONFIG } from './TicketModal'

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

const STATUS_CONFIG: Record<TicketType['status'], { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  aperto:     { label: 'Aperto',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: <Circle size={13} /> },
  in_corso:   { label: 'In Corso',   color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: <PlayCircle size={13} /> },
  completato: { label: 'Completato', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  icon: <CheckCircle2 size={13} /> },
  chiuso:     { label: 'Chiuso',     color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200',  icon: <XCircle size={13} /> },
}

const PRIORITY_DOT: Record<TicketType['priority'], string> = {
  bassa: 'bg-green-400', normale: 'bg-blue-400', alta: 'bg-orange-400', urgente: 'bg-red-500',
}

const STATUS_NEXT: Record<TicketType['status'], TicketType['status']> = {
  aperto: 'in_corso', in_corso: 'completato', completato: 'chiuso', chiuso: 'aperto',
}

type FilterStatus = 'tutti' | TicketType['status']
type FilterView = 'miei' | 'tutti'
type FilterCategory = 'tutti' | TicketCategory
const ALL_CATEGORIES: FilterCategory[] = ['tutti', 'ordine', 'preventivo', 'assistenza', 'documentazione', 'chiamata']

export default function TicketsListModal({
  isOpen, onClose, tickets, currentUserId, isAdmin, canCreate,
  onAdd, onEdit, onDelete, onStatusChange,
}: TicketsListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('tutti')
  const [filterView, setFilterView] = useState<FilterView>('miei')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('tutti')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const visibleTickets = useMemo(() => {
    let list = tickets
    if (filterView === 'miei') {
      list = list.filter(t => t.created_by === currentUserId || t.assignees.some(a => a.user_id === currentUserId))
    }
    if (filterStatus !== 'tutti') list = list.filter(t => t.status === filterStatus)
    if (filterCategory !== 'tutti') list = list.filter(t => t.category === filterCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || t.assignees.some(a => a.user_name.toLowerCase().includes(q)))
    }
    return list
  }, [tickets, filterView, filterStatus, filterCategory, search, currentUserId])

  const countMiei = useMemo(() =>
    tickets.filter(t => t.status !== 'chiuso' && t.status !== 'completato' && (t.created_by === currentUserId || t.assignees.some(a => a.user_id === currentUserId))).length,
    [tickets, currentUserId]
  )

  const isOverdue = (due: string | null) => due ? new Date(due) < new Date(new Date().toDateString()) : false

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-2xl flex flex-col max-h-[90vh] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                <Ticket size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-slate-800 font-bold text-lg">Ticket</h2>
                <p className="text-slate-400 text-xs">{countMiei > 0 ? `${countMiei} aperti assegnati a te` : 'Nessun ticket aperto'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <button
                  onClick={onAdd}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all shadow-lg shadow-violet-200"
                >
                  <Plus size={15} /> Nuovo
                </button>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 ml-1">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Filtri */}
          <div className="px-6 py-4 border-b border-slate-100 shrink-0 space-y-3 bg-white/40">
            {isAdmin && (
              <div className="flex gap-2">
                {(['miei', 'tutti'] as FilterView[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setFilterView(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterView === v ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                  >
                    {v === 'miei' ? 'I miei' : 'Tutti'}
                  </button>
                ))}
              </div>
            )}

            {/* Ricerca */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cerca ticket..."
                className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
              />
            </div>

            {/* Filtro categoria */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {ALL_CATEGORIES.map(cat => {
                const cfg = cat !== 'tutti' ? CATEGORY_CONFIG[cat] : null
                const active = filterCategory === cat
                return (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? cfg ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                    }`}>
                    {cfg && <span className="opacity-80">{cfg.icon}</span>}
                    {cat === 'tutti' ? 'Tutti' : cfg?.label}
                  </button>
                )
              })}
            </div>

            {/* Filtro status */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {(['tutti', 'aperto', 'in_corso', 'completato', 'chiuso'] as FilterStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                >
                  {s === 'tutti' ? 'Tutti' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {visibleTickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Ticket size={40} className="mb-3 opacity-20" />
                <p className="text-sm">Nessun ticket trovato</p>
              </div>
            )}

            {visibleTickets.map(ticket => {
              const statusCfg = STATUS_CONFIG[ticket.status]
              const overdue = isOverdue(ticket.due_date) && ticket.status !== 'chiuso' && ticket.status !== 'completato'
              const isExpanded = expandedId === ticket.id

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  className="bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Riga principale */}
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ticket.id)}>
                    <div className="flex items-start gap-3">
                      {/* Priority dot */}
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-800 font-medium text-sm leading-snug flex-1">{ticket.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ticket.category && CATEGORY_CONFIG[ticket.category as TicketCategory] && (
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${CATEGORY_CONFIG[ticket.category as TicketCategory].color} ${CATEGORY_CONFIG[ticket.category as TicketCategory].bg} ${CATEGORY_CONFIG[ticket.category as TicketCategory].border}`}>
                                {CATEGORY_CONFIG[ticket.category as TicketCategory].icon}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                              {statusCfg.icon} {statusCfg.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {ticket.assignees.length > 0 ? ticket.assignees.map(a => a.user_name).join(', ') : 'Nessuno'}
                          </span>
                          {ticket.due_date && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                              <Calendar size={11} />
                              {overdue && <AlertCircle size={10} />}
                              {new Date(ticket.due_date + 'T00:00:00').toLocaleDateString('it-IT')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User size={11} /> {ticket.created_by_name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Espanso */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                          {ticket.description && (
                            <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                          )}

                          {ticket.assignees.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {ticket.assignees.map(a => (
                                <span key={a.user_id} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs rounded-lg px-2.5 py-1">
                                  <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-[9px] font-bold">
                                    {a.user_name[0]?.toUpperCase()}
                                  </div>
                                  {a.user_name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => onStatusChange(ticket.id, STATUS_NEXT[ticket.status])}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border} hover:opacity-80`}
                            >
                              {statusCfg.icon} → {STATUS_CONFIG[STATUS_NEXT[ticket.status]].label}
                            </button>

                            <div className="flex-1" />

                            {canCreate && (
                              <button
                                onClick={() => onEdit(ticket)}
                                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs transition-colors"
                              >
                                <Edit2 size={11} /> Modifica
                              </button>
                            )}
                            {canCreate && (
                              <button
                                onClick={() => handleDelete(ticket.id)}
                                disabled={deletingId === ticket.id}
                                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={11} /> {deletingId === ticket.id ? '...' : 'Elimina'}
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
        </div>
      </motion.div>
    </div>
  )
}

