'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface MobileCardProps {
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  emoji: string
  count?: number
  onClick: () => void
}

export default function MobileCard({
  title,
  description,
  icon: Icon,
  gradient,
  emoji,
  count,
  onClick
}: MobileCardProps) {
  return (
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.button
        onClick={onClick}
        className={`
          relative w-full min-h-[160px] rounded-3xl overflow-hidden
          bg-gradient-to-br ${gradient}
          border-2 border-white/20
          shadow-2xl shadow-purple-900/50
          active:shadow-lg active:shadow-purple-600/70
          transition-shadow duration-200
          p-6
          text-left
        `}
      >
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Top row: Icon and Count */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="text-5xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {emoji}
              </motion.div>
              <Icon className="text-white drop-shadow-lg" size={32} strokeWidth={2.5} />
            </div>
            
            {count !== undefined && (
              <motion.div
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full
                          border border-white/30 min-w-[60px] text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <span className="text-white font-black text-lg">{count}</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-white drop-shadow-lg mb-2 tracking-wide">
            {title}
          </h2>

          {/* Description */}
          <p className="text-white/90 text-sm font-medium leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />

        {/* Glow effect on tap */}
        <div className="absolute inset-0 bg-white/0 active:bg-white/10 transition-colors duration-150" />
      </motion.button>
    </motion.div>
  )
}
