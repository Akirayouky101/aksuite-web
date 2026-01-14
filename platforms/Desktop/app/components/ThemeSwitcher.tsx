'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Sparkles, Palette } from 'lucide-react'

interface ThemeSwitcherProps {
  currentTheme: 'geometric' | 'anime'
  onThemeChange: (theme: 'geometric' | 'anime') => void
}

export default function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-24 right-6 z-40">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20"
      >
        <Palette className="w-7 h-7 text-white" strokeWidth={2.5} />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className="absolute right-0 mt-4 w-64 bg-slate-900/95 backdrop-blur-xl border-2 border-violet-400/50 rounded-2xl p-4 shadow-2xl"
        >
          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Choose Theme
          </h3>

          <div className="space-y-3">
            {/* Geometric theme */}
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onThemeChange('geometric')
                setIsOpen(false)
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                currentTheme === 'geometric'
                  ? 'border-violet-400 bg-violet-500/20'
                  : 'border-white/20 hover:border-violet-400/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-white font-bold">Geometric</div>
                  <div className="text-xs text-violet-300">Minimal & Clean</div>
                </div>
                {currentTheme === 'geometric' && (
                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse" />
                )}
              </div>
            </motion.button>

            {/* One Piece Anime theme */}
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onThemeChange('anime')
                setIsOpen(false)
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                currentTheme === 'anime'
                  ? 'border-red-400 bg-red-500/20'
                  : 'border-white/20 hover:border-red-400/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">�‍☠️</span>
                </div>
                <div className="text-left flex-1">
                  <div className="text-white font-bold">One Piece</div>
                  <div className="text-xs text-yellow-300">Straw Hat Pirates</div>
                </div>
                {currentTheme === 'anime' && (
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                )}
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
