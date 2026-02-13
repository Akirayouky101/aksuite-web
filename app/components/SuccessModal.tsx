'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useEffect } from 'react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  title?: string
  autoDismiss?: boolean
  dismissDelay?: number
}

export default function SuccessModal({
  isOpen,
  onClose,
  message = 'Operazione completata con successo!',
  title = 'Successo!',
  autoDismiss = true,
  dismissDelay = 2500
}: SuccessModalProps) {
  
  useEffect(() => {
    if (isOpen && autoDismiss) {
      const timer = setTimeout(() => {
        onClose()
      }, dismissDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoDismiss, dismissDelay, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-white/[0.04] backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-x-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 25,
              duration: 0.5 
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full overflow-x-hidden"
          >
            <div className="hidden" />
            
            {/* Main modal */}
            <div className="relative bg-[#131920] rounded-2xl border border-white/[0.08] shadow-2xl p-8 overflow-hidden">
              
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
              
              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Checkmark icon with animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 15,
                    delay: 0.2 
                  }}
                  className="mb-6 flex justify-center"
                >
                  <div className="relative">
                    {/* Rotating ring */}
                    <motion.div
                      animate={{ opacity: 1 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-2 border-green-400/30"
                      style={{ width: '100px', height: '100px' }}
                    />
                    {/* Icon */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle className="w-16 h-16 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-bold text-white mb-3 drop-shadow-lg"
                >
                  {title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-white/70 leading-relaxed"
                >
                  {message}
                </motion.p>

                {/* Progress bar (if auto-dismiss) */}
                {autoDismiss && (
                  <motion.div
                    className="mt-6 h-1 bg-white/[0.06] rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: dismissDelay / 1000, ease: 'linear' }}
                    />
                  </motion.div>
                )}

                {/* Manual close button (if not auto-dismiss) */}
                {!autoDismiss && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={onClose}
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:scale-105"
                  >
                    OK
                  </motion.button>
                )}
              </div>

              {/* Decorative top border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
