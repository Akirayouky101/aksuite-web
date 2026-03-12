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
    Lavoro:    { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400' },
    Personale: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
    Social:    { bg: 'bg-pink-50',   text: 'text-pink-600',   dot: 'bg-pink-400' },
    Finanza:   { bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400' },
    Gaming:    { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
    Altro:     { bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400' },
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

  const copyToClipboard = async (text: string, id: string) => {
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
            className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-4"
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
              <div className="relative bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="relative z-10 px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <KeyRound className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Elenco Password</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {filteredPasswords.length} di {passwords.length} password
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      title="Chiudi"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Search Bar */}
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca per titolo, username, sito o categoria..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-400 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                      Solo preferiti
                    </button>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-500" />
                      <select
                        title="Filtra per categoria"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:border-indigo-400 focus:outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-indigo-500" />
                      <select
                        title="Ordina per"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:border-indigo-400 focus:outline-none"
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
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">
                        {searchQuery ? 'Nessun risultato' : 'Nessuna credenziale salvata'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? 'Prova con termini diversi' : 'Aggiungi la prima credenziale al vault'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPasswords.map((pwd) => (
                        <div
                          key={pwd.id}
                          onClick={() => setSelectedPassword(pwd)}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                              {/* Icona categoria colorata */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${categoryColors[pwd.category]?.bg ?? 'bg-slate-100'}`}>
                                <KeyRound className={`w-4 h-4 ${categoryColors[pwd.category]?.text ?? 'text-slate-500'}`} />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Titolo e categoria */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {pwd.isFavorite && (
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                  )}
                                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                                    {pwd.title}
                                  </h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${categoryColors[pwd.category]?.bg ?? 'bg-slate-100'} ${categoryColors[pwd.category]?.text ?? 'text-slate-500'}`}>
                                    {pwd.category}
                                  </span>
                                </div>

                                {/* Username */}
                                <div className="mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 w-16 flex-shrink-0">Username</span>
                                    <span className="text-sm text-slate-700 font-mono truncate">{pwd.username}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.username, `${pwd.id}-user`); }}
                                      className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                      title="Copia username"
                                    >
                                      {copiedId === `${pwd.id}-user` ? (
                                        <span className="text-green-500 text-xs font-medium">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-slate-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Password */}
                                <div className="mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 w-16 flex-shrink-0">Password</span>
                                    <code className="text-sm text-slate-700 font-mono">
                                      {visiblePasswords.has(pwd.id) ? pwd.password : '••••••••••'}
                                    </code>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(pwd.id); }}
                                      className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                      title={visiblePasswords.has(pwd.id) ? 'Nascondi' : 'Mostra'}
                                    >
                                      {visiblePasswords.has(pwd.id) ? (
                                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.password, `${pwd.id}-pass`); }}
                                      className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                      title="Copia password"
                                    >
                                      {copiedId === `${pwd.id}-pass` ? (
                                        <span className="text-green-500 text-xs font-medium">✓</span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-slate-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Website */}
                                {pwd.website && (
                                  <div className="mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 w-16 flex-shrink-0">Sito</span>
                                      <a
                                        href={pwd.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm text-indigo-500 hover:text-indigo-700 font-mono flex items-center gap-1 hover:underline truncate"
                                      >
                                        {pwd.website}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* PIN */}
                                {pwd.pin_code && (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 w-16 flex-shrink-0">PIN</span>
                                      <code className="text-sm text-slate-700 font-mono tracking-widest">
                                        {visiblePins.has(pwd.id) ? pwd.pin_code : '●'.repeat(pwd.pin_code.length)}
                                      </code>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); togglePinVisibility(pwd.id); }}
                                        className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                        title={visiblePins.has(pwd.id) ? 'Nascondi PIN' : 'Mostra PIN'}
                                      >
                                        {visiblePins.has(pwd.id) ? (
                                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.pin_code!, `${pwd.id}-pin`); }}
                                        className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                        title="Copia PIN"
                                      >
                                        {copiedId === `${pwd.id}-pin` ? (
                                          <span className="text-green-500 text-xs font-medium">✓</span>
                                        ) : (
                                          <Copy className="w-3 h-3 text-slate-400" />
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
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 rounded-lg transition-all"
                                    title="Modifica"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-indigo-500" />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => {
                                      if (confirm('Eliminare questa credenziale?')) onDelete(pwd.id)
                                    }}
                                    className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
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
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-100" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100" />
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
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl my-8"
                >
                  <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 p-6">
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedPassword(null)}
                      title="Chiudi"
                      className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200/60 flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>

                    {/* Header */}
                    <div className="mb-5 pr-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[selectedPassword.category]?.bg ?? 'bg-slate-100'}`}>
                          <KeyRound className={`w-4 h-4 ${categoryColors[selectedPassword.category]?.text ?? 'text-slate-500'}`} />
                        </div>
                        {selectedPassword.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        <h2 className="text-lg font-semibold text-slate-800">{selectedPassword.title}</h2>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[selectedPassword.category]?.bg ?? 'bg-slate-100'} ${categoryColors[selectedPassword.category]?.text ?? 'text-slate-500'}`}>
                        {selectedPassword.category}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {/* Username */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Username</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-sm text-slate-800 font-mono flex-1 break-all">
                            {selectedPassword.username}
                          </code>
                          <button
                            onClick={() => copyToClipboard(selectedPassword.username, `detail-user`)}
                            className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg shrink-0 transition-all"
                            title="Copia"
                          >
                            {copiedId === `detail-user` ? (
                              <span className="text-green-500 text-xs font-medium">✓</span>
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-sm text-slate-800 font-mono flex-1 break-all">
                            {visiblePasswords.has(selectedPassword.id) ? selectedPassword.password : '••••••••••••••••'}
                          </code>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(selectedPassword.id)}
                              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                              title={visiblePasswords.has(selectedPassword.id) ? 'Nascondi' : 'Mostra'}
                            >
                              {visiblePasswords.has(selectedPassword.id) ? (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(selectedPassword.password, `detail-pass`)}
                              className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all"
                              title="Copia"
                            >
                              {copiedId === `detail-pass` ? (
                                <span className="text-green-500 text-xs font-medium">✓</span>
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Website */}
                      {selectedPassword.website && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Sito web</div>
                          <a
                            href={selectedPassword.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-500 hover:text-indigo-700 font-mono flex items-center gap-1.5 hover:underline break-all"
                          >
                            {selectedPassword.website}
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* PIN */}
                      {selectedPassword.pin_code && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" /> PIN / Codice
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm text-slate-800 font-mono flex-1 break-all tracking-widest">
                              {visiblePins.has(selectedPassword.id) ? selectedPassword.pin_code : '●'.repeat(selectedPassword.pin_code.length)}
                            </code>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => togglePinVisibility(selectedPassword.id)}
                                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                                title={visiblePins.has(selectedPassword.id) ? 'Nascondi PIN' : 'Mostra PIN'}
                              >
                                {visiblePins.has(selectedPassword.id) ? (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(selectedPassword.pin_code!, `detail-pin`)}
                                className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all"
                                title="Copia PIN"
                              >
                                {copiedId === `detail-pin` ? (
                                  <span className="text-green-500 text-xs font-medium">✓</span>
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Data creazione */}
                      <div className="text-center text-xs text-slate-400 pt-1">
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
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-500 font-medium text-sm flex items-center justify-center gap-2 transition-all"
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