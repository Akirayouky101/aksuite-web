'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Search, Star, Phone, Mail, MapPin, Building2, Trash2, Edit3, PhoneCall, Plus, User } from 'lucide-react'
import { Client } from '../hooks/useClients'

interface ClientsListModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  onDelete: (id: string) => void
  onEdit: (client: Client) => void
  onAdd?: () => void
  onToggleFavorite: (id: string) => void
  onSelectClient?: (client: Client) => void
  selectionMode?: boolean
}

const categoryConfig: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  privato: { label: 'Privato', emoji: '\u{1F464}', bg: 'bg-blue-50', text: 'text-blue-600' },
  azienda: { label: 'Azienda', emoji: '\u{1F3E2}', bg: 'bg-violet-50', text: 'text-violet-600' },
  condominio: { label: 'Condominio', emoji: '\u{1F3D8}\uFE0F', bg: 'bg-amber-50', text: 'text-amber-600' },
  ente_pubblico: { label: 'Ente Pubblico', emoji: '\u{1F3DB}\uFE0F', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  altro: { label: 'Altro', emoji: '\u{1F4CB}', bg: 'bg-slate-50', text: 'text-slate-600' },
}

export default function ClientsListModal({ isOpen, onClose, clients, onDelete, onEdit, onAdd, onToggleFavorite, onSelectClient, selectionMode }: ClientsListModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  let filtered = clients.filter(c => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (!c.name.toLowerCase().includes(term) && !c.company.toLowerCase().includes(term) &&
          !c.phone.includes(term) && !c.email.toLowerCase().includes(term) &&
          !c.city.toLowerCase().includes(term) && !c.address.toLowerCase().includes(term)) return false
    }
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false
    if (showFavoritesOnly && !c.is_favorite) return false
    return true
  })

  // Sort: favorites first, then alphabetical
  filtered = [...filtered].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1
    if (!a.is_favorite && b.is_favorite) return 1
    return a.name.localeCompare(b.name)
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
    setDeleteConfirmId(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {selectionMode ? 'Seleziona Cliente' : 'Rubrica Clienti'}
                </h2>
                <p className="text-xs text-slate-400">{clients.length} clienti registrati</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAdd && !selectionMode && (
                <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-95 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aggiungi</span>
                </button>
              )}
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="px-5 sm:px-6 py-3 border-b border-slate-100/80 space-y-2.5 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, azienda, telefono, email, citta..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:outline-none transition-all" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500" title="Cancella ricerca">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} title="Filtra per categoria"
                className="px-3 py-1.5 bg-slate-50/80 text-slate-600 rounded-lg border border-slate-200/60 focus:border-teal-300 focus:outline-none text-xs">
                <option value="all">Tutte le categorie</option>
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  showFavoritesOnly ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-slate-50/80 text-slate-400 border border-slate-200/60 hover:text-slate-600'
                }`}>
                <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400' : ''}`} />
                Preferiti
              </button>
              <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} risultati</span>
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  {clients.length === 0 ? 'Nessun cliente registrato' : 'Nessun cliente con questi filtri'}
                </p>
                {clients.length === 0 && onAdd && (
                  <button onClick={onAdd}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" />
                    Aggiungi il primo cliente
                  </button>
                )}
              </div>
            ) : (
              filtered.map((client) => {
                const cat = categoryConfig[client.category] || categoryConfig.altro
                return (
                  <motion.div key={client.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`group bg-white/70 hover:bg-white/90 backdrop-blur-lg rounded-xl border border-slate-200/50 transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 ${
                      selectionMode ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => selectionMode && onSelectClient?.(client)}
                  >
                    <div className="p-3.5 sm:p-4">
                      {/* Top row: name + category + actions */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-lg ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-base">{cat.emoji}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-semibold text-slate-800 truncate">{client.name}</h3>
                              {client.is_favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                            </div>
                            {client.company && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" /> {client.company}
                              </p>
                            )}
                          </div>
                        </div>
                        {!selectionMode && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${cat.bg} ${cat.text}`}>
                              {cat.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contact info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2.5">
                        {client.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>
                        )}
                        {client.city && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}{client.province ? ` (${client.province})` : ''}</span>
                        )}
                      </div>

                      {/* Actions */}
                      {!selectionMode && (
                        <div className="flex gap-1.5 flex-wrap">
                          {client.phone && (
                            <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/60 text-teal-600 text-xs font-medium flex items-center gap-1 transition-all">
                              <PhoneCall className="w-3 h-3" /> Chiama
                            </a>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); onEdit(client) }}
                            className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200/60 text-violet-600 text-xs font-medium flex items-center gap-1 transition-all">
                            <Edit3 className="w-3 h-3" /> Modifica
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(client.id) }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                              client.is_favorite ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-amber-600' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-500'
                            }`}>
                            <Star className={`w-3 h-3 ${client.is_favorite ? 'fill-amber-400' : ''}`} />
                            {client.is_favorite ? 'Preferito' : 'Aggiungi'}
                          </button>

                          {deleteConfirmId === client.id ? (
                            <div className="flex gap-1 ml-auto">
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }} disabled={deletingId === client.id}
                                className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-medium transition-all disabled:opacity-50">
                                {deletingId === client.id ? '...' : 'Conferma'}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null) }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium transition-all">
                                No
                              </button>
                            </div>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(client.id) }}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-400 text-xs font-medium flex items-center gap-1 transition-all ml-auto">
                              <Trash2 className="w-3 h-3" /> Elimina
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
