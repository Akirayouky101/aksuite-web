'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, User, Globe, Tag, Sparkles, Zap, Eye, EyeOff, Dices } from 'lucide-react'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    username: string
    password: string
    website: string
    category: string
    emoji: string
  }) => void
}

const emojis = ['🔥', '💀', '⚡', '💎', '🎯', '🚀', '👑', '💣', '⭐', '🌟', '✨', '💥']
const categories = ['Lavoro', 'Personale', 'Social', 'Finanza', 'Gaming', 'Altro']

export default function PasswordModal({ isOpen, onClose, onSave }: PasswordModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    category: 'Personale',
    emoji: '🔥',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate save animation
    await new Promise(resolve => setTimeout(resolve, 800))
    
    onSave(formData)
    setFormData({
      title: '',
      username: '',
      password: '',
      website: '',
      category: 'Personale',
      emoji: '🔥',
    })
    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* EXPLOSIVE BACKDROP! */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* MODAL CONTAINER! */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl"
            >
              {/* DANGER GLOW! */}
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              
              {/* MAIN MODAL! */}
              <div className="relative bg-gradient-to-br from-slate-900 via-red-900/50 to-orange-900/50 border-4 border-yellow-400 rounded-2xl shadow-2xl overflow-hidden">
                {/* SPEED LINES BACKGROUND! */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-1 bg-white"
                      style={{
                        top: `${i * 7}%`,
                        left: '0',
                        width: '100%',
                      }}
                      animate={{
                        scaleX: [0, 1],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.05,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>

                {/* HEADER! */}
                <div className="relative z-10 p-6 border-b-2 border-yellow-400/50 bg-black/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center"
                      >
                        <Lock className="w-6 h-6 text-white" strokeWidth={3} />
                      </motion.div>
                      <div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                          ⚡ AGGIUNGI NUOVA PASSWORD ⚡
                        </h2>
                        <p className="text-yellow-100 font-bold">MODALITÀ SICUREZZA MASSIMA!</p>
                      </div>
                    </div>
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

                {/* FORM! */}
                <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-4">
                  {/* EMOJI SELECTOR! */}
                  <div>
                    <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider">
                      🎯 Scegli la tua Icona!
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {emojis.map((emoji) => (
                        <motion.button
                          key={emoji}
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                          className={`text-4xl p-3 rounded-xl border-2 transition-all ${
                            formData.emoji === emoji
                              ? 'border-yellow-400 bg-yellow-400/20 scale-110'
                              : 'border-white/20 hover:border-yellow-400/50'
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* TITLE! */}
                  <div>
                    <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Titolo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/50 rounded-xl text-white font-bold placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                      placeholder="es. Il mio Account Super Segreto 💀"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* USERNAME! */}
                    <div>
                      <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Nome Utente
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/50 rounded-xl text-white font-bold placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                        placeholder="tuo_username"
                      />
                    </div>

                    {/* CATEGORY! */}
                    <div>
                      <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/50 rounded-xl text-white font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PASSWORD! */}
                  <div>
                    <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-24 bg-black/50 border-2 border-yellow-400/50 rounded-xl text-white font-bold placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                        placeholder="••••••••••••"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1, rotate: 180 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={generatePassword}
                          className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg"
                        >
                          <Dices className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* WEBSITE! */}
                  <div>
                    <label className="block text-yellow-300 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Sito Web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/50 rounded-xl text-white font-bold placeholder-yellow-300/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                      placeholder="https://esempio.com"
                    />
                  </div>

                  {/* SUBMIT BUTTON! */}
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-6 py-4 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-xl border-2 border-yellow-400 flex items-center justify-center gap-3">
                      {isSaving ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Zap className="w-6 h-6 text-white" />
                          </motion.div>
                          <span className="text-white font-black text-xl uppercase tracking-wider">
                            SALVATAGGIO... 💥
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-6 h-6 text-white" strokeWidth={3} />
                          <span className="text-white font-black text-xl uppercase tracking-wider">
                            🔥 SALVA PASSWORD 🔥
                          </span>
                        </>
                      )}
                    </div>
                  </motion.button>
                </form>

                {/* DANGER TAPE! */}
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
