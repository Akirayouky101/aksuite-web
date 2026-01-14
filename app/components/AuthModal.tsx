'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, X, Zap, Sparkles } from 'lucide-react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
        
        <div className="relative bg-gradient-to-br from-slate-900 via-violet-900/50 to-slate-900 border-4 border-violet-400 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center"
              >
                <Zap className="w-6 h-6 text-white" strokeWidth={3} />
              </motion.div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                {isLogin ? '⚡ ACCEDI ⚡' : '✨ REGISTRATI ✨'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" strokeWidth={3} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-violet-300 font-bold mb-2 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border-2 border-violet-400/50 rounded-xl text-white font-bold placeholder-violet-300/50 focus:border-violet-400 focus:outline-none transition-all"
                  placeholder="Il tuo nome"
                />
              </div>
            )}

            <div>
              <label className="block text-violet-300 font-bold mb-2 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-violet-400/50 rounded-xl text-white font-bold placeholder-violet-300/50 focus:border-violet-400 focus:outline-none transition-all"
                placeholder="tua@email.com"
              />
            </div>

            <div>
              <label className="block text-violet-300 font-bold mb-2 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-violet-400/50 rounded-xl text-white font-bold placeholder-violet-300/50 focus:border-violet-400 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl border-2 border-violet-400 flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-black text-lg uppercase">
                  {loading ? 'CARICAMENTO...' : isLogin ? 'ACCEDI' : 'REGISTRATI'}
                </span>
              </div>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-violet-300 hover:text-violet-200 font-bold text-sm"
            >
              {isLogin ? "Non hai un account? Registrati" : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
