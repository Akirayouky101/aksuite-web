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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              
              {/* Main modal */}
              <div className="relative bg-gradient-to-br from-slate-900 via-green-900/50 to-emerald-900/50 border-4 border-green-400 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="relative z-10 p-4 sm:p-6 border-b-2 border-green-400/50 bg-black/30 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-green-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                      💰 BILANCIO FAMILIARE 💰
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
                    </motion.button>
                  </div>
                </div>

                {/* Options - Scrollable */}
                <div className="relative z-10 p-4 sm:p-8 space-y-3 sm:space-y-4 overflow-y-auto overscroll-contain">
                  {/* New Transaction */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectNew()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                            ✨ NUOVO MOVIMENTO
                          </h3>
                          <p className="text-xs sm:text-base text-green-100 font-bold">
                            Aggiungi una nuova entrata o uscita
                          </p>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-2xl sm:text-4xl flex-shrink-0"
                        >
                          ➡️
                        </motion.div>
                      </div>
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: [-200, 400] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </div>
                  </motion.button>

                  {/* View Budget */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectView()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                            📊 BILANCIO COMPLETO
                          </h3>
                          <p className="text-xs sm:text-base text-blue-100 font-bold">
                            Visualizza tutte le transazioni e i totali
                          </p>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-2xl sm:text-4xl flex-shrink-0"
                        >
                          ➡️
                        </motion.div>
                      </div>
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: [-200, 400] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
                      />
                    </div>
                  </motion.button>

                  {/* Recurring Transaction */}
                  {onSelectRecurring && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectRecurring()
                        onClose()
                      }}
                      className="w-full group"
                    >
                      <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <Repeat className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                              🔄 RICORRENTE
                            </h3>
                            <p className="text-xs sm:text-base text-purple-100 font-bold">
                              Automatizza stipendi, affitti e bollette
                            </p>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-2xl sm:text-4xl flex-shrink-0"
                          >
                            ➡️
                          </motion.div>
                        </div>
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: [-200, 400] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 1 }}
                        />
                      </div>
                    </motion.button>
                  )}

                  {/* Recurring List */}
                  {onSelectRecurringList && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectRecurringList()
                        onClose()
                      }}
                      className="w-full group"
                    >
                      <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-cyan-600 to-teal-600 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <span className="text-2xl sm:text-3xl">📋</span>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                              📋 GESTISCI RICORRENTI
                            </h3>
                            <p className="text-xs sm:text-base text-cyan-100 font-bold">
                              Vedi e modifica le automazioni attive
                            </p>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-2xl sm:text-4xl flex-shrink-0"
                          >
                            ➡️
                          </motion.div>
                        </div>
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: [-200, 400] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 1.5 }}
                        />
                      </div>
                    </motion.button>
                  )}

                  {/* Budget Limit */}
                  {onSelectLimit && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectLimit()
                        onClose()
                      }}
                      className="w-full group"
                    >
                      <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-orange-600 to-red-600 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                              ⚠️ LIMITE BUDGET
                            </h3>
                            <p className="text-xs sm:text-base text-orange-100 font-bold">
                              Imposta tetto massimo di spesa
                            </p>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-2xl sm:text-4xl flex-shrink-0"
                          >
                            ➡️
                          </motion.div>
                        </div>
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: [-200, 400] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 2 }}
                        />
                      </div>
                    </motion.button>
                  )}

                  {/* Limits List */}
                  {onSelectLimitsList && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectLimitsList()
                        onClose()
                      }}
                      className="w-full group"
                    >
                      <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-r from-red-600 to-pink-600 p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <span className="text-2xl sm:text-3xl">🎯</span>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                              🎯 GESTISCI LIMITI
                            </h3>
                            <p className="text-xs sm:text-base text-red-100 font-bold">
                              Vedi tutti i limiti e avvisi
                            </p>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-2xl sm:text-4xl flex-shrink-0"
                          >
                            ➡️
                          </motion.div>
                        </div>
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: [-200, 400] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 2.5 }}
                        />
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Danger tape */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-black to-green-400 opacity-70" />
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-black to-green-400 opacity-70" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
