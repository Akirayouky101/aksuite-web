'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, BarChart3 } from 'lucide-react'

interface BudgetMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectView: () => void
}

export default function BudgetMenuModal({ isOpen, onClose, onSelectNew, onSelectView }: BudgetMenuModalProps) {
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
          className="bg-gradient-to-br from-slate-900 via-green-900/50 to-slate-900 rounded-2xl max-w-2xl w-full border border-green-500/20 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
