'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, Filter, Trash2, RefreshCw,
  ArrowUp, ArrowDown, Search, Calendar,
  Phone, Wrench, CheckSquare, DollarSign,
  Lock, StickyNote, Users, MapPin, Truck,
  ShoppingCart, Package, FileText, Shield,
  User, Plus, Pencil, Trash, ChevronDown
} from 'lucide-react'
import { type ActivityLog, ENTITY_LABELS } from '../hooks/useActivityLog'

const ACTION_CONFIG = {
  create: { label: 'Creato', icon: Plus, bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  update: { label: 'Modificato', icon: Pencil, bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  delete: { label: 'Eliminato', icon: Trash, bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
}

interface ActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
  logs: ActivityLog[]
  loading: boolean
  onLoadLogs: () => Promise<void>
  onClearOldLogs: (days: number) => Promise<void>
  isAdmin: boolean
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'ora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m fa`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`
  if (diff < 604800) return `${Math.floor(diff / 86400)}g fa`
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ActivityLogModal({
  isOpen,
  onClose,
  logs,
  loading,
  onLoadLogs,
  onClearOldLogs,
  isAdmin,
}: ActivityLogModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) onLoadLogs()
  }, [isOpen, onLoadLogs])

  if (!isOpen) return null

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (filterEntity !== 'all' && log.entity_type !== filterEntity) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        log.user_name.toLowerCase().includes(q) ||
        log.entity_name.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        (ENTITY_LABELS[log.entity_type]?.label || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // Raggruppa per giorno
  const groupedByDay: Record<string, ActivityLog[]> = {}
  filteredLogs.forEach(log => {
    const day = new Date(log.created_at).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    if (!groupedByDay[day]) groupedByDay[day] = []
    groupedByDay[day].push(log)
  })

  const uniqueEntities = Array.from(new Set(logs.map(l => l.entity_type)))

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 40px rgba(139,92,246,0.1)',
          }}
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Cronologia Attivit&agrave;</h2>
                <p className="text-xs text-gray-500">{filteredLogs.length} attivit&agrave; registrate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onLoadLogs()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Aggiorna">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ background: showFilters ? 'rgba(139,92,246,0.1)' : undefined }}
                title="Filtri">
                <Filter className="w-4 h-4" style={{ color: showFilters ? '#8b5cf6' : '#6b7280' }} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-gray-100"
              >
                <div className="p-4 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cerca per nome, utente, dettaglio..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="flex gap-3">
                    {/* Filter by action */}
                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400 bg-white">
                      <option value="all">Tutte le azioni</option>
                      <option value="create">Creazione</option>
                      <option value="update">Modifica</option>
                      <option value="delete">Eliminazione</option>
                    </select>
                    {/* Filter by entity */}
                    <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400 bg-white">
                      <option value="all">Tutti i moduli</option>
                      {uniqueEntities.map(et => (
                        <option key={et} value={et}>
                          {ENTITY_LABELS[et]?.label || et}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '60vh' }}>
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nessuna attivit&agrave;</p>
                <p className="text-gray-400 text-sm mt-1">Le attivit&agrave; appariranno qui</p>
              </div>
            ) : (
              Object.entries(groupedByDay).map(([day, dayLogs]) => (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {day}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Day logs */}
                  <div className="space-y-1.5 ml-1">
                    {dayLogs.map((log) => {
                      const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.update
                      const entityCfg = ENTITY_LABELS[log.entity_type] || { label: log.entity_type, emoji: '\u{1F4CB}' }
                      const ActionIcon = actionCfg.icon

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          {/* Action icon */}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: actionCfg.bg, border: `1px solid ${actionCfg.border}` }}>
                            <ActionIcon className="w-3.5 h-3.5" style={{ color: actionCfg.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm text-gray-800">
                                {log.user_name || log.user_email.split('@')[0]}
                              </span>
                              <span className="text-sm text-gray-500">{actionCfg.label.toLowerCase()}</span>
                              <span className="text-sm">{entityCfg.emoji}</span>
                              <span className="text-sm font-medium" style={{ color: actionCfg.color }}>
                                {entityCfg.label}
                              </span>
                            </div>
                            {log.entity_name && (
                              <p className="text-xs text-gray-600 mt-0.5 truncate">
                                {log.entity_name}
                              </p>
                            )}
                            {log.details && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {log.details}
                              </p>
                            )}
                          </div>

                          {/* Time */}
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-1"
                            title={formatDate(log.created_at)}>
                            {timeAgo(log.created_at)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {isAdmin && logs.length > 0 && (
            <div className="p-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Ultimi {logs.length} eventi
              </span>
              <button
                onClick={() => onClearOldLogs(30)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Pulisci +30 giorni
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
