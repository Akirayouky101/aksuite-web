'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, List } from 'lucide-react'

interface CallMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectList: () => void
}

export default function CallMenuModal({ isOpen, onClose, onSelectNew, onSelectList }: CallMenuModalProps) {
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
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              
              {/* Main modal */}
              <div className="relative bg-gradient-to-br from-slate-900 via-blue-900/50 to-cyan-900/50 border-4 border-blue-400 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="relative z-10 p-4 sm:p-6 border-b-2 border-blue-400/50 bg-black/30 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-blue-300 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                      📞 GESTIONE CHIAMATE 📞
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
                  {/* New Call */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectNew()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                            📝 NUOVA CHIAMATA
                          </h3>
                          <p className="text-xs sm:text-base text-blue-100 font-bold">
                            Registra una nuova chiamata cliente
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

                  {/* Calls List */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectList()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-blue-400 bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                          <List className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">
                            📋 REGISTRO CHIAMATE
                          </h3>
                          <p className="text-xs sm:text-base text-purple-100 font-bold">
                            Visualizza tutte le chiamate registrate
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
                </div>

                {/* Danger tape */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-black to-blue-400 opacity-70" />
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-black to-blue-400 opacity-70" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
