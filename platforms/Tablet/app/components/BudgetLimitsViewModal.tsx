'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, XCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { BudgetLimitStatus } from '../hooks/useBudgetLimits'

interface BudgetLimitsViewModalProps {
  isOpen: boolean
  onClose: () => void
  limits: BudgetLimitStatus[]
  onToggleActive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const periodLabels = {
  daily: 'al giorno',
  weekly: 'a settimana',
  monthly: 'al mese',
  yearly: "all'anno"
}

export default function BudgetLimitsViewModal({
  isOpen,
  onClose,
  limits,
  onToggleActive,
  onDelete
}: BudgetLimitsViewModalProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'from-red-500/20 to-rose-600/20 border-red-500/50'
      case 'warning':
        return 'from-orange-500/20 to-yellow-600/20 border-orange-500/50'
      default:
        return 'from-green-500/20 to-emerald-600/20 border-green-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <XCircle className="w-6 h-6 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-400" />
      default:
        return <CheckCircle className="w-6 h-6 text-green-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return { text: 'SUPERATO!', color: 'text-red-400' }
      case 'warning':
        return { text: 'ATTENZIONE', color: 'text-orange-400' }
      default:
        return { text: 'OK', color: 'text-green-400' }
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-rose-600'
    if (percentage >= 80) return 'bg-gradient-to-r from-orange-500 to-yellow-500'
    return 'bg-gradient-to-r from-green-500 to-emerald-500'
  }

  if (!isOpen) return null

  const exceeded = limits.filter(l => l.status === 'exceeded')
  const warning = limits.filter(l => l.status === 'warning')
  const ok = limits.filter(l => l.status === 'ok')

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-orange-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-900/30 to-red-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Limiti Budget</h2>
                  <p className="text-sm text-slate-400">{limits.length} limiti configurati</p>
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-xl p-4 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300 font-semibold">Superati</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{exceeded.length}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-600/20 rounded-xl p-4 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-300 font-semibold">Attenzione</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{warning.length}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-semibold">OK</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{ok.length}</p>
                </div>
              </div>

              {/* Limits List */}
              {limits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-slate-400 text-lg">Nessun limite impostato</p>
                  <p className="text-slate-500 text-sm mt-2">Imposta limiti per controllare le tue spese!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {limits.map((limit, index) => {
                    const statusInfo = getStatusText(limit.status)
                    const percentage = Math.min(limit.percentage_used, 100)
                    
                    return (
                      <motion.div
                        key={limit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group bg-gradient-to-br ${getStatusColor(limit.status)} border-2 rounded-xl p-5 transition-all hover:shadow-lg ${
                          !limit.is_active ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Status Icon */}
                            <div className="mt-1">
                              {getStatusIcon(limit.status)}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-bold text-lg">{limit.category}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
                                {!limit.is_active && (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-400">
                                    ⏸️ Disattivato
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-400 text-sm mb-3">
                                Limite: €{limit.limit_amount.toFixed(2)} {periodLabels[limit.period]}
                              </p>

                              {/* Progress Bar */}
                              <div className="relative">
                                <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                    className={`h-3 rounded-full ${getProgressColor(percentage)}`}
                                  />
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-300">
                                    Speso: <span className="font-bold text-white">€{limit.current_spending.toFixed(2)}</span>
                                  </span>
                                  <span className={`font-bold ${
                                    limit.status === 'exceeded' ? 'text-red-400' :
                                    limit.status === 'warning' ? 'text-orange-400' :
                                    'text-green-400'
                                  }`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>

                                {limit.status !== 'exceeded' && (
                                  <div className="text-slate-400 text-xs mt-1">
                                    Disponibile: <span className="text-white font-semibold">€{limit.remaining_amount.toFixed(2)}</span>
                                  </div>
                                )}

                                {limit.status === 'exceeded' && (
                                  <div className="text-red-400 text-xs mt-1 font-semibold">
                                    Superato di €{Math.abs(limit.remaining_amount).toFixed(2)}!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {/* Toggle Active */}
                            <button
                              onClick={() => onToggleActive(limit.id)}
                              className="w-10 h-10 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 flex items-center justify-center transition-all"
                              aria-label={limit.is_active ? 'Disattiva' : 'Attiva'}
                              title={limit.is_active ? 'Disattiva limite' : 'Attiva limite'}
                            >
                              {limit.is_active ? (
                                <ToggleRight className="w-5 h-5 text-orange-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-500" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDelete(limit.id)}
                              className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                              aria-label="Elimina"
                              title="Elimina limite"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Info box */}
              {limits.length > 0 && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <p className="text-blue-300 font-medium mb-1">Suggerimento</p>
                      <p className="text-slate-400 text-sm">
                        I limiti ti aiutano a controllare le spese. Riceverai notifiche quando ti avvicini o superi il budget impostato.
                        Puoi disattivare temporaneamente un limite senza eliminarlo.
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
