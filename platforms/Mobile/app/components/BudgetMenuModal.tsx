'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, BarChart3, Repeat, AlertTriangle } from 'lucide-react'

interface BudgetMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectView: () => void
  onSelectRecurring?: () => void
  onSelectRecurringList?: () => void
  onSelectLimit?: () => void
  onSelectLimitsList?: () => void
}

export default function BudgetMenuModal({ 
  isOpen, 
  onClose, 
  onSelectNew, 
  onSelectView,
  onSelectRecurring,
  onSelectRecurringList,
  onSelectLimit,
  onSelectLimitsList
}: BudgetMenuModalProps) {
  if (!isOpen) return null

  const handleOptionClick = (action: () => void) => {
    onClose()
    action()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl border-2 border-green-500/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bilancio Familiare</h2>
                <p className="text-sm text-slate-400">Cosa vuoi fare?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Options */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Transaction */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionClick(onSelectNew)}
              className="relative bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-8 overflow-hidden group"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Plus className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">✨ NUOVO MOVIMENTO</h3>
                <p className="text-sm text-green-100">Aggiungi una nuova entrata o uscita</p>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
            </motion.button>

            {/* View Budget */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionClick(onSelectView)}
              className="relative bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-8 overflow-hidden group"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0"
                animate={{
                  x: ['100%', '-100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 0.5,
                }}
              />

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <BarChart3 className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">📊 BILANCIO COMPLETO</h3>
                <p className="text-sm text-blue-100">Visualizza tutte le transazioni e i totali</p>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
            </motion.button>

            {/* Option 3: Transazioni Ricorrenti */}
            {onSelectRecurring && (
              <motion.button
                onClick={() => handleOptionClick(onSelectRecurring)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-8 border-2 border-purple-400/30 hover:border-purple-400/60 transition-all shadow-2xl hover:shadow-purple-500/50"
              >
                {/* Animated shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Repeat className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">🔄 RICORRENTE</h3>
                  <p className="text-sm text-purple-100">Automatizza stipendi, affitti e bollette</p>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
              </motion.button>
            )}

            {/* Option 4: Lista Ricorrenti */}
            {onSelectRecurringList && (
              <motion.button
                onClick={() => handleOptionClick(onSelectRecurringList)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 rounded-2xl p-8 border-2 border-cyan-400/30 hover:border-cyan-400/60 transition-all shadow-2xl hover:shadow-cyan-500/50"
              >
                {/* Animated shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.5,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <span className="text-3xl">📋</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">📋 GESTISCI RICORRENTI</h3>
                  <p className="text-sm text-cyan-100">Vedi e modifica le automazioni attive</p>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
              </motion.button>
            )}

            {/* Option 5: Imposta Limite */}
            {onSelectLimit && (
              <motion.button
                onClick={() => handleOptionClick(onSelectLimit)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 rounded-2xl p-8 border-2 border-orange-400/30 hover:border-orange-400/60 transition-all shadow-2xl hover:shadow-orange-500/50"
              >
                {/* Animated shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 2,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">⚠️ LIMITE BUDGET</h3>
                  <p className="text-sm text-orange-100">Imposta tetto massimo di spesa</p>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
              </motion.button>
            )}

            {/* Option 6: Gestisci Limiti */}
            {onSelectLimitsList && (
              <motion.button
                onClick={() => handleOptionClick(onSelectLimitsList)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-br from-red-600 via-pink-600 to-red-700 rounded-2xl p-8 border-2 border-red-400/30 hover:border-red-400/60 transition-all shadow-2xl hover:shadow-red-500/50"
              >
                {/* Animated shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 2.5,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <span className="text-3xl">🎯</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">🎯 GESTISCI LIMITI</h3>
                  <p className="text-sm text-red-100">Vedi tutti i limiti e avvisi</p>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity" />
              </motion.button>
            )}
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
