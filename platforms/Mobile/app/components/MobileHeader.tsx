'use client'

import { motion } from 'framer-motion'
import { LogOut, User, Menu } from 'lucide-react'

interface MobileHeaderProps {
  userName?: string
  userEmail?: string
  onLogout: () => void
}

export default function MobileHeader({ userName, userEmail, onLogout }: MobileHeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl 
                 border-b-2 border-purple-500/30 z-40 px-4
                 safe-area-inset-top"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <div className="h-full flex items-center justify-between">
        {/* Logo & User */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600
                      flex items-center justify-center flex-shrink-0 border-2 border-white/30"
            whileTap={{ scale: 0.9 }}
          >
            <User size={20} className="text-white" />
          </motion.div>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-black text-sm truncate">
              {userName || userEmail || 'AK Suite'}
            </h1>
            <p className="text-purple-400 text-xs truncate">Mobile</p>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full
                    bg-gradient-to-r from-red-600 to-orange-600
                    border border-white/20 min-w-[44px] min-h-[44px]
                    flex-shrink-0"
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={18} className="text-white" />
          <span className="text-white text-sm font-bold hidden sm:inline">Esci</span>
        </motion.button>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
    </motion.header>
  )
}
