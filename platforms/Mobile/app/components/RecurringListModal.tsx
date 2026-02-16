'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Repeat, ToggleLeft, ToggleRight, Trash2, Calendar, RefreshCw } from 'lucide-react'
import { RecurringTransaction } from '../hooks/useRecurring'

interface RecurringListModalProps {
  isOpen: boolean
  onClose: () => void
  recurring: RecurringTransaction[]
  onToggleActive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const frequencyLabels = {
  daily: '📆 Giornaliera',
  weekly: '📅 Settimanale',
  monthly: '🗓️ Mensile',
  yearly: '📊 Annuale'
}

const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function RecurringListModal({ 
  isOpen, 
  onClose, 
  recurring, 
  onToggleActive,
  onDelete 
}: RecurringListModalProps) {
  
  const formatNextDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getFrequencyDetails = (rec: RecurringTransaction) => {
    const label = frequencyLabels[rec.frequency]
    if (rec.frequency === 'weekly' && rec.day_of_week !== undefined) {
      return `${label} - ${dayNames[rec.day_of_week]}`
    }
    if ((rec.frequency === 'monthly' || rec.frequency === 'yearly') && rec.day_of_month) {
      return `${label} - Giorno ${rec.day_of_month}`
    }
    return label
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  flex items-center justify-center p-4 z-50 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full overflow-x-hidden"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600 rounded-3xl hidden" />
          
          {/* Main modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Transazioni Ricorrenti</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{recurring.length} automatiche attive</p>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-88px)]">
              {recurring.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔄</div>
                  <p className="text-slate-400 text-lg">Nessuna transazione ricorrente</p>
                  <p className="text-slate-400 text-sm mt-2">Crea una per automatizzare stipendi, affitti e bollette!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurring.map((rec, index) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group bg-gradient-to-br ${
                        rec.type === 'income'
                          ? 'from-green-500/10 to-emerald-600/10 border-emerald-200/60'
                          : 'from-red-500/10 to-rose-600/10 border-red-200/60'
                      } border-2 rounded-xl p-5 transition-all hover:shadow-lg ${
                        !rec.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Emoji */}
                          <div className="text-4xl">{rec.emoji}</div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                rec.type === 'income'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-red-50 text-red-500'
                              }`}>
                                {rec.category}
                              </span>
                              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-600">
                                {getFrequencyDetails(rec)}
                              </span>
                              {!rec.is_active && (
                                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500">
                                  ⏸️ In pausa
                                </span>
                              )}
                            </div>

                            <h3 className="text-slate-800 font-medium text-lg mb-1">
                              {rec.description}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Prossima: {formatNextDate(rec.next_date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              rec.type === 'income' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {rec.type === 'income' ? '+' : '-'}€{rec.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {/* Toggle Active */}
                          <button
                            onClick={() => onToggleActive(rec.id)}
                            className="w-10 h-10 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-all"
                            aria-label={rec.is_active ? 'Disattiva' : 'Attiva'}
                            title={rec.is_active ? 'Metti in pausa' : 'Riattiva'}
                          >
                            {rec.is_active ? (
                              <ToggleRight className="w-5 h-5 text-purple-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDelete(rec.id)}
                            className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Elimina"
                            title="Elimina ricorrente"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Info box */}
              {recurring.length > 0 && (
                <div className="mt-6 bg-indigo-50 border border-indigo-200/60 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                      <p className="text-indigo-400 font-medium mb-1">Come funziona?</p>
                      <p className="text-slate-400 text-sm">
                        Le transazioni ricorrenti vengono create automaticamente nella data indicata. 
                        Puoi metterle in pausa usando il toggle o eliminarle definitivamente.
                      </p>
                    </div>
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
