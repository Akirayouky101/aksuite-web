'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Copy, Trash2, Edit, ExternalLink, Search, Star, Filter, ArrowUpDown, KeyRound, Hash } from 'lucide-react'
import { Password } from '../hooks/usePasswords'

interface PasswordListModalProps {
  isOpen: boolean
  onClose: () => void
  passwords: Password[]
  onDelete?: (id: string) => void
  onEdit?: (password: Password) => void
}

export default function PasswordListModal({ 
  isOpen, 
  onClose, 
  passwords,
  onDelete,
  onEdit 
}: PasswordListModalProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [visiblePins, setVisiblePins] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const categories = ['Tutte', 'Lavoro', 'Personale', 'Social', 'Finanza', 'Gaming', 'Altro']

  const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
    Lavoro:    { bg: 'bg-ak-hover',   text: 'text-ak-cyan',   dot: 'bg-blue-400' },
    Personale: { bg: 'bg-ak-purple-bg', text: 'text-ak-purple', dot: 'bg-violet-400' },
    Social:    { bg: 'bg-ak-pink-bg',   text: 'text-ak-pink',   dot: 'bg-pink-400' },
    Finanza:   { bg: 'bg-ak-success-bg',text: 'text-ak-success',dot: 'bg-emerald-400' },
    Gaming:    { bg: 'bg-ak-orange-bg', text: 'text-ak-orange', dot: 'bg-orange-400' },
    Altro:     { bg: 'bg-ak-inset', text: 'text-ak-text',  dot: 'bg-ak-inset' },
  }

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

  const togglePinVisibility = (id: string) => {
    setVisiblePins(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isReadable = (item: Password) => item.secretStatus !== 'locked' && item.secretStatus !== 'error'
  const lockedLabel = (item: Password) => item.secretStatus === 'error' ? 'Errore di decifratura' : 'Bloccata'
  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter and sort passwords
  const filteredPasswords = passwords
    .filter(password => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          password.title.toLowerCase().includes(query) ||
          password.username.toLowerCase().includes(query) ||
          (password.website && password.website.toLowerCase().includes(query)) ||
          (password.category && password.category.toLowerCase().includes(query))
        )
        if (!matchesSearch) return false
      }
      
      // Category filter
      if (selectedCategory !== 'Tutte' && password.category !== selectedCategory) {
        return false
      }
      
      // Favorites filter
      if (showFavoritesOnly && !password.isFavorite) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title)
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category)
      } else {
        // Sort by date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

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
            className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30  z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="hidden" />
              
              {/* Main modal */}
              <div className="relative bg-ak-panel/90 backdrop-blur-2xl border border-ak-line/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="relative z-10 px-6 py-5 border-b border-ak-line/60 bg-ak-panel/60 flex-shrink-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ak-accent to-ak-accent flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <KeyRound className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-ak-text">Elenco Password</h2>
                        <p className="text-xs text-ak-subtle mt-0.5">
                          {filteredPasswords.length} di {passwords.length} password
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      title="Chiudi"
                      className="w-9 h-9 rounded-xl bg-ak-inset hover:bg-ak-danger-bg border border-ak-line/60 hover:border-ak-danger flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-ak-subtle hover:text-ak-danger" />
                    </button>
                  </div>

                  {/* Search Bar */}
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ak-subtle" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca per titolo, username, sito o categoria..."
                      className="w-full pl-10 pr-4 py-2.5 bg-ak-panel border border-ak-line rounded-xl text-ak-text text-sm placeholder-ak-subtle focus:border-indigo-400 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ak-subtle hover:text-ak-text transition-colors"
                        aria-label="Cancella ricerca"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    </div>

                  {/* Filters and Sorting */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Favorites Toggle */}
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                        showFavoritesOnly
                          ? 'bg-ak-warning-bg text-ak-warning border-ak-warning'
                          : 'bg-ak-panel text-ak-muted border-ak-line hover:bg-ak-inset'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                      Solo preferiti
                    </button>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-ak-cyan" />
                      <select
                        title="Filtra per categoria"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1.5 bg-ak-panel border border-ak-line rounded-lg text-ak-text text-sm focus:border-indigo-400 focus:outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-ak-cyan" />
                      <select
                        title="Ordina per"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 bg-ak-panel border border-ak-line rounded-lg text-ak-text text-sm focus:border-indigo-400 focus:outline-none"
                      >
                        <option value="date">Data (recenti)</option>
                        <option value="name">Nome (A-Z)</option>
                        <option value="category">Categoria</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password List */}
                <div className="relative z-10 p-6 overflow-y-auto flex-1">
                  {filteredPasswords.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-xl bg-ak-hover flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-ak-text mb-1">
                        {searchQuery ? 'Nessun risultato' : 'Nessuna credenziale salvata'}
                      </h3>
                      <p className="text-xs text-ak-subtle">
                        {searchQuery ? 'Prova con termini diversi' : 'Aggiungi la prima credenziale al vault'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPasswords.map((pwd) => (
                        <div
                          key={pwd.id}
                          onClick={() => setSelectedPassword(pwd)}
                          className="bg-ak-panel border border-ak-line rounded-xl p-4 hover:border-ak-line hover:bg-ak-panel/50 transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                              {/* Icona categoria colorata */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${categoryColors[pwd.category]?.bg ?? 'bg-ak-inset'}`}>
                                <KeyRound className={`w-4 h-4 ${categoryColors[pwd.category]?.text ?? 'text-ak-muted'}`} />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Titolo e categoria */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {pwd.isFavorite && (
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                  )}
                                  <h3 className="text-sm font-semibold text-ak-text truncate">
                                    {pwd.title}
                                  </h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${categoryColors[pwd.category]?.bg ?? 'bg-ak-inset'} ${categoryColors[pwd.category]?.text ?? 'text-ak-muted'}`}>
                                    {pwd.category}
                                  </span>
                                </div>

                                {/* Username */}
                                <div className="mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-ak-subtle w-16 flex-shrink-0">Username</span>
                                    <span className="text-sm text-ak-text font-mono truncate">{pwd.username}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.username, `${pwd.id}-user`); }}
                                      className="p-1 hover:bg-ak-inset rounded transition-colors flex-shrink-0"
                                      title="Copia username"
                                    >
                                      {copiedId === `${pwd.id}-user` ? (
                                        <span className="text-ak-success text-xs font-medium">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-ak-subtle" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Password */}
                                <div className="mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-ak-subtle w-16 flex-shrink-0">Password</span>
                                    <code className="text-sm text-ak-text font-mono">
                                      {!isReadable(pwd) ? lockedLabel(pwd) : visiblePasswords.has(pwd.id) ? pwd.password : '••••••••••'}
                                    </code>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(pwd.id); }}
                                      className="p-1 hover:bg-ak-inset rounded transition-colors flex-shrink-0"
                                      title={visiblePasswords.has(pwd.id) ? 'Nascondi' : 'Mostra'}
                                    >
                                      {visiblePasswords.has(pwd.id) ? (
                                        <EyeOff className="w-3.5 h-3.5 text-ak-subtle" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5 text-ak-subtle" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.password, `${pwd.id}-pass`); }}
                                      className="p-1 hover:bg-ak-inset rounded transition-colors flex-shrink-0"
                                      title="Copia password"
                                    >
                                      {copiedId === `${pwd.id}-pass` ? (
                                        <span className="text-ak-success text-xs font-medium">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-ak-subtle" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Website */}
                                {pwd.website && (
                                  <div className="mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-ak-subtle w-16 flex-shrink-0">Sito</span>
                                      <a
                                        href={pwd.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm text-ak-cyan hover:text-ak-cyan font-mono flex items-center gap-1 hover:underline truncate"
                                      >
                                        {pwd.website}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* PIN */}
                                {(pwd.pin_code || (!isReadable(pwd) && pwd.hasPin)) && (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-ak-subtle w-16 flex-shrink-0">PIN</span>
                                      <code className="text-sm text-ak-text font-mono tracking-widest">
                                        {!isReadable(pwd) ? lockedLabel(pwd) : visiblePins.has(pwd.id) ? pwd.pin_code : '●'.repeat((pwd.pin_code || '').length)}
                                      </code>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); togglePinVisibility(pwd.id); }}
                                        className="p-1 hover:bg-ak-inset rounded transition-colors flex-shrink-0"
                                        title={visiblePins.has(pwd.id) ? 'Nascondi PIN' : 'Mostra PIN'}
                                      >
                                        {visiblePins.has(pwd.id) ? (
                                          <EyeOff className="w-3.5 h-3.5 text-ak-subtle" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5 text-ak-subtle" />
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.pin_code || '', `${pwd.id}-pin`); }}
                                        className="p-1 hover:bg-ak-inset rounded transition-colors flex-shrink-0"
                                        title="Copia PIN"
                                      >
                                        {copiedId === `${pwd.id}-pin` ? (
                                          <span className="text-ak-success text-xs font-medium">✓</span>
                                        ) : (
                                          <Copy className="w-3 h-3 text-ak-subtle" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Azioni */}
                              <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(pwd)}
                                    className="p-1.5 bg-ak-hover hover:bg-ak-hover border border-ak-line hover:border-ak-line rounded-lg transition-all"
                                    title="Modifica"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-ak-cyan" />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => {
                                      if (confirm('Eliminare questa credenziale?')) onDelete(pwd.id)
                                    }}
                                    className="p-1.5 bg-ak-panel hover:bg-ak-danger-bg border border-ak-line hover:border-ak-danger rounded-lg transition-all"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-ak-subtle hover:text-red-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top/bottom accent lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-ak-inset" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-ak-inset" />
              </div>
            </motion.div>
          </motion.div>

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPassword(null)}
                className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl my-8"
                >
                  <div className="relative bg-ak-panel/95 backdrop-blur-2xl border border-ak-line/60 rounded-2xl shadow-2xl shadow-black/50 p-6">
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedPassword(null)}
                      title="Chiudi"
                      className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-ak-inset hover:bg-ak-danger-bg border border-ak-line hover:border-ak-danger/60 flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-ak-muted" />
                    </button>

                    {/* Header */}
                    <div className="mb-5 pr-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[selectedPassword.category]?.bg ?? 'bg-ak-inset'}`}>
                          <KeyRound className={`w-4 h-4 ${categoryColors[selectedPassword.category]?.text ?? 'text-ak-muted'}`} />
                        </div>
                        {selectedPassword.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        <h2 className="text-lg font-semibold text-ak-text">{selectedPassword.title}</h2>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[selectedPassword.category]?.bg ?? 'bg-ak-inset'} ${categoryColors[selectedPassword.category]?.text ?? 'text-ak-muted'}`}>
                        {selectedPassword.category}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {/* Username */}
                      <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                        <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Username</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-sm text-ak-text font-mono flex-1 break-all">
                            {selectedPassword.username}
                          </code>
                          <button
                            onClick={() => copyToClipboard(selectedPassword.username, `detail-user`)}
                            className="p-2 bg-ak-panel hover:bg-ak-hover border border-ak-line hover:border-ak-line rounded-lg shrink-0 transition-all"
                            title="Copia"
                          >
                            {copiedId === `detail-user` ? (
                              <span className="text-ak-success text-xs font-medium">✓</span>
                            ) : (
                              <Copy className="w-4 h-4 text-ak-subtle" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                        <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Password</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-sm text-ak-text font-mono flex-1 break-all">
                            {!isReadable(selectedPassword) ? lockedLabel(selectedPassword) : visiblePasswords.has(selectedPassword.id) ? selectedPassword.password : '••••••••••••••••'}
                          </code>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(selectedPassword.id)}
                              className="p-2 bg-ak-panel hover:bg-ak-inset border border-ak-line rounded-lg transition-all"
                              title={visiblePasswords.has(selectedPassword.id) ? 'Nascondi' : 'Mostra'}
                            >
                              {visiblePasswords.has(selectedPassword.id) ? (
                                <EyeOff className="w-4 h-4 text-ak-subtle" />
                              ) : (
                                <Eye className="w-4 h-4 text-ak-subtle" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(selectedPassword.password, `detail-pass`)}
                              className="p-2 bg-ak-panel hover:bg-ak-hover border border-ak-line hover:border-ak-line rounded-lg transition-all"
                              title="Copia"
                            >
                              {copiedId === `detail-pass` ? (
                                <span className="text-ak-success text-xs font-medium">✓</span>
                              ) : (
                                <Copy className="w-4 h-4 text-ak-subtle" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Website */}
                      {selectedPassword.website && (
                        <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                          <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2">Sito web</div>
                          <a
                            href={selectedPassword.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-ak-cyan hover:text-ak-cyan font-mono flex items-center gap-1.5 hover:underline break-all"
                          >
                            {selectedPassword.website}
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* PIN */}
                      {(selectedPassword.pin_code || (!isReadable(selectedPassword) && selectedPassword.hasPin)) && (
                        <div className="bg-ak-panel border border-ak-line rounded-xl p-3.5">
                          <div className="text-xs font-medium text-ak-subtle uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" /> PIN / Codice
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm text-ak-text font-mono flex-1 break-all tracking-widest">
                              {!isReadable(selectedPassword) ? lockedLabel(selectedPassword) : visiblePins.has(selectedPassword.id) ? selectedPassword.pin_code : '●'.repeat((selectedPassword.pin_code || '').length)}
                            </code>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => togglePinVisibility(selectedPassword.id)}
                                className="p-2 bg-ak-panel hover:bg-ak-inset border border-ak-line rounded-lg transition-all"
                                title={visiblePins.has(selectedPassword.id) ? 'Nascondi PIN' : 'Mostra PIN'}
                              >
                                {visiblePins.has(selectedPassword.id) ? (
                                  <EyeOff className="w-4 h-4 text-ak-subtle" />
                                ) : (
                                  <Eye className="w-4 h-4 text-ak-subtle" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(selectedPassword.pin_code || '', `detail-pin`)}
                                className="p-2 bg-ak-panel hover:bg-ak-hover border border-ak-line hover:border-ak-line rounded-lg transition-all"
                                title="Copia PIN"
                              >
                                {copiedId === `detail-pin` ? (
                                  <span className="text-ak-success text-xs font-medium">✓</span>
                                ) : (
                                  <Copy className="w-4 h-4 text-ak-subtle" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Data creazione */}
                      <div className="text-center text-xs text-ak-subtle pt-1">
                        Creata il {new Date(selectedPassword.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>

                      {/* Elimina */}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm('Eliminare questa credenziale?')) {
                              onDelete(selectedPassword.id)
                              setSelectedPassword(null)
                            }
                          }}
                          className="w-full py-2.5 bg-ak-danger-bg hover:bg-ak-danger-bg border border-ak-danger rounded-xl text-ak-danger font-medium text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina credenziale
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}