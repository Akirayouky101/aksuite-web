'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, Trash2, CheckCircle, Clock, AlertCircle, Building2, Mail, Phone, Calendar, ExternalLink, Plus, Users } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import type { Visit } from '../hooks/useVisits'

interface VisitsListModalProps {
  isOpen: boolean
  onClose: () => void
  visits: Visit[]
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: Visit['status']) => Promise<void>
  onEdit?: (visit: Visit) => void
  onNew?: () => void
}

const statusColors = {
  scheduled: { bg: 'bg-indigo-50', border: 'border-indigo-200/60', text: 'text-indigo-400', icon: Calendar },
  in_progress: { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', icon: Clock },
  completed: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', icon: CheckCircle },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-500', icon: AlertCircle }
}

const statusLabels = {
  scheduled: '📅 Programmata',
  in_progress: '⏳ In Corso',
  completed: '✅ Completata',
  cancelled: '❌ Annullata'
}

export default function VisitsListModal({ isOpen, onClose, visits, onDelete, onStatusChange, onEdit, onNew }: VisitsListModalProps) {
  console.log('🔍 VisitsListModal - onEdit presente:', !!onEdit, 'onNew presente:', !!onNew)
  const [selectedFilter, setSelectedFilter] = useState<'all' | Visit['status']>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVisits = visits.filter(visit => {
    const matchesFilter = selectedFilter === 'all' || visit.status === selectedFilter
    const matchesSearch = !searchTerm || 
      visit.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting visit:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full my-8"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 rounded-3xl hidden" />
          
          {/* Main modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Registro Visite</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{visits.length} visite registrate</p>
                </div>
              </div>
              <div className="flex gap-2">
                {onNew && (
                  <button
                    onClick={onNew}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 text-sm"
                    title="Aggiungi nuova visita"
                  >
                    <Plus className="w-4 h-4" />
                    Nuova Visita
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

            {/* Search */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, azienda, telefono..."
                className="w-full px-4 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none"
              />
              <div className="text-xs text-slate-400 mt-2">
                {filteredVisits.length} di {visits.length} visite
              </div>
            </div>

            {/* Status Filters */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-purple-500 text-slate-800 shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  🌟 Tutte ({visits.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('scheduled')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'scheduled'
                      ? 'bg-blue-500 text-slate-800 shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  📅 Programmate ({visits.filter(v => v.status === 'scheduled').length})
                </button>
                <button
                  onClick={() => setSelectedFilter('in_progress')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'in_progress'
                      ? 'bg-yellow-500 text-slate-800 shadow-lg shadow-amber-200/50'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  ⏳ In Corso ({visits.filter(v => v.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setSelectedFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === 'completed'
                      ? 'bg-green-500 text-slate-800 shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  ✅ Completate ({visits.filter(v => v.status === 'completed').length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {filteredVisits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-xl text-slate-400 mb-2">Nessuna visita trovata</p>
                  <p className="text-sm text-slate-400">
                    {searchTerm ? 'Prova a modificare i criteri di ricerca' : 'Aggiungi la prima visita per iniziare'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVisits.map((visit) => {
                    const statusConfig = statusColors[visit.status]
                    const StatusIcon = statusConfig.icon
                    const visitDate = new Date(visit.visit_date)
                    const isToday = visitDate.toDateString() === new Date().toDateString()
                    const isPast = visitDate < new Date()

                    return (
                      <motion.div
                        key={visit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border-2 ${statusConfig.border} ${statusConfig.bg}  transition-all hover:shadow-lg`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Visitor Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <UserCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
                              <h3 className="text-xl font-bold text-slate-800 truncate">{visit.visitor_name}</h3>
                              {visit.follow_up && (
                                <span className="px-2 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-600 text-xs font-semibold">
                                  📌 Follow-up
                                </span>
                              )}
                            </div>

                            {visit.company && (
                              <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm">{visit.company}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-3">
                              {visit.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {visit.phone}
                                </div>
                              )}
                              {visit.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5" />
                                  {visit.email}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className={`text-sm font-semibold ${isToday ? 'text-indigo-500' : isPast ? 'text-slate-400' : 'text-slate-800'}`}>
                                {visitDate.toLocaleDateString('it-IT', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isToday && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-500 text-xs font-bold">
                                  OGGI
                                </span>
                              )}
                            </div>

                            {visit.notes && (
                              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{visit.notes}</p>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              <span className={`px-3 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.text} text-xs font-semibold flex items-center gap-1.5`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusLabels[visit.status]}
                              </span>
                              <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-semibold">
                                {visit.visit_type === 'riunione' && '🤝 Riunione'}
                                {visit.visit_type === 'colloquio' && '💼 Colloquio'}
                                {visit.visit_type === 'consegna' && '📦 Consegna'}
                                {visit.visit_type === 'assistenza' && '🛠️ Assistenza'}
                                {visit.visit_type === 'altro' && '📋 Altro'}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                visit.priority === 'urgente' ? 'bg-red-50 text-red-500' :
                                visit.priority === 'alta' ? 'bg-orange-50 text-orange-600' :
                                visit.priority === 'media' ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {visit.priority === 'urgente' && '🔴'}
                                {visit.priority === 'alta' && '🟠'}
                                {visit.priority === 'media' && '🟡'}
                                {visit.priority === 'bassa' && '🟢'}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col gap-2">
                            {/* Status Change Buttons */}
                            {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                              <div className="flex gap-2">
                                {visit.status === 'scheduled' && (
                                  <button
                                    onClick={() => onStatusChange(visit.id, 'in_progress')}
                                    className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-slate-800 text-xs font-semibold transition-colors"
                                    title="Segna come In Corso"
                                  >
                                    ⏳ Inizia
                                  </button>
                                )}
                                {visit.status === 'in_progress' && (
                                  <button
                                    onClick={() => onStatusChange(visit.id, 'completed')}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                                    title="Segna come Completata"
                                  >
                                    ✅ Completa
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                              {onEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(visit)
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Modifica visita"
                                >
                                  ✏️ Modifica
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirmId(visit.id)}
                                disabled={deletingId === visit.id}
                                className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                title="Elimina visita"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingId === visit.id ? 'Eliminazione...' : 'Elimina'}
                              </button>
                            </div>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmModal
          isOpen={true}
          title="Elimina Visita"
          message="Sei sicuro di voler eliminare questa visita? Questa azione non può essere annullata."
          onConfirm={() => handleDelete(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}
    </AnimatePresence>
  )
}
