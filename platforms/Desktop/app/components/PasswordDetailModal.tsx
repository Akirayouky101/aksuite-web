'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Copy, Trash2, Pencil, ExternalLink, Star, KeyRound, Hash, StickyNote } from 'lucide-react'
import { Password } from '../hooks/usePasswords'

interface PasswordDetailModalProps {
  password: Password | null
  onClose: () => void
  onEdit?: (password: Password) => void
  onDelete?: (id: string) => void
}

export default function PasswordDetailModal({ password, onClose, onEdit, onDelete }: PasswordDetailModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBtn = ({ text, id, title = 'Copia' }: { text: string; id: string; title?: string }) => (
    <button onClick={() => copy(text, id)} className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg shrink-0 transition-all" title={title}>
      {copied === id ? <span className="text-green-500 text-xs font-medium">✓</span> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  )

  return (
    <AnimatePresence>
      {password && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[90] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl my-8">
            <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 p-6">
              <button onClick={onClose} title="Chiudi" className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="mb-5 pr-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-[#ddd7ff] flex items-center justify-center flex-shrink-0 text-lg">{password.emoji || <KeyRound className="w-4 h-4 text-[#4b3ba5]" />}</div>
                  <h2 className="text-lg font-semibold text-slate-800">{password.title}</h2>
                  {password.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{password.category}</span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Username</div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-slate-800 font-mono flex-1 break-all">{password.username}</code>
                    <CopyBtn text={password.username} id="user" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-slate-800 font-mono flex-1 break-all">{showPassword ? password.password : '••••••••••••••••'}</code>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setShowPassword((v) => !v)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all" title={showPassword ? 'Nascondi' : 'Mostra'}>
                        {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                      <CopyBtn text={password.password} id="pass" />
                    </div>
                  </div>
                </div>

                {password.website && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Sito web</div>
                    <a href={password.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:text-indigo-700 font-mono flex items-center gap-1.5 hover:underline break-all">
                      {password.website}<ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}

                {password.pin_code && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> PIN / Codice</div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm text-slate-800 font-mono flex-1 break-all tracking-widest">{showPin ? password.pin_code : '●'.repeat(password.pin_code.length)}</code>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setShowPin((v) => !v)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all" title={showPin ? 'Nascondi PIN' : 'Mostra PIN'}>
                          {showPin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                        <CopyBtn text={password.pin_code} id="pin" title="Copia PIN" />
                      </div>
                    </div>
                  </div>
                )}

                {password.notes && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Note</div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{password.notes}</p>
                  </div>
                )}

                <div className="text-center text-xs text-slate-400 pt-1">
                  Creata il {new Date(password.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>

                <div className="flex gap-2 pt-1">
                  {onEdit && (
                    <button onClick={() => { onEdit(password); onClose() }} className="flex-1 py-2.5 bg-[#2d2754] hover:bg-[#40376f] rounded-xl text-[#fff6df] font-medium text-sm flex items-center justify-center gap-2 transition-all">
                      <Pencil className="w-4 h-4" />Modifica
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => { if (confirm('Eliminare questa credenziale?')) { onDelete(password.id); onClose() } }} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-500 font-medium text-sm flex items-center justify-center gap-2 transition-all">
                      <Trash2 className="w-4 h-4" />Elimina
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
