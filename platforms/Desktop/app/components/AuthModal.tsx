'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) throw error
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <div className="bg-ak-panel/90 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 border border-ak-line/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ak-line/80">
            <h2 className="text-lg font-bold text-ak-text">
              {isLogin ? 'Accedi' : 'Registrati'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-ak-inset hover:bg-ak-danger-bg hover:text-ak-danger flex items-center justify-center transition-all text-ak-subtle" aria-label="Chiudi">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-ak-danger-bg border border-ak-danger/60 rounded-xl text-ak-danger text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-ak-muted text-xs font-medium uppercase tracking-wider mb-2 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ak-subtle" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                      placeholder="Il tuo nome" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-ak-muted text-xs font-medium uppercase tracking-wider mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ak-subtle" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                    placeholder="tua@email.com" />
                </div>
              </div>
              <div>
                <label className="text-ak-muted text-xs font-medium uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ak-subtle" />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ak-subtle hover:text-ak-text transition-colors"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-ak-accent to-ak-accent hover:from-ak-accent hover:to-ak-accent-hover text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 text-sm">
                {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Registrati'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-ak-cyan hover:text-ak-cyan font-medium text-sm transition-colors">
                {isLogin ? "Non hai un account? Registrati" : 'Hai già un account? Accedi'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
