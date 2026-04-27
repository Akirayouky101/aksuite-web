'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Eye, EyeOff, Copy, Trash2, Pencil, Save, Loader2,
  Monitor, Server, HardDrive, Mail, Router, Network, Video, Printer,
  Shield, Cpu, Star, ChevronRight
} from 'lucide-react'
import { useInfrastructure, InfrastructureItem, InfraType } from '../hooks/useInfrastructure'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<InfraType, { label: string; icon: React.ElementType; gradient: string }> = {
  PC:        { label: 'PC / Workstation', icon: Monitor,   gradient: 'from-sky-400 to-sky-600' },
  Server:    { label: 'Server',           icon: Server,    gradient: 'from-violet-500 to-violet-700' },
  NAS:       { label: 'NAS / Storage',    icon: HardDrive, gradient: 'from-emerald-400 to-emerald-600' },
  Email:     { label: 'Email / SMTP',     icon: Mail,      gradient: 'from-amber-400 to-amber-600' },
  Router:    { label: 'Router',           icon: Router,    gradient: 'from-orange-400 to-orange-600' },
  Switch:    { label: 'Switch',           icon: Network,   gradient: 'from-cyan-400 to-cyan-600' },
  NVR:       { label: 'NVR / Videosorv.', icon: Video,     gradient: 'from-rose-400 to-rose-600' },
  DVR:       { label: 'DVR',              icon: Video,     gradient: 'from-pink-400 to-pink-600' },
  Firewall:  { label: 'Firewall',         icon: Shield,    gradient: 'from-red-400 to-red-600' },
  Stampante: { label: 'Stampante',        icon: Printer,   gradient: 'from-indigo-400 to-indigo-600' },
  Altro:     { label: 'Altro',            icon: Cpu,       gradient: 'from-slate-400 to-slate-600' },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as InfraType[]

const EMPTY_FORM = (): Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  type: 'PC', name: '', hostname: '', ip_address: '', mac_address: '',
  location: '', username: '', password: '', secondary_username: '',
  secondary_password: '', port: '', domain: '', os_version: '',
  serial_number: '', notes: '', isFavorite: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// CopyBtn
// ─────────────────────────────────────────────────────────────────────────────
function CopyBtn({ text, id, copiedId, onCopy }: {
  text: string; id: string; copiedId: string | null; onCopy: (t: string, id: string) => void
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onCopy(text, id) }}
      className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
    >
      {copiedId === id
        ? <span className="text-green-500 text-[10px] font-bold">✓</span>
        : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
}

type ModalMode = { mode: 'add' } | { mode: 'edit'; item: InfrastructureItem }

export default function InfrastructurePanel({ isOpen, onClose }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = useInfrastructure()

  const [searchQuery, setSearchQuery]   = useState('')
  const [filterType, setFilterType]     = useState<InfraType | 'Tutti'>('Tutti')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const [modal, setModal] = useState<ModalMode | null>(null)
  const [form, setForm] = useState(EMPTY_FORM())
  const [saving, setSaving] = useState(false)
  const [visiblePwd, setVisiblePwd] = useState<Set<string>>(new Set())
  const [visiblePwd2, setVisiblePwd2] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFormPwd, setShowFormPwd] = useState(false)
  const [showFormPwd2, setShowFormPwd2] = useState(false)

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleVis = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return items.filter(item => {
      if (filterType !== 'Tutti' && item.type !== filterType) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.hostname.toLowerCase().includes(q) ||
        item.ip_address.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        item.os_version.toLowerCase().includes(q) ||
        item.serial_number.toLowerCase().includes(q) ||
        TYPE_CONFIG[item.type].label.toLowerCase().includes(q)
      )
    })
  }, [items, searchQuery, filterType])

  // Group by type
  const grouped = useMemo(() => {
    const map = new Map<InfraType, InfrastructureItem[]>()
    for (const t of ALL_TYPES) map.set(t, [])
    for (const item of filtered) map.get(item.type)!.push(item)
    return map
  }, [filtered])

  const usedTypes = ALL_TYPES.filter(t => (grouped.get(t)?.length ?? 0) > 0)

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const openAdd = (type?: InfraType) => {
    setForm({ ...EMPTY_FORM(), type: type || 'PC' })
    setShowFormPwd(false)
    setShowFormPwd2(false)
    setModal({ mode: 'add' })
  }

  const openEdit = (item: InfrastructureItem) => {
    setForm({
      type: item.type, name: item.name, hostname: item.hostname,
      ip_address: item.ip_address, mac_address: item.mac_address,
      location: item.location, username: item.username, password: item.password,
      secondary_username: item.secondary_username, secondary_password: item.secondary_password,
      port: item.port, domain: item.domain, os_version: item.os_version,
      serial_number: item.serial_number, notes: item.notes, isFavorite: item.isFavorite,
    })
    setShowFormPwd(false)
    setShowFormPwd2(false)
    setModal({ mode: 'edit', item })
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal?.mode === 'edit') {
      await updateItem(modal.item.id, form)
    } else {
      await addItem(form)
    }
    setSaving(false)
    setModal(null)
  }

  // ── Input helpers ──────────────────────────────────────────────────────────
  const inp  = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-slate-400 focus:outline-none'
  const lbl  = 'block text-xs font-medium text-slate-500 mb-1'
  const f    = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  // ── Type-specific fields config ─────────────────────────────────────────────
  const showNetwork = ['PC', 'Server', 'NAS', 'Router', 'Switch', 'NVR', 'DVR', 'Firewall', 'Stampante', 'Altro'].includes(form.type)
  const showEmail   = form.type === 'Email'
  const showOS      = ['PC', 'Server'].includes(form.type)
  const showDual    = ['PC', 'Server', 'NAS', 'Router', 'Switch', 'NVR', 'DVR', 'Firewall'].includes(form.type)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[55] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col overflow-hidden shadow-xl"
            style={{ maxHeight: '90vh' }}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow">
                    <Server className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 leading-none">Infrastruttura</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{items.length} dispositivi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAdd()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cerca dispositivo…"
                  className="w-full bg-slate-100 rounded-xl pl-8 pr-8 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Type filter */}
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {(['Tutti', ...ALL_TYPES] as const).map(t => {
                  const active = filterType === t
                  const cfg = t !== 'Tutti' ? TYPE_CONFIG[t] : null
                  return (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {cfg && (
                        <div className={`w-3 h-3 rounded bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                          <cfg.icon className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {t === 'Tutti' ? 'Tutti' : cfg?.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── List ────────────────────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Server className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
                    {searchQuery ? 'Nessun risultato' : 'Nessun dispositivo'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'Prova con altri termini' : 'Aggiungi il primo dispositivo'}
                  </p>
                </div>
              ) : (
                usedTypes.map((type, sectionIdx) => {
                  const cfg = TYPE_CONFIG[type]
                  const typeItems = grouped.get(type)!
                  return (
                    <div key={type}>
                      {/* Section label */}
                      <div className={`flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 ${sectionIdx > 0 ? 'border-t border-slate-100' : ''}`}>
                        <div className={`w-5 h-5 rounded bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                          <cfg.icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{cfg.label}</span>
                        <span className="text-xs text-slate-400 ml-auto">{typeItems.length}</span>
                      </div>

                      {/* Rows */}
                      {typeItems.map((item, idx) => {
                        const isExp    = expandedItem === item.id
                        const subtitle = item.ip_address || item.hostname || item.location || '—'
                        const hasMore  = idx < typeItems.length - 1 || isExp

                        type FieldDef = { label: string; value: string; id: string; mono: boolean }
                        const fields: FieldDef[] = [
                          item.ip_address    && { label: 'IP',        value: item.ip_address,    id: `${item.id}-ip`,   mono: true  },
                          item.hostname      && { label: 'Hostname',  value: item.hostname,       id: `${item.id}-host`, mono: true  },
                          item.domain        && { label: 'Dominio',   value: item.domain,         id: `${item.id}-dom`,  mono: true  },
                          item.mac_address   && { label: 'MAC',       value: item.mac_address,    id: `${item.id}-mac`,  mono: true  },
                          item.port          && { label: 'Porta',     value: item.port,           id: `${item.id}-port`, mono: true  },
                          item.os_version    && { label: 'OS',        value: item.os_version,     id: `${item.id}-os`,   mono: false },
                          item.serial_number && { label: 'S/N',       value: item.serial_number,  id: `${item.id}-sn`,   mono: true  },
                          item.location      && { label: 'Posizione', value: item.location,       id: `${item.id}-loc`,  mono: false },
                        ].filter((x): x is FieldDef => !!x)

                        return (
                          <div key={item.id} className="bg-white">
                            {/* Row */}
                            <button
                              onClick={() => setExpandedItem(isExp ? null : item.id)}
                              className={`w-full flex items-center px-4 py-3 text-left hover:bg-slate-50/80 transition-colors ${hasMore ? 'border-b border-slate-100' : ''}`}
                            >
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm mr-3 flex-shrink-0`}>
                                <cfg.icon className="w-[18px] h-[18px] text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {item.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                  <span className="text-sm font-semibold text-slate-800 truncate">{item.name}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">{subtitle}</span>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-300 flex-shrink-0 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Expanded detail */}
                            <AnimatePresence>
                              {isExp && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 space-y-1.5">
                                    {/* Info fields */}
                                    {fields.map(fld => (
                                      <div key={fld.id} className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">{fld.label}</span>
                                        <code className={`text-xs flex-1 truncate ${fld.mono ? 'font-mono text-slate-700' : 'text-slate-700'}`}>{fld.value}</code>
                                        <CopyBtn text={fld.value} id={fld.id} copiedId={copiedId} onCopy={copy} />
                                      </div>
                                    ))}

                                    {/* Credentials */}
                                    {(item.username || item.password || item.secondary_username || item.secondary_password) && (
                                      <div className={`space-y-1.5 ${fields.length > 0 ? 'pt-1.5 mt-1 border-t border-slate-200' : ''}`}>
                                        {item.username && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">Utente</span>
                                            <code className="text-xs font-mono text-indigo-700 flex-1 truncate">{item.username}</code>
                                            <CopyBtn text={item.username} id={`${item.id}-user`} copiedId={copiedId} onCopy={copy} />
                                          </div>
                                        )}
                                        {item.password && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">Password</span>
                                            <code className="text-xs font-mono text-violet-700 flex-1">
                                              {visiblePwd.has(item.id) ? item.password : '••••••••'}
                                            </code>
                                            <button onClick={e => { e.stopPropagation(); toggleVis(item.id, visiblePwd, setVisiblePwd) }} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                              {visiblePwd.has(item.id) ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                                            </button>
                                            <CopyBtn text={item.password} id={`${item.id}-pwd`} copiedId={copiedId} onCopy={copy} />
                                          </div>
                                        )}
                                        {item.secondary_username && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">Utente 2</span>
                                            <code className="text-xs font-mono text-indigo-700 flex-1 truncate">{item.secondary_username}</code>
                                            <CopyBtn text={item.secondary_username} id={`${item.id}-user2`} copiedId={copiedId} onCopy={copy} />
                                          </div>
                                        )}
                                        {item.secondary_password && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">Password 2</span>
                                            <code className="text-xs font-mono text-violet-700 flex-1">
                                              {visiblePwd2.has(item.id) ? item.secondary_password : '••••••••'}
                                            </code>
                                            <button onClick={e => { e.stopPropagation(); toggleVis(item.id, visiblePwd2, setVisiblePwd2) }} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                              {visiblePwd2.has(item.id) ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                                            </button>
                                            <CopyBtn text={item.secondary_password} id={`${item.id}-pwd2`} copiedId={copiedId} onCopy={copy} />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {item.notes && (
                                      <p className="text-xs text-slate-400 italic pt-1.5 border-t border-slate-200">{item.notes}</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                      <button
                                        onClick={e => { e.stopPropagation(); updateItem(item.id, { isFavorite: !item.isFavorite }) }}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                          item.isFavorite ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50'
                                        }`}
                                      >
                                        <Star className={`w-3 h-3 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                                        {item.isFavorite ? 'Preferito' : 'Preferiti'}
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); openEdit(item) }}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors"
                                      >
                                        <Pencil className="w-3 h-3" /> Modifica
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); setDeleteConfirm(item.id) }}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-white text-red-500 border-red-200 hover:bg-red-50 transition-colors ml-auto"
                                      >
                                        <Trash2 className="w-3 h-3" /> Elimina
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
                  )
                })
              )}
            </div>
          </motion.div>

          {/* ── Add/Edit Modal ───────────────────────────────────────────── */}
          <AnimatePresence>
            {modal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[65] bg-black/50 flex items-center justify-center p-4"
                onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
                  style={{ maxHeight: '90vh' }}
                >
                  {/* Modal header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cfg = TYPE_CONFIG[form.type]
                        return (
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow`}>
                            <cfg.icon className="w-4 h-4 text-white" />
                          </div>
                        )
                      })()}
                      <h3 className="text-base font-bold text-slate-800">
                        {modal.mode === 'add' ? 'Nuovo dispositivo' : `Modifica — ${modal.item.name}`}
                      </h3>
                    </div>
                    <button
                      onClick={() => setModal(null)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="p-5 overflow-y-auto space-y-4">
                    {/* Tipo */}
                    <div>
                      <label className={lbl}>Tipo *</label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_TYPES.map(t => {
                          const cfg = TYPE_CONFIG[t]
                          const active = form.type === t
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => f('type', t)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                                <cfg.icon className="w-2 h-2 text-white" />
                              </div>
                              {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Nome + Posizione */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Nome *</label>
                        <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="es. PC-MARIO, SRV-001" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Posizione</label>
                        <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="es. Ufficio, Sala server" className={inp} />
                      </div>
                    </div>

                    {/* Network */}
                    {showNetwork && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Indirizzo IP</label>
                          <input value={form.ip_address} onChange={e => f('ip_address', e.target.value)} placeholder="192.168.1.x" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Hostname</label>
                          <input value={form.hostname} onChange={e => f('hostname', e.target.value)} placeholder="nome-pc" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>MAC Address</label>
                          <input value={form.mac_address} onChange={e => f('mac_address', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Porta</label>
                          <input value={form.port} onChange={e => f('port', e.target.value)} placeholder="es. 22, 443, 8080" className={inp} />
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {showEmail && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Server SMTP/IMAP</label>
                          <input value={form.hostname} onChange={e => f('hostname', e.target.value)} placeholder="smtp.esempio.com" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Porta</label>
                          <input value={form.port} onChange={e => f('port', e.target.value)} placeholder="465, 587, 993…" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Indirizzo email</label>
                          <input value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="info@azienda.it" className={inp} />
                        </div>
                      </div>
                    )}

                    {/* OS */}
                    {showOS && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Dominio Windows / AD</label>
                          <input value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="AZIENDA.LOCAL" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Sistema operativo</label>
                          <input value={form.os_version} onChange={e => f('os_version', e.target.value)} placeholder="Windows 11 Pro, Ubuntu 22…" className={inp} />
                        </div>
                      </div>
                    )}

                    {/* Seriale */}
                    <div>
                      <label className={lbl}>Numero seriale</label>
                      <input value={form.serial_number} onChange={e => f('serial_number', e.target.value)} placeholder="S/N del dispositivo" className={inp} />
                    </div>

                    {/* Credenziali */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Credenziali principali</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Username</label>
                          <input value={form.username} onChange={e => f('username', e.target.value)} placeholder="admin, Administrator…" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Password</label>
                          <div className="relative">
                            <input
                              type={showFormPwd ? 'text' : 'password'}
                              value={form.password}
                              onChange={e => f('password', e.target.value)}
                              className={`${inp} pr-9`}
                            />
                            <button type="button" onClick={() => setShowFormPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                              {showFormPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {showDual && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Credenziali secondarie</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Username 2</label>
                            <input value={form.secondary_username} onChange={e => f('secondary_username', e.target.value)} placeholder="utente locale, VPN…" className={inp} />
                          </div>
                          <div>
                            <label className={lbl}>Password 2</label>
                            <div className="relative">
                              <input
                                type={showFormPwd2 ? 'text' : 'password'}
                                value={form.secondary_password}
                                onChange={e => f('secondary_password', e.target.value)}
                                className={`${inp} pr-9`}
                              />
                              <button type="button" onClick={() => setShowFormPwd2(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                                {showFormPwd2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    <div>
                      <label className={lbl}>Note</label>
                      <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="Info aggiuntive, istruzioni…" className={inp} />
                    </div>

                    {/* Preferito */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isFavorite} onChange={e => f('isFavorite', e.target.checked)} className="accent-amber-400 w-4 h-4" />
                      <span className="text-sm text-slate-600">Aggiungi ai preferiti</span>
                    </label>
                  </div>

                  {/* Modal footer */}
                  <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                    <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      Annulla
                    </button>
                    <button
                      onClick={save}
                      disabled={saving || !form.name.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-slate-700 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Salva
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Delete Confirm ───────────────────────────────────────────── */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Elimina dispositivo</h3>
                  <p className="text-sm text-slate-500 mb-5">Questa operazione è irreversibile.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      Annulla
                    </button>
                    <button
                      onClick={async () => { await deleteItem(deleteConfirm); setDeleteConfirm(null) }}
                      className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                    >
                      Elimina
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
