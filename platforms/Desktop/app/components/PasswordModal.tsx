'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, User, Globe, Tag, Eye, EyeOff, Dices, Star, MessageSquare, Hash } from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'
import { PasswordCategory, PasswordSecretStatus } from '../hooks/usePasswords'
import PasswordVaultPanel from './PasswordVaultPanel'
import { usePasswordVault } from '@/lib/passwordVault/store'

interface PasswordData {
  id?: string
  title: string
  username: string
  password: string
  website: string
  category: string
  emoji: string
  notes?: string
  isFavorite?: boolean
  pin_code?: string
  secretStatus?: PasswordSecretStatus
}

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PasswordData) => void | Promise<void>
  editPassword?: PasswordData | null
  categories?: PasswordCategory[]
}

export default function PasswordModal({ isOpen, onClose, onSave, editPassword, categories = [] }: PasswordModalProps) {
  const [formData, setFormData] = useState<PasswordData>({
    title: '',
    username: '',
    password: '',
    website: '',
    category: '',
    emoji: '🔑',
    notes: '',
    isFavorite: false,
    pin_code: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [saveError, setSaveError] = useState('')
  const vault = usePasswordVault()
  const vaultReady = vault.status === 'unlocked'
  const wasUnlocked = useRef(vaultReady)
  useEffect(() => {
    if (wasUnlocked.current && !vaultReady && isOpen) {
      setFormData(previous => ({ ...previous, password: '', pin_code: '' }))
      setShowPassword(false)
      setShowPin(false)
      setShowGenerator(false)
      onClose()
    }
    wasUnlocked.current = vaultReady
  }, [vaultReady, isOpen, onClose])
  const unreadable = Boolean(editPassword && (editPassword.secretStatus === 'locked' || editPassword.secretStatus === 'error'))
  const blockedReason = !vaultReady
    ? 'Sblocca la cassaforte per salvare: password e PIN vengono cifrati sul dispositivo.'
    : editPassword?.secretStatus === 'error'
      ? 'Questa credenziale non può essere decifrata (dati danneggiati o chiave diversa). Non è modificabile da qui.'
      : unreadable ? 'Credenziale ancora bloccata: chiudi e riapri dopo lo sblocco.' : ''
  const selectCategory = (level: number, value: string) => {
    const currentPath = formData.category ? formData.category.split(' / ') : []
    const nextPath = [...currentPath.slice(0, level), value].filter(Boolean)
    setFormData(prev => ({ ...prev, category: nextPath.join(' / ') }))
  }

  const getLevelOptions = (level: number) => {
    const selectedNames = formData.category ? formData.category.split(' / ') : []
    const parent = level === 0 ? null : categories.find(category => category.name === selectedNames[level - 1] && (level === 1 || category.parent_id === categories.find(parentCategory => parentCategory.name === selectedNames[level - 2])?.id))
    return categories.filter(category => category.parent_id === (parent?.id || null))
  }

  useEffect(() => {
    if (editPassword) {
      setFormData({
        id: editPassword.id,
        title: editPassword.title || '',
        username: editPassword.username || '',
        password: editPassword.password || '',
        website: editPassword.website || '',
        category: editPassword.category || '',
        emoji: editPassword.emoji || '🔑',
        notes: editPassword.notes || '',
        isFavorite: editPassword.isFavorite || false,
        pin_code: editPassword.pin_code || '',
      })
    } else {
      setFormData({
        title: '',
        username: '',
        password: '',
        website: '',
        category: '',
        emoji: '🔑',
        notes: '',
        isFavorite: false,
        pin_code: '',
      })
    }
    setShowPassword(false)
    setShowPin(false)
    setSaveError('')
  }, [editPassword, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || blockedReason) return
    setIsSaving(true)
    setSaveError('')
    try {
      await onSave(formData)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Impossibile salvare la credenziale.')
      setIsSaving(false)
      return
    }
    if (!editPassword) {
      setFormData({
        title: '',
        username: '',
        password: '',
        website: '',
        category: '',
        emoji: '🔑',
        notes: '',
        isFavorite: false,
        pin_code: '',
      })
    }
    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && !(wasUnlocked.current && !vaultReady) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl"
          >
            <div className="relative bg-ak-panel/95 backdrop-blur-2xl border border-ak-line/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ak-line/60 bg-ak-panel/60 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ak-accent flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-ak-text">
                      {editPassword ? 'Modifica credenziale' : 'Nuova credenziale'}
                    </h2>
                    <p className="text-xs text-ak-subtle">{editPassword ? 'Aggiorna i dati salvati' : 'Aggiungi al vault'}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  title="Chiudi"
                  className="w-8 h-8 rounded-lg bg-ak-inset hover:bg-ak-danger-bg border border-ak-line/60 hover:border-ak-danger flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-ak-subtle" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 overflow-y-auto flex-1">
                {!vaultReady && <div className="mb-5"><PasswordVaultPanel compact /></div>}
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Titolo */}
                  <div>
                    <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5">
                      Titolo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                      placeholder="Es. Account Google, VPN aziendale..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Nome utente */}
                    <div>
                      <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Nome utente
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                        placeholder="username o email"
                      />
                    </div>

                    {/* Categoria gerarchica */}
                    <div>
                      <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Categoria
                      </label>
                      <div className="space-y-2">
                        {[0, 1, 2].map(level => {
                          const options = getLevelOptions(level)
                          const selected = formData.category.split(' / ')[level] || ''
                          if (level > 0 && !formData.category.split(' / ')[level - 1]) return null
                          return (
                            <div key={level} className="flex gap-2">
                              <select required={level === 0} title={`Categoria livello ${level + 1}`} value={selected} onChange={(event) => selectCategory(level, event.target.value)} className="min-w-0 flex-1 rounded-xl border border-ak-line bg-ak-panel px-3.5 py-2.5 text-sm text-ak-text outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10">
                                <option value="">{level === 0 ? 'Seleziona categoria' : 'Seleziona sottocategoria'}</option>
                                {options.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
                              </select>
                            </div>
                          )
                        })}
                        {!categories.length && <p className="text-xs text-ak-subtle">Crea prima una categoria dalla sezione Password.</p>}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className="text-xs text-ak-muted hover:text-ak-cyan border border-ak-line hover:border-ak-line px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all bg-ak-panel hover:bg-ak-hover"
                      >
                        <Dices className="w-3 h-3" />
                        {showGenerator ? 'Nascondi generatore' : 'Genera password'}
                      </button>
                    </div>

                    {showGenerator && (
                      <div className="mb-3">
                        <PasswordGenerator onGenerate={(pwd) => setFormData(prev => ({ ...prev, password: pwd }))} />
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3.5 py-2.5 pr-11 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono text-sm"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-ak-inset text-ak-subtle hover:text-ak-text transition-all"
                        aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sito web */}
                  <div>
                    <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Sito web (opzionale)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                      placeholder="https://esempio.com"
                    />
                  </div>

                  {/* PIN */}
                  <div>
                    <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> PIN / Codice (opzionale)
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={formData.pin_code || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pin_code: e.target.value }))}
                        className="w-full px-3.5 py-2.5 pr-11 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm"
                        placeholder="●●●●"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-ak-inset text-ak-subtle hover:text-ak-text transition-all"
                        aria-label={showPin ? 'Nascondi PIN' : 'Mostra PIN'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-ak-subtle mt-1">PIN, codice dispositivo, pattern di sblocco, ecc.</p>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-medium text-ak-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Note (opzionale)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-ak-panel border border-ak-line rounded-xl text-ak-text placeholder-ak-subtle focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none text-sm"
                      placeholder="Note aggiuntive, domande di sicurezza..."
                    />
                  </div>

                  {/* Preferito */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer bg-ak-panel hover:bg-ak-inset border border-ak-line rounded-xl p-3.5 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.isFavorite}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
                        className="w-4 h-4 rounded accent-indigo-500"
                      />
                      <Star className={`w-4 h-4 ${formData.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-ak-subtle'}`} />
                      <span className="text-sm text-ak-text">Aggiungi ai preferiti</span>
                    </label>
                  </div>

                  {(blockedReason || saveError) && <p className="text-sm text-ak-danger" role="alert">{saveError || blockedReason}</p>}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSaving || Boolean(blockedReason)}
                    className="w-full py-3 bg-ak-accent hover:bg-ak-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? 'Salvataggio...' : editPassword ? 'Aggiorna credenziale' : 'Salva credenziale'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
