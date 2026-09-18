'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, User, Globe, Tag, Eye, EyeOff, Dices, Star, MessageSquare, Hash } from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'
import { PasswordCategory } from '../hooks/usePasswords'
import PasswordCategoryModal from './PasswordCategoryModal'

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
}

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PasswordData) => void
  editPassword?: PasswordData | null
  categories?: PasswordCategory[]
  onCreateCategory?: (name: string, parentId: string | null) => Promise<PasswordCategory | null>
}

export default function PasswordModal({ isOpen, onClose, onSave, editPassword, categories = [], onCreateCategory }: PasswordModalProps) {
  const [formData, setFormData] = useState<PasswordData>({
    title: '',
    username: '',
    password: '',
    website: '',
    category: 'Personale',
    emoji: '🔑',
    notes: '',
    isFavorite: false,
    pin_code: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [categoryParentId, setCategoryParentId] = useState<string | null | undefined>(undefined)

  const getPath = (categoryId: string | null) => {
    const path: PasswordCategory[] = []
    let current = categories.find(category => category.id === categoryId)
    while (current) {
      path.unshift(current)
      current = current.parent_id ? categories.find(category => category.id === current?.parent_id) : undefined
    }
    return path
  }

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

  const prepareCategory = (level: number) => {
    const selectedNames = formData.category ? formData.category.split(' / ') : []
    const parent = level === 0 ? null : categories.find(category => category.name === selectedNames[level - 1])
    setCategoryParentId(parent?.id || null)
  }

  const saveCategory = async (name: string) => {
    if (!onCreateCategory) return
    const created = await onCreateCategory(name, categoryParentId ?? null)
    if (created) {
      const parentPath = getPath(created.parent_id)
      setFormData(prev => ({ ...prev, category: [...parentPath.map(item => item.name), created.name].join(' / ') }))
    }
  }

  useEffect(() => {
    if (editPassword) {
      setFormData({
        id: editPassword.id,
        title: editPassword.title || '',
        username: editPassword.username || '',
        password: editPassword.password || '',
        website: editPassword.website || '',
        category: editPassword.category || 'Personale',
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
        category: 'Personale',
        emoji: '🔑',
        notes: '',
        isFavorite: false,
        pin_code: '',
      })
    }
    setShowPassword(false)
    setShowPin(false)
  }, [editPassword, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    onSave(formData)
    if (!editPassword) {
      setFormData({
        title: '',
        username: '',
        password: '',
        website: '',
        category: 'Personale',
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
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl"
          >
            <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">
                      {editPassword ? 'Modifica credenziale' : 'Nuova credenziale'}
                    </h2>
                    <p className="text-xs text-slate-400">{editPassword ? 'Aggiorna i dati salvati' : 'Aggiungi al vault'}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  title="Chiudi"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Titolo */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Titolo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                      placeholder="Es. Account Google, VPN aziendale..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Nome utente */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Nome utente
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                        placeholder="username o email"
                      />
                    </div>

                    {/* Categoria gerarchica */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Categoria
                      </label>
                      <div className="space-y-2">
                        {[0, 1, 2].map(level => {
                          const options = getLevelOptions(level)
                          const selected = formData.category.split(' / ')[level] || ''
                          if (level > 0 && !formData.category.split(' / ')[level - 1]) return null
                          return (
                            <div key={level} className="flex gap-2">
                              <select title={`Categoria livello ${level + 1}`} value={selected} onChange={(event) => selectCategory(level, event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10">
                                <option value="">{level === 0 ? 'Seleziona categoria' : 'Seleziona sottocategoria'}</option>
                                {options.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
                              </select>
                              <button type="button" onClick={() => prepareCategory(level)} title="Crea categoria" className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-lg font-medium text-indigo-600 transition hover:bg-indigo-100">+</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all bg-slate-50 hover:bg-indigo-50"
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
                        className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono text-sm"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                        aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sito web */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Sito web (opzionale)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                      placeholder="https://esempio.com"
                    />
                  </div>

                  {/* PIN */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> PIN / Codice (opzionale)
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={formData.pin_code || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pin_code: e.target.value }))}
                        className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm"
                        placeholder="●●●●"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                        aria-label={showPin ? 'Nascondi PIN' : 'Mostra PIN'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">PIN, codice dispositivo, pattern di sblocco, ecc.</p>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Note (opzionale)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none text-sm"
                      placeholder="Note aggiuntive, domande di sicurezza..."
                    />
                  </div>

                  {/* Preferito */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.isFavorite}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
                        className="w-4 h-4 rounded accent-indigo-500"
                      />
                      <Star className={`w-4 h-4 ${formData.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                      <span className="text-sm text-slate-700">Aggiungi ai preferiti</span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? 'Salvataggio...' : editPassword ? 'Aggiorna credenziale' : 'Salva credenziale'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <PasswordCategoryModal
        isOpen={categoryParentId !== undefined}
        parentName={categoryParentId ? getPath(categoryParentId).map(item => item.name).join(' / ') : undefined}
        onClose={() => setCategoryParentId(undefined)}
        onSave={async (name) => { await saveCategory(name); setCategoryParentId(undefined) }}
      />
    </AnimatePresence>
  )
}
