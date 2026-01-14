'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Repeat, ToggleLeft, ToggleRight, Trash2, Calendar } from 'lucide-react'
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-purple-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Transazioni Ricorrenti</h2>
                  <p className="text-sm text-slate-400">{recurring.length} automatiche attive</p>
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

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
              {recurring.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔄</div>
                  <p className="text-slate-400 text-lg">Nessuna transazione ricorrente</p>
                  <p className="text-slate-500 text-sm mt-2">Crea una per automatizzare stipendi, affitti e bollette!</p>
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
                          ? 'from-green-500/10 to-emerald-600/10 border-green-500/30'
                          : 'from-red-500/10 to-rose-600/10 border-red-500/30'
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
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {rec.category}
                              </span>
                              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300">
                                {getFrequencyDetails(rec)}
                              </span>
                              {!rec.is_active && (
                                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-500/20 text-slate-400">
                                  ⏸️ In pausa
                                </span>
                              )}
                            </div>

                            <h3 className="text-white font-medium text-lg mb-1">
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
                            className="w-10 h-10 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center transition-all"
                            aria-label={rec.is_active ? 'Disattiva' : 'Attiva'}
                            title={rec.is_active ? 'Metti in pausa' : 'Riattiva'}
                          >
                            {rec.is_active ? (
                              <ToggleRight className="w-5 h-5 text-purple-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-500" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDelete(rec.id)}
                            className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                      <p className="text-blue-300 font-medium mb-1">Come funziona?</p>
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
