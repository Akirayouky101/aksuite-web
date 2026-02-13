'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, User, Globe, Tag, Sparkles, Zap, Eye, EyeOff, Dices, Star, MessageSquare } from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'

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
    notes?: string
    isFavorite?: boolean
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
    notes: '',
    isFavorite: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

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
      notes: '',
      isFavorite: false,
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
            className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-4"
          >
            {/* MODAL CONTAINER! */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl"
            >
              {/* DANGER GLOW! */}
              <div className="hidden" />
              
              {/* MAIN MODAL! */}
              <div className="relative bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden">
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
                <div className="relative z-10 p-6 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center"
                      >
                        <Lock className="w-6 h-6 text-slate-800" strokeWidth={3} />
                      </motion.div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">
                          Aggiungi Nuova Password
                        </h2>
                        <p className="text-yellow-100 font-bold">MODALITÀ SICUREZZA MASSIMA!</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200/60 flex items-center justify-center"
                    >
                      <X className="w-6 h-6 text-slate-800" strokeWidth={3} />
                    </motion.button>
                  </div>
                </div>

                {/* FORM! */}
                <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-4">
                  {/* EMOJI SELECTOR! */}
                  <div>
                    <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider">
                      Scegli Icona
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
                              : 'border-slate-200 hover:border-yellow-400/50'
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* TITLE! */}
                  <div>
                    <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Titolo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="es. es. Il mio account"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* USERNAME! */}
                    <div>
                      <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Nome Utente
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        placeholder="tuo_username"
                      />
                    </div>

                    {/* CATEGORY! */}
                    <div>
                      <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PASSWORD! */}
                  <div>
                    <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2 justify-between">
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Password
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className="text-xs bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Dices className="w-3 h-3" />
                        {showGenerator ? 'Nascondi' : 'Generatore'}
                      </button>
                    </label>

                    {showGenerator && (
                      <div className="mb-4">
                        <PasswordGenerator onGenerate={(pwd) => setFormData(prev => ({ ...prev, password: pwd }))} />
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        placeholder="••••••••••••"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg"
                          aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* WEBSITE! */}
                  <div>
                    <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Sito Web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="https://esempio.com"
                    />
                  </div>

                  {/* NOTES! */}
                  <div>
                    <label className="block text-amber-600 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Note (opzionale)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
                      placeholder="Aggiungi note, domande di sicurezza, ecc..."
                    />
                  </div>

                  {/* FAVORITE! */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer bg-gradient-to-r from-violet-50 to-pink-50 border-2 border-violet-200/60 rounded-xl p-4 hover:border-purple-400 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.isFavorite}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
                        className="w-5 h-5 rounded accent-yellow-500"
                      />
                      <Star className={`w-5 h-5 ${formData.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                      <span className="text-amber-600 font-bold">Aggiungi ai Preferiti</span>
                    </label>
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
                    <div className="relative px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl border border-indigo-200 flex items-center justify-center gap-3">
                      {isSaving ? (
                        <>
                          <motion.div
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Zap className="w-6 h-6 text-slate-800" />
                          </motion.div>
                          <span className="text-slate-800 font-bold text-xl uppercase tracking-wider">
                            SALVATAGGIO... 💥
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-6 h-6 text-slate-800" strokeWidth={3} />
                          <span className="text-slate-800 font-bold text-xl uppercase tracking-wider">
                            Salva Password
                          </span>
                        </>
                      )}
                    </div>
                  </motion.button>
                </form>

                {/* Top/bottom accent lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-100" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
