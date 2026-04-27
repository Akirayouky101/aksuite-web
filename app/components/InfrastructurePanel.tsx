'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Eye, EyeOff, Copy, Trash2, Pencil, Save, Loader2,
  Monitor, Server, HardDrive, Mail, Router, Network, Video, Printer,
  Shield, Cpu, Star, ChevronDown, ChevronUp, MapPin, Globe, Hash,
  User, Lock, Wifi
} from 'lucide-react'
import { useInfrastructure, InfrastructureItem, InfraType } from '../hooks/useInfrastructure'
import { encryptPassword } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Config per tipo
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<InfraType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  PC:        { label: 'PC / Workstation', icon: Monitor,   color: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-200' },
  Server:    { label: 'Server',           icon: Server,    color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200' },
  NAS:       { label: 'NAS / Storage',    icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  Email:     { label: 'Email / SMTP',     icon: Mail,      color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  Router:    { label: 'Router',           icon: Router,    color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200' },
  Switch:    { label: 'Switch',           icon: Network,   color: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200' },
  NVR:       { label: 'NVR / Videosorv.', icon: Video,     color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200' },
  DVR:       { label: 'DVR',              icon: Video,     color: 'text-pink-600',    bg: 'bg-pink-50',     border: 'border-pink-200' },
  Firewall:  { label: 'Firewall',         icon: Shield,    color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  Stampante: { label: 'Stampante',        icon: Printer,   color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  Altro:     { label: 'Altro',            icon: Cpu,       color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as InfraType[]

// ─────────────────────────────────────────────────────────────────────────────
// Form vuoto
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = (): Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  type: 'PC',
  name: '',
  hostname: '',
  ip_address: '',
  mac_address: '',
  location: '',
  username: '',
  password: '',
  secondary_username: '',
  secondary_password: '',
  port: '',
  domain: '',
  os_version: '',
  serial_number: '',
  notes: '',
  isFavorite: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function CopyBtn({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (t: string, id: string) => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onCopy(text, id) }} className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0">
      {copiedId === id
        ? <span className="text-green-500 text-xs font-bold">✓</span>
        : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  )
}

function SecretField({ value, visible, onToggle, onCopy, copyId, copiedId }: {
  value: string; visible: boolean; onToggle: () => void; onCopy: (t: string, id: string) => void; copyId: string; copiedId: string | null
}) {
  return (
    <div className="flex items-center gap-1">
      <code className="text-sm font-mono text-slate-700">{visible ? value : '••••••••'}</code>
      <button onClick={(e) => { e.stopPropagation(); onToggle() }} className="p-1 hover:bg-slate-200 rounded transition-colors">
        {visible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      <CopyBtn text={value} id={copyId} copiedId={copiedId} onCopy={onCopy} />
    </div>
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

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<InfraType | 'Tutti'>('Tutti')
  const [favOnly, setFavOnly] = useState(false)
  const [expandedType, setExpandedType] = useState<InfraType | null>(null)

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
      if (favOnly && !item.isFavorite) return false
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
  }, [items, searchQuery, filterType, favOnly])

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
  const inp  = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-indigo-400 focus:outline-none'
  const lbl  = 'block text-xs font-semibold text-slate-500 mb-1'
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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 w-full max-w-5xl flex flex-col overflow-hidden"
            style={{ maxHeight: '92vh' }}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="relative z-10 px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Infrastruttura Aziendale</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{items.length} dispositivi · {filtered.length} visibili</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAdd()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-semibold rounded-xl hover:from-slate-600 hover:to-slate-800 transition-all shadow shadow-slate-900/20"
                  >
                    <Plus size={15} />
                    Aggiungi
                  </button>
                  <button
                    onClick={onClose}
                    title="Chiudi"
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cerca per nome, IP, hostname, dominio, posizione, S/N…"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:border-indigo-400 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center mt-3">
                <button
                  onClick={() => setFavOnly(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    favOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${favOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  Solo preferiti
                </button>
                {(['Tutti', ...ALL_TYPES] as const).map(t => {
                  const active = filterType === t
                  const cfg = t !== 'Tutti' ? TYPE_CONFIG[t] : null
                  return (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        active
                          ? cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cfg && <cfg.icon className="w-3 h-3" />}
                      {t === 'Tutti' ? 'Tutti' : cfg?.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── List ───────────────────────────────────────────────────── */}
            <div className="relative z-10 overflow-y-auto flex-1 p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Server className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-1">
                    {searchQuery ? 'Nessun risultato' : 'Nessun dispositivo salvato'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {searchQuery ? 'Prova con termini diversi' : 'Aggiungi il primo dispositivo con il pulsante in alto'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {usedTypes.map(type => {
                    const cfg = TYPE_CONFIG[type]
                    const typeItems = grouped.get(type)!
                    const expanded = expandedType === type || !!searchQuery || filterType !== 'Tutti'

                    return (
                      <div key={type}>
                        {/* Section header */}
                        <button
                          onClick={() => setExpandedType(expanded && !searchQuery && filterType === 'Tutti' ? null : type)}
                          className="w-full flex items-center justify-between mb-2 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                              <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{cfg.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              {typeItems.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); openAdd(type) }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.color} border ${cfg.border} ${cfg.bg} hover:brightness-95 transition-all`}
                            >
                              <Plus className="w-3 h-3" /> Aggiungi
                            </button>
                            {!searchQuery && filterType === 'Tutti' && (
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                                {expanded
                                  ? <ChevronUp className={`w-3.5 h-3.5 ${cfg.color}`} />
                                  : <ChevronDown className={`w-3.5 h-3.5 ${cfg.color}`} />}
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Item cards */}
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2">
                                {typeItems.map(item => (
                                  <div
                                    key={item.id}
                                    className={`bg-white border rounded-xl p-4 hover:border-slate-300 hover:bg-slate-50/50 transition-all ${cfg.border}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Icon */}
                                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        {/* Title */}
                                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                                          {item.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                          <span className="text-sm font-bold text-slate-800">{item.name}</span>
                                          {item.location && (
                                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                              <MapPin className="w-2.5 h-2.5" /> {item.location}
                                            </span>
                                          )}
                                          {item.os_version && (
                                            <span className="text-xs text-slate-400 font-mono">{item.os_version}</span>
                                          )}
                                        </div>

                                        {/* Fields grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                          {item.ip_address && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">IP</span>
                                              <code className="text-xs font-mono text-slate-700 flex-1 truncate">{item.ip_address}</code>
                                              <CopyBtn text={item.ip_address} id={`${item.id}-ip`} copiedId={copiedId} onCopy={copy} />
                                            </div>
                                          )}
                                          {item.hostname && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">HOST</span>
                                              <code className="text-xs font-mono text-slate-700 flex-1 truncate">{item.hostname}</code>
                                              <CopyBtn text={item.hostname} id={`${item.id}-host`} copiedId={copiedId} onCopy={copy} />
                                            </div>
                                          )}
                                          {item.domain && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">DOM</span>
                                              <code className="text-xs font-mono text-slate-700 flex-1 truncate">{item.domain}</code>
                                              <CopyBtn text={item.domain} id={`${item.id}-domain`} copiedId={copiedId} onCopy={copy} />
                                            </div>
                                          )}
                                          {item.port && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">PORT</span>
                                              <code className="text-xs font-mono text-slate-700">{item.port}</code>
                                            </div>
                                          )}
                                          {item.mac_address && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">MAC</span>
                                              <code className="text-xs font-mono text-slate-700 flex-1 truncate">{item.mac_address}</code>
                                              <CopyBtn text={item.mac_address} id={`${item.id}-mac`} copiedId={copiedId} onCopy={copy} />
                                            </div>
                                          )}
                                          {item.serial_number && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8 flex-shrink-0">S/N</span>
                                              <code className="text-xs font-mono text-slate-700 flex-1 truncate">{item.serial_number}</code>
                                              <CopyBtn text={item.serial_number} id={`${item.id}-sn`} copiedId={copiedId} onCopy={copy} />
                                            </div>
                                          )}
                                        </div>

                                        {/* Credentials */}
                                        {(item.username || item.password || item.secondary_username || item.secondary_password) && (
                                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                            {item.username && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-400 w-16 flex-shrink-0">Utente</span>
                                                <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 flex-1 min-w-0">
                                                  <code className="text-xs font-mono text-indigo-700 flex-1 truncate">{item.username}</code>
                                                  <CopyBtn text={item.username} id={`${item.id}-user`} copiedId={copiedId} onCopy={copy} />
                                                </div>
                                              </div>
                                            )}
                                            {item.password && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-400 w-16 flex-shrink-0">Password</span>
                                                <div className="flex items-center gap-1 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1 flex-1 min-w-0">
                                                  <code className="text-xs font-mono text-violet-700 flex-1">
                                                    {visiblePwd.has(item.id) ? item.password : '••••••••'}
                                                  </code>
                                                  <button onClick={e => { e.stopPropagation(); toggleVis(item.id, visiblePwd, setVisiblePwd) }} className="p-0.5 hover:bg-violet-100 rounded transition-colors">
                                                    {visiblePwd.has(item.id) ? <EyeOff className="w-3 h-3 text-violet-400" /> : <Eye className="w-3 h-3 text-violet-400" />}
                                                  </button>
                                                  <CopyBtn text={item.password} id={`${item.id}-pwd`} copiedId={copiedId} onCopy={copy} />
                                                </div>
                                              </div>
                                            )}
                                            {item.secondary_username && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-400 w-16 flex-shrink-0">Utente 2</span>
                                                <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 flex-1 min-w-0">
                                                  <code className="text-xs font-mono text-indigo-700 flex-1 truncate">{item.secondary_username}</code>
                                                  <CopyBtn text={item.secondary_username} id={`${item.id}-user2`} copiedId={copiedId} onCopy={copy} />
                                                </div>
                                              </div>
                                            )}
                                            {item.secondary_password && (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-400 w-16 flex-shrink-0">Password 2</span>
                                                <div className="flex items-center gap-1 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1 flex-1 min-w-0">
                                                  <code className="text-xs font-mono text-violet-700 flex-1">
                                                    {visiblePwd2.has(item.id) ? item.secondary_password : '••••••••'}
                                                  </code>
                                                  <button onClick={e => { e.stopPropagation(); toggleVis(item.id, visiblePwd2, setVisiblePwd2) }} className="p-0.5 hover:bg-violet-100 rounded transition-colors">
                                                    {visiblePwd2.has(item.id) ? <EyeOff className="w-3 h-3 text-violet-400" /> : <Eye className="w-3 h-3 text-violet-400" />}
                                                  </button>
                                                  <CopyBtn text={item.secondary_password} id={`${item.id}-pwd2`} copiedId={copiedId} onCopy={copy} />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {item.notes && (
                                          <p className="mt-2 text-xs text-slate-400 italic border-t border-slate-100 pt-2">{item.notes}</p>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                                        <button
                                          onClick={() => updateItem(item.id, { isFavorite: !item.isFavorite })}
                                          className={`p-1.5 rounded-lg border transition-all ${
                                            item.isFavorite
                                              ? 'bg-amber-50 border-amber-200'
                                              : 'bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                                          }`}
                                          title={item.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                                        >
                                          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                                        </button>
                                        <button
                                          onClick={() => openEdit(item)}
                                          className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all"
                                          title="Modifica"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500" />
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm(item.id)}
                                          className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
                                          title="Elimina"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {modal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[65] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 w-full max-w-2xl flex flex-col overflow-hidden"
                  style={{ maxHeight: '90vh' }}
                >
                  {/* Modal header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 shrink-0">
                    <div className="flex items-center gap-3">
                      {modal.mode === 'add' ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                      ) : (() => { const cfg = TYPE_CONFIG[form.type]; return (
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                          <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                      )})()}
                      <h3 className="text-base font-bold text-slate-800">
                        {modal.mode === 'add' ? 'Nuovo dispositivo' : `Modifica — ${modal.item.name}`}
                      </h3>
                    </div>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="p-6 overflow-y-auto space-y-4">
                    {/* Tipo */}
                    <div>
                      <label className={lbl}>Tipo dispositivo *</label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_TYPES.map(t => {
                          const cfg = TYPE_CONFIG[t]
                          const active = form.type === t
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => f('type', t)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <cfg.icon size={12} />
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
                        <label className={lbl}>Posizione / Stanza</label>
                        <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="es. Ufficio, Sala server" className={inp} />
                      </div>
                    </div>

                    {/* Rete */}
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

                    {/* Email specifici */}
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
                          <label className={lbl}>Dominio / Indirizzo email</label>
                          <input value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="info@azienda.it" className={inp} />
                        </div>
                      </div>
                    )}

                    {/* Dominio Windows / AD */}
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

                    {/* Credenziali primarie */}
                    <div className="pt-1">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Credenziali principali</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Username / Utente</label>
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
                              {showFormPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Credenziali secondarie */}
                    {showDual && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Credenziali secondarie (opzionale)</p>
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
                                {showFormPwd2 ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  <div className="px-6 py-4 border-t border-slate-200/60 bg-white/60 flex justify-end gap-2 shrink-0">
                    <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annulla</button>
                    <button
                      onClick={save}
                      disabled={saving || !form.name.trim()}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-semibold disabled:opacity-50 shadow shadow-slate-900/20 hover:from-slate-600 hover:to-slate-800 transition-all"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Salva dispositivo
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Delete Confirm ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 w-full max-w-sm p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Elimina dispositivo</h3>
                  <p className="text-sm text-slate-500 mb-5">Questa operazione è irreversibile.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annulla</button>
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
