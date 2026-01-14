'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Copy, Trash2, Edit, ExternalLink } from 'lucide-react'
import { Password } from '../hooks/usePasswords'

interface PasswordListModalProps {
  isOpen: boolean
  onClose: () => void
  passwords: Password[]
  onDelete?: (id: string) => void
}

export default function PasswordListModal({ 
  isOpen, 
  onClose, 
  passwords,
  onDelete 
}: PasswordListModalProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
              
              {/* Main modal */}
              <div className="relative bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 border-4 border-cyan-400 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="relative z-10 p-6 border-b-2 border-cyan-400/50 bg-black/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                        📋 ELENCO PASSWORD
                      </h2>
                      <p className="text-cyan-100 font-bold mt-1">
                        {passwords.length} password salvate
                      </p>
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

                {/* Password List */}
                <div className="relative z-10 p-6 overflow-y-auto flex-1">
                  {passwords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-8xl mb-4">🔒</div>
                      <h3 className="text-2xl font-black text-cyan-300 mb-2">
                        Nessuna password salvata
                      </h3>
                      <p className="text-cyan-100">
                        Inizia aggiungendo la tua prima password!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {passwords.map((pwd, index) => (
                        <motion.div
                          key={pwd.id}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group"
                        >
                          <div className="bg-gradient-to-r from-slate-800/90 to-blue-900/50 border-2 border-cyan-400/50 rounded-xl p-4 hover:border-cyan-400 transition-all">
                            <div className="flex items-start gap-4">
                              {/* Emoji */}
                              <div className="text-5xl">{pwd.emoji}</div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Title and Category */}
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-black text-cyan-300">
                                    {pwd.title}
                                  </h3>
                                  <span className="px-3 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full text-xs font-bold text-purple-200">
                                    {pwd.category}
                                  </span>
                                </div>

                                {/* Username */}
                                <div className="mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-cyan-400 font-bold">Username:</span>
                                    <span className="text-white font-mono">{pwd.username}</span>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => copyToClipboard(pwd.username, `${pwd.id}-user`)}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                    >
                                      {copiedId === `${pwd.id}-user` ? (
                                        <span className="text-green-400 text-xs font-bold">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-cyan-400" />
                                      )}
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Password */}
                                <div className="mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-cyan-400 font-bold">Password:</span>
                                    <code className="text-white font-mono">
                                      {visiblePasswords.has(pwd.id) ? pwd.password : '••••••••••••'}
                                    </code>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => togglePasswordVisibility(pwd.id)}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                    >
                                      {visiblePasswords.has(pwd.id) ? (
                                        <EyeOff className="w-4 h-4 text-cyan-400" />
                                      ) : (
                                        <Eye className="w-4 h-4 text-cyan-400" />
                                      )}
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => copyToClipboard(pwd.password, `${pwd.id}-pass`)}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                    >
                                      {copiedId === `${pwd.id}-pass` ? (
                                        <span className="text-green-400 text-xs font-bold">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-cyan-400" />
                                      )}
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Website */}
                                {pwd.website && (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-cyan-400 font-bold">Sito:</span>
                                      <a 
                                        href={pwd.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:text-blue-200 font-mono text-sm flex items-center gap-1 hover:underline"
                                      >
                                        {pwd.website}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                {onDelete && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      if (confirm('Sei sicuro di voler eliminare questa password?')) {
                                        onDelete(pwd.id)
                                      }
                                    }}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger tape */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-black to-cyan-400 opacity-70" />
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-black to-cyan-400 opacity-70" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
