'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'success' | 'warning'
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  type = 'warning'
}: ConfirmModalProps) {
  const colors = {
    danger: {
      bg: 'from-red-600 to-rose-600',
      border: 'border-red-500',
      button: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
      icon: 'text-red-400',
      glow: 'from-red-500 via-rose-500 to-pink-500'
    },
    warning: {
      bg: 'from-orange-600 to-yellow-600',
      border: 'border-orange-500',
      button: 'from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
      icon: 'text-orange-400',
      glow: 'from-orange-500 via-yellow-500 to-amber-500'
    },
    success: {
      bg: 'from-green-600 to-emerald-600',
      border: 'border-green-500',
      button: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      icon: 'text-green-400',
      glow: 'from-green-500 via-emerald-500 to-teal-500'
    }
  }

  const color = colors[type]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-md w-full overflow-x-hidden"
        >
          <div className="hidden" />
          
          {/* Main modal */}
          <div className={`relative bg-[#131920] rounded-2xl border-4 ${color.border} shadow-2xl overflow-hidden`}>
            {/* Header with icon */}
            <div className={`bg-gradient-to-r ${color.bg} p-6 border-b-2 ${color.border}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {type === 'danger' && <AlertTriangle className="w-10 h-10 text-white" strokeWidth={3} />}
                  {type === 'warning' && <AlertTriangle className="w-10 h-10 text-white" strokeWidth={3} />}
                  {type === 'success' && <CheckCircle className="w-10 h-10 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-lg text-white/70 mb-6 leading-relaxed">
                {message}
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3 px-6 bg-white/[0.06] hover:bg-white/[0.08] text-white font-bold rounded-xl transition-colors"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className={`flex-1 py-3 px-6 bg-gradient-to-r ${color.button} text-white font-bold rounded-xl shadow-lg transition-all`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>

            {/* Decorative elements */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${color.glow} opacity-70`} />
            <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${color.glow} opacity-70`} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
