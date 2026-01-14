'use client'

import { motion } from 'framer-motion'
import { Lock, FileText, Calendar, Bookmark, CheckSquare, DollarSign, FolderOpen, Settings } from 'lucide-react'

interface MobileBottomNavProps {
  activeApp: string
  onAppSelect: (appId: string) => void
}

export default function MobileBottomNav({ activeApp, onAppSelect }: MobileBottomNavProps) {
  const navItems = [
    { id: 'passwords', icon: Lock, label: 'Password', color: 'text-red-400' },
    { id: 'notes', icon: FileText, label: 'Note', color: 'text-blue-400' },
    { id: 'calendar', icon: Calendar, label: 'Calendario', color: 'text-purple-400' },
    { id: 'more', icon: Settings, label: 'Altro', color: 'text-cyan-400' },
  ]

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl 
                 border-t-2 border-purple-500/30 flex justify-around items-center px-2
                 pb-safe z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent pointer-events-none" />
      
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeApp === item.id
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onAppSelect(item.id)}
            className={`
              relative flex flex-col items-center justify-center gap-1 
              min-w-[64px] min-h-[64px] rounded-xl
              ${isActive ? 'text-white' : 'text-slate-400'}
              transition-colors duration-200
            `}
            whileTap={{ scale: 0.9 }}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-fuchsia-600/30 
                          rounded-xl border border-purple-400/50"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            
            {/* Icon */}
            <Icon 
              className={`relative z-10 ${isActive ? item.color : 'text-slate-400'}`} 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            
            {/* Label */}
            <span className={`
              relative z-10 text-[10px] font-medium
              ${isActive ? 'text-white' : 'text-slate-500'}
            `}>
              {item.label}
            </span>
            
            {/* Glow when active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 
                          rounded-xl blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        )
      })}
    </motion.nav>
  )
}
