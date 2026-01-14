'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, List } from 'lucide-react'

interface PasswordMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectList: () => void
}

export default function PasswordMenuModal({ 
  isOpen, 
  onClose, 
  onSelectNew, 
  onSelectList 
}: PasswordMenuModalProps) {
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
              className="relative w-full max-w-2xl"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              
              {/* Main modal */}
              <div className="relative bg-gradient-to-br from-slate-900 via-red-900/50 to-orange-900/50 border-4 border-yellow-400 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative z-10 p-6 border-b-2 border-yellow-400/50 bg-black/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                      ⚡ GESTIONE PASSWORD ⚡
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center"
                    >
                      <X className="w-6 h-6 text-white" strokeWidth={3} />
                    </motion.button>
                  </div>
                </div>

                {/* Options */}
                <div className="relative z-10 p-8 space-y-4">
                  {/* New Password Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectNew()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Plus className="w-8 h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-2xl font-black text-white mb-1">
                            ✨ NUOVA PASSWORD
                          </h3>
                          <p className="text-green-100 font-bold">
                            Aggiungi una nuova password al vault
                          </p>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-4xl"
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

                  {/* List Passwords Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectList()
                      onClose()
                    }}
                    className="w-full group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <List className="w-8 h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-2xl font-black text-white mb-1">
                            📋 ELENCO PASSWORD
                          </h3>
                          <p className="text-blue-100 font-bold">
                            Visualizza tutte le password salvate
                          </p>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-4xl"
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
                </div>

                {/* Danger tape */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-70" />
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-70" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
