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
              <div className="relative bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        Aggiungi Nuova Password
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Gestione credenziali sicura</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>

                {/* FORM */}
                <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* EMOJI SELECTOR! */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider">
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
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Titolo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="es. es. Il mio account"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* USERNAME! */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Nome Utente
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        placeholder="tuo_username"
                      />
                    </div>

                    {/* CATEGORY! */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
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
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2 justify-between">
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
                        className="w-full px-4 py-3 pr-12 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
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
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Sito Web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="https://esempio.com"
                    />
                  </div>

                  {/* NOTES! */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Note (opzionale)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
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
                      <span className="text-sm text-slate-700 font-medium">Aggiungi ai Preferiti</span>
                    </label>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? '⏳ Salvataggio...' : '💾 Salva Password'}
                  </motion.button>
                </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
