'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Truck, Search, Star, Phone, Mail, Globe, MapPin, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Supplier } from '../hooks/useSuppliers'

interface SuppliersListModalProps {
  isOpen: boolean
  onClose: () => void
  suppliers: Supplier[]
  onAdd: () => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export default function SuppliersListModal({ isOpen, onClose, suppliers, onAdd, onEdit, onDelete, onToggleFavorite }: SuppliersListModalProps) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!isOpen) return null

  const categories = Array.from(new Set(suppliers.map(s => s.category))).sort()

  const filtered = suppliers.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
    const matchCat = filterCategory === 'all' || s.category === filterCategory
    return matchSearch && matchCat
  }).sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1
    if (!a.is_favorite && b.is_favorite) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Fornitori</h2>
                  <p className="text-xs text-slate-400">{suppliers.length} fornitori registrati</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onAdd} title="Aggiungi fornitore" className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/60 text-teal-600 text-xs font-bold transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />Nuovo
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/30 flex gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca fornitore..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} title="Filtra per categoria"
                className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-600">
                <option value="all">Tutte le categorie</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">{'\u{1F4E6}'}</div>
                  <p className="text-slate-400 text-lg">Nessun fornitore trovato</p>
                  <button onClick={onAdd} className="mt-4 px-4 py-2 rounded-xl bg-teal-50 text-teal-600 text-sm font-bold">Aggiungi il primo</button>
                </div>
              ) : filtered.map(s => {
                const isExpanded = expandedId === s.id
                return (
                  <div key={s.id} className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden hover:shadow-md transition-all">
                    <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{s.name}</h4>
                          {s.is_favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {s.category}{s.contact_name ? ` \u2022 ${s.contact_name}` : ''}{s.city ? ` \u2022 ${s.city}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium flex-shrink-0">{s.category}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 space-y-3">
                            {/* Contact info */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                              {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-teal-600"><Phone className="w-3 h-3" />{s.phone}</a>}
                              {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-teal-600 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{s.email}</a>}
                              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-600 truncate"><Globe className="w-3 h-3 flex-shrink-0" />{s.website}</a>}
                              {s.address && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 flex-shrink-0" />{[s.address, s.city, s.province].filter(Boolean).join(', ')}</div>}
                            </div>
                            {s.vat_number && <p className="text-[10px] text-slate-400">P.IVA: {s.vat_number}</p>}
                            {s.payment_terms && <p className="text-[10px] text-slate-400">Pagamento: {s.payment_terms}</p>}
                            {s.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{s.notes}</p>}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <button onClick={() => onToggleFavorite(s.id)} title="Preferito"
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${s.is_favorite ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-slate-50 text-slate-400 border border-slate-200/50'}`}>
                                <Star className={`w-3 h-3 ${s.is_favorite ? 'fill-amber-400' : ''}`} />{s.is_favorite ? 'Preferito' : 'Preferito'}
                              </button>
                              <button onClick={() => onEdit(s)} title="Modifica"
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200/50">
                                <Pencil className="w-3 h-3" />Modifica
                              </button>
                              <button onClick={() => { if (confirm(`Eliminare ${s.name}?`)) onDelete(s.id) }} title="Elimina"
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-all flex items-center gap-1 border border-red-200/50">
                                <Trash2 className="w-3 h-3" />Elimina
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
