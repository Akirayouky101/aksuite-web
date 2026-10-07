'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Copy, Trash2, Pencil, ExternalLink, Star, KeyRound, Hash, StickyNote } from 'lucide-react'
import { Password } from '../hooks/usePasswords'
import { usePasswordVault } from '@/lib/passwordVault/store'

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
  const vault = usePasswordVault()
  const readable = password?.secretStatus === 'legacy' || (vault.status === 'unlocked' && password?.secretStatus === 'decrypted')
  const lockedText = password?.secretStatus === 'error' ? 'Errore di decifratura' : 'Bloccata — sblocca la cassaforte'

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBtn = ({ text, id, title = 'Copia' }: { text: string; id: string; title?: string }) => (
    <button onClick={() => copy(text, id)} className="p-2 bg-ak-panel hover:bg-ak-hover border border-ak-line hover:border-ak-line rounded-lg shrink-0 transition-all" title={title}>
      {copied === id ? <span className="text-ak-success text-xs font-medium">✓</span> : <Copy className="w-4 h-4 text-ak-subtle" />}
    </button>
  )

  return (
    <AnimatePresence>
      {password && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-md z-[90] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl my-8">
            <div className="relative bg-ak-panel/95 backdrop-blur-2xl border border-ak-line/60 rounded-2xl shadow-2xl shadow-black/50 p-6">
              <button onClick={onClose} title="Chiudi" className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-ak-inset hover:bg-ak-danger-bg border border-ak-line hover:border-ak-danger/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-ak-muted" />
              </button>

              <div className="mb-5 pr-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-ak-purple-bg flex items-center justify-center flex-shrink-0 text-lg">{password.emoji || <KeyRound className="w-4 h-4 text-ak-purple" />}</div>
                  <h2 className="text-lg font-semibold text-ak-text">{password.title}</h2>
                  {password.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-ak-inset text-ak-text">{password.category}</span>
              </div>

              <div className="space-y-3">
                <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                  <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Username</div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-ak-text font-mono flex-1 break-all">{password.username}</code>
                    <CopyBtn text={password.username} id="user" />
                  </div>
                </div>

                <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                  <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Password</div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-ak-text font-mono flex-1 break-all">{!readable ? lockedText : showPassword ? password.password : '••••••••••••••••'}</code>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setShowPassword((v) => !v)} className="p-2 bg-ak-panel hover:bg-ak-inset border border-ak-line rounded-lg transition-all" title={showPassword ? 'Nascondi' : 'Mostra'}>
                        {showPassword ? <EyeOff className="w-4 h-4 text-ak-subtle" /> : <Eye className="w-4 h-4 text-ak-subtle" />}
                      </button>
                      {readable && <CopyBtn text={password.password} id="pass" />}
                    </div>
                  </div>
                </div>

                {password.website && (
                  <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                    <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Sito web</div>
                    <a href={password.website} target="_blank" rel="noopener noreferrer" className="text-sm text-ak-cyan hover:text-ak-cyan font-mono flex items-center gap-1.5 hover:underline break-all">
                      {password.website}<ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}

                {(password.pin_code || (!readable && password.hasPin)) && (
                  <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                    <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> PIN / Codice</div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm text-ak-text font-mono flex-1 break-all tracking-widest">{!readable ? lockedText : showPin ? password.pin_code : '●'.repeat((password.pin_code || '').length)}</code>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setShowPin((v) => !v)} className="p-2 bg-ak-panel hover:bg-ak-inset border border-ak-line rounded-lg transition-all" title={showPin ? 'Nascondi PIN' : 'Mostra PIN'}>
                          {showPin ? <EyeOff className="w-4 h-4 text-ak-subtle" /> : <Eye className="w-4 h-4 text-ak-subtle" />}
                        </button>
                        {readable && <CopyBtn text={password.pin_code || ''} id="pin" title="Copia PIN" />}
                      </div>
                    </div>
                  </div>
                )}

                {password.notes && (
                  <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                    <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Note</div>
                    <p className="text-sm text-ak-text whitespace-pre-wrap">{password.notes}</p>
                  </div>
                )}

                <div className="text-center text-xs text-ak-subtle pt-1">
                  Creata il {new Date(password.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>

                <div className="flex gap-2 pt-1">
                  {onEdit && (
                    <button onClick={() => { onEdit(password); onClose() }} className="flex-1 py-2.5 bg-ak-accent hover:bg-ak-accent-hover rounded-xl text-ak-text font-medium text-sm flex items-center justify-center gap-2 transition-all">
                      <Pencil className="w-4 h-4" />Modifica
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => { if (confirm('Eliminare questa credenziale?')) { onDelete(password.id); onClose() } }} className="flex-1 py-2.5 bg-ak-danger-bg hover:bg-ak-danger-bg border border-ak-danger rounded-xl text-ak-danger font-medium text-sm flex items-center justify-center gap-2 transition-all">
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
