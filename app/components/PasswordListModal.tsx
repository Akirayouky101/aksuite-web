'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Copy, Trash2, Edit, ExternalLink, Search, Star, Filter, ArrowUpDown } from 'lucide-react'
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
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const categories = ['Tutte', 'Lavoro', 'Personale', 'Social', 'Finanza', 'Gaming', 'Altro']

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
              <div className="relative bg-[#131920] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white/[0.06] bg-white/[0.03] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white/90">
                        📋 ELENCO PASSWORD
                      </h2>
                      <p className="text-cyan-100 font-bold mt-1">
                        {filteredPasswords.length} di {passwords.length} password
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/[0.06] hover:border-red-500/30 flex items-center justify-center"
                    >
                      <X className="w-6 h-6 text-white" strokeWidth={3} />
                    </motion.button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="🔍 Cerca per titolo, username, sito o categoria..."
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white font-bold placeholder-white/20 focus:border-teal-500/50 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-white transition-colors"
                        aria-label="Cancella ricerca"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Filters and Sorting */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Favorites Toggle */}
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                        showFavoritesOnly 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-black' : ''}`} />
                      Solo Preferiti
                    </button>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-cyan-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white font-bold text-sm focus:border-teal-500/50 focus:outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-cyan-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white font-bold text-sm focus:border-teal-500/50 focus:outline-none"
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
                    <div className="text-center py-12">
                      <div className="text-8xl mb-4">{searchQuery ? '🔍' : '🔒'}</div>
                      <h3 className="text-base font-bold text-cyan-300 mb-2">
                        {searchQuery ? 'Nessun risultato' : 'Nessuna password salvata'}
                      </h3>
                      <p className="text-cyan-100">
                        {searchQuery ? 'Prova a cercare con altri termini' : 'Inizia aggiungendo la tua prima password!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPasswords.map((pwd, index) => (
                        <motion.div
                          key={pwd.id}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group"
                        >
                          <div 
                            onClick={() => setSelectedPassword(pwd)}
                            className="bg-gradient-to-r from-slate-800/90 to-blue-900/50 border border-white/[0.08] rounded-xl p-4 hover:border-cyan-400 transition-all cursor-pointer hover:bg-white/[0.04]/70"
                          >
                            <div className="flex items-start gap-4">
                              {/* Emoji */}
                              <div className="text-5xl">{pwd.emoji}</div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Title and Category */}
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    {pwd.isFavorite && (
                                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    )}
                                    <h3 className="text-xl font-bold text-cyan-300">
                                      {pwd.title}
                                    </h3>
                                  </div>
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
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.username, `${pwd.id}-user`); }}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                      title="Copia username"
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
                                      onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(pwd.id); }}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                      title={visiblePasswords.has(pwd.id) ? "Nascondi" : "Mostra"}
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
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.password, `${pwd.id}-pass`); }}
                                      className="p-1 hover:bg-cyan-500/20 rounded"
                                      title="Copia password"
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
                                        className="text-teal-300 hover:text-blue-200 font-mono text-sm flex items-center gap-1 hover:underline"
                                      >
                                        {pwd.website}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                                    title="Elimina password"
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

                {/* Top/bottom accent lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
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
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl my-8"
                >
                  <div className="hidden" />
                  
                  {/* Modal content */}
                  <div className="relative bg-[#131920] border border-white/[0.08] rounded-2xl shadow-2xl p-8">
                    {/* Close button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedPassword(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/[0.06] hover:border-red-500/30 flex items-center justify-center"
                    >
                      <X className="w-6 h-6 text-white" strokeWidth={3} />
                    </motion.button>

                    {/* Emoji */}
                    <div className="text-center mb-6">
                      <div className="text-8xl mb-4">{selectedPassword.emoji}</div>
                      <h2 className="text-4xl font-bold text-white/90 mb-2">
                        {selectedPassword.title}
                      </h2>
                      <span className="inline-block px-4 py-2 bg-purple-500/30 border border-white/[0.08] rounded-full text-sm font-bold text-purple-200">
                        {selectedPassword.category}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      {/* Username */}
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <div className="text-sm text-cyan-400 font-bold mb-2">👤 USERNAME</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-xl text-white font-mono flex-1 break-all">
                            {selectedPassword.username}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(selectedPassword.username, `detail-user`)}
                            className="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-white/[0.08] rounded-lg shrink-0"
                          >
                            {copiedId === `detail-user` ? (
                              <span className="text-green-400 font-bold">✓ Copiato!</span>
                            ) : (
                              <Copy className="w-5 h-5 text-cyan-400" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <div className="text-sm text-pink-400 font-bold mb-2">🔐 PASSWORD</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-xl text-white font-mono flex-1 break-all">
                            {visiblePasswords.has(selectedPassword.id) ? selectedPassword.password : '••••••••••••••••'}
                          </code>
                          <div className="flex gap-2 shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => togglePasswordVisibility(selectedPassword.id)}
                              className="p-3 bg-pink-500/20 hover:bg-pink-500/30 border border-white/[0.08] rounded-lg"
                            >
                              {visiblePasswords.has(selectedPassword.id) ? (
                                <EyeOff className="w-5 h-5 text-pink-400" />
                              ) : (
                                <Eye className="w-5 h-5 text-pink-400" />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(selectedPassword.password, `detail-pass`)}
                              className="p-3 bg-pink-500/20 hover:bg-pink-500/30 border border-white/[0.08] rounded-lg"
                            >
                              {copiedId === `detail-pass` ? (
                                <span className="text-green-400 font-bold">✓</span>
                              ) : (
                                <Copy className="w-5 h-5 text-pink-400" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Website */}
                      {selectedPassword.website && (
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                          <div className="text-sm text-purple-400 font-bold mb-2">🌐 SITO WEB</div>
                          <a 
                            href={selectedPassword.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xl text-teal-300 hover:text-blue-200 font-mono flex items-center gap-2 hover:underline break-all"
                          >
                            {selectedPassword.website}
                            <ExternalLink className="w-5 h-5 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Created date */}
                      <div className="text-center text-sm text-cyan-300 font-bold">
                        📅 Creata il: {new Date(selectedPassword.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {/* Delete button */}
                      {onDelete && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (confirm('Sei sicuro di voler eliminare questa password?')) {
                              onDelete(selectedPassword.id)
                              setSelectedPassword(null)
                            }
                          }}
                          className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 rounded-xl text-red-300 font-bold text-lg flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          ELIMINA PASSWORD
                        </motion.button>
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