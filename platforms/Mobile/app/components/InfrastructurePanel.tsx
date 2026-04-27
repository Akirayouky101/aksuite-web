'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Eye, EyeOff, Copy, Trash2, Pencil, Save, Loader2,
  Monitor, Server, HardDrive, Mail, Router, Network, Video, Printer,
  Shield, Cpu, Star, Lock, Globe, Hash,
} from 'lucide-react'
import { useInfrastructure, InfrastructureItem, InfraType } from '../hooks/useInfrastructure'

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<InfraType, {
  label: string
  icon: React.ElementType
  from: string
  to: string
  light: string
  text: string
}> = {
  PC:        { label: 'PC',        icon: Monitor,   from: '#6366f1', to: '#818cf8', light: '#eef2ff', text: '#4338ca' },
  Server:    { label: 'Server',    icon: Server,    from: '#7c3aed', to: '#a78bfa', light: '#f5f3ff', text: '#5b21b6' },
  NAS:       { label: 'NAS',       icon: HardDrive, from: '#059669', to: '#34d399', light: '#ecfdf5', text: '#047857' },
  Email:     { label: 'Email',     icon: Mail,      from: '#d97706', to: '#fbbf24', light: '#fffbeb', text: '#b45309' },
  Router:    { label: 'Router',    icon: Router,    from: '#ea580c', to: '#fb923c', light: '#fff7ed', text: '#c2410c' },
  Switch:    { label: 'Switch',    icon: Network,   from: '#0891b2', to: '#22d3ee', light: '#ecfeff', text: '#0e7490' },
  NVR:       { label: 'NVR',       icon: Video,     from: '#e11d48', to: '#fb7185', light: '#fff1f2', text: '#be123c' },
  DVR:       { label: 'DVR',       icon: Video,     from: '#db2777', to: '#f472b6', light: '#fdf2f8', text: '#9d174d' },
  Firewall:  { label: 'Firewall',  icon: Shield,    from: '#dc2626', to: '#f87171', light: '#fef2f2', text: '#991b1b' },
  Stampante: { label: 'Stampa',    icon: Printer,   from: '#4f46e5', to: '#818cf8', light: '#eef2ff', text: '#3730a3' },
  Altro:     { label: 'Altro',     icon: Cpu,       from: '#475569', to: '#94a3b8', light: '#f8fafc', text: '#334155' },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as InfraType[]

const EMPTY_FORM = (): Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  type: 'PC', name: '', hostname: '', ip_address: '', mac_address: '',
  location: '', username: '', password: '', secondary_username: '',
  secondary_password: '', port: '', domain: '', os_version: '',
  serial_number: '', notes: '', isFavorite: false,
})

// ─── CopyBtn ─────────────────────────────────────────────────────────────────
function CopyBtn({ text, id, copiedId, onCopy, light }: {
  text: string; id: string; copiedId: string | null
  onCopy: (t: string, id: string) => void; light?: string
}) {
  const copied = copiedId === id
  return (
    <button
      onClick={e => { e.stopPropagation(); onCopy(text, id) }}
      style={copied ? { background: '#dcfce7' } : { background: light || '#f1f5f9' }}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
    >
      {copied
        ? <span className="text-green-600 text-[9px] font-black">✓</span>
        : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  )
}

// ─── Props / Types ────────────────────────────────────────────────────────────
interface Props { isOpen: boolean; onClose: () => void }
type ModalMode = { mode: 'add' } | { mode: 'edit'; item: InfrastructureItem }

// ─── Component ───────────────────────────────────────────────────────────────
export default function InfrastructurePanel({ isOpen, onClose }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = useInfrastructure()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType]   = useState<InfraType | 'Tutti'>('Tutti')
  const [detailItem, setDetailItem]   = useState<InfrastructureItem | null>(null)
  const [modal, setModal]             = useState<ModalMode | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM())
  const [saving, setSaving]           = useState(false)
  const [visiblePwd, setVisiblePwd]   = useState<Set<string>>(new Set())
  const [visiblePwd2, setVisiblePwd2] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId]       = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFormPwd, setShowFormPwd]   = useState(false)
  const [showFormPwd2, setShowFormPwd2] = useState(false)

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleVis = (id: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return items.filter(item => {
      if (filterType !== 'Tutti' && item.type !== filterType) return false
      if (!q) return true
      return [item.name, item.hostname, item.ip_address, item.location,
              item.username, item.domain, item.notes, item.os_version,
              item.serial_number, TYPE_CONFIG[item.type].label]
        .some(v => v.toLowerCase().includes(q))
    })
  }, [items, searchQuery, filterType])

  const openAdd = () => { setForm(EMPTY_FORM()); setShowFormPwd(false); setShowFormPwd2(false); setModal({ mode: 'add' }) }
  const openEdit = (item: InfrastructureItem) => {
    setForm({ type: item.type, name: item.name, hostname: item.hostname,
      ip_address: item.ip_address, mac_address: item.mac_address, location: item.location,
      username: item.username, password: item.password, secondary_username: item.secondary_username,
      secondary_password: item.secondary_password, port: item.port, domain: item.domain,
      os_version: item.os_version, serial_number: item.serial_number, notes: item.notes,
      isFavorite: item.isFavorite })
    setShowFormPwd(false); setShowFormPwd2(false)
    setModal({ mode: 'edit', item })
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal?.mode === 'edit') {
      const updated = await updateItem(modal.item.id, form)
      if (detailItem?.id === modal.item.id && updated) setDetailItem(updated)
    } else { await addItem(form) }
    setSaving(false); setModal(null)
  }

  const f = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))
  const inp = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-slate-400 focus:outline-none placeholder-slate-300'
  const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide'

  const showNetwork = ['PC','Server','NAS','Router','Switch','NVR','DVR','Firewall','Stampante','Altro'].includes(form.type)
  const showEmail   = form.type === 'Email'
  const showOS      = ['PC','Server'].includes(form.type)
  const showDual    = ['PC','Server','NAS','Router','Switch','NVR','DVR','Firewall'].includes(form.type)

  if (!isOpen) return null

  return (
    <>
      {/* ── MAIN PANEL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-50 rounded-3xl w-full max-w-5xl flex flex-col overflow-hidden"
              style={{ maxHeight: '92vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
            >
              {/* Top bar */}
              <div className="bg-white px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#1e293b,#475569)' }}>
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-none">Infrastruttura</h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{items.length} dispositivi registrati</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={openAdd}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
                      <Plus className="w-4 h-4" /> Aggiungi
                    </button>
                    <button onClick={onClose} aria-label="Chiudi"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cerca nome, IP, hostname, posizione…"
                    className="w-full bg-slate-100 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} aria-label="Cancella ricerca"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                      <X className="w-3 h-3 text-slate-600" />
                    </button>
                  )}
                </div>

                {/* Type filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                  <button onClick={() => setFilterType('Tutti')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterType === 'Tutti' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    Tutti ({items.length})
                  </button>
                  {ALL_TYPES.map(t => {
                    const c = TYPE_CONFIG[t]
                    const count = items.filter(i => i.type === t).length
                    if (count === 0) return null
                    const active = filterType === t
                    return (
                      <button key={t} onClick={() => setFilterType(t)}
                        style={active ? { background: c.from, color: '#fff' } : { background: c.light, color: c.text }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                        <c.icon className="w-3 h-3" />
                        {c.label} <span className="opacity-70">({count})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cards */}
              <div className="overflow-y-auto flex-1 p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Server className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-500">
                      {searchQuery ? 'Nessun risultato' : 'Nessun dispositivo'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {searchQuery ? `Nessun risultato per "${searchQuery}"` : 'Clicca Aggiungi per iniziare'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filtered.map(item => {
                      const c = TYPE_CONFIG[item.type]
                      return (
                        <motion.button
                          key={item.id}
                          layout
                          onClick={() => setDetailItem(item)}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="text-left rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                        >
                          {/* Gradient top */}
                          <div className="h-20 relative flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                            <c.icon className="w-9 h-9 text-white opacity-90" />
                            {item.isFavorite && (
                              <div className="absolute top-2 right-2">
                                <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                              </div>
                            )}
                            {item.username && (
                              <div className="absolute bottom-2 left-2">
                                <Lock className="w-3 h-3 text-white/50" />
                              </div>
                            )}
                          </div>
                          {/* White bottom */}
                          <div className="bg-white px-3 py-2.5">
                            <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                            <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                              {item.ip_address || item.hostname || item.location || '—'}
                            </p>
                            <div className="mt-1.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: c.light, color: c.text }}>
                                {c.label}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAIL MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailItem && (() => {
          const item = detailItem
          const c = TYPE_CONFIG[item.type]
          interface FD { label: string; value: string; id: string; icon: React.ElementType }
          const infoFields: FD[] = ([
            item.ip_address    ? { label: 'IP',        value: item.ip_address,   id: `d-${item.id}-ip`,   icon: Globe } : null,
            item.hostname      ? { label: 'Hostname',  value: item.hostname,      id: `d-${item.id}-host`, icon: Hash  } : null,
            item.domain        ? { label: 'Dominio',   value: item.domain,        id: `d-${item.id}-dom`,  icon: Globe } : null,
            item.mac_address   ? { label: 'MAC',       value: item.mac_address,   id: `d-${item.id}-mac`,  icon: Network } : null,
            item.port          ? { label: 'Porta',     value: item.port,          id: `d-${item.id}-port`, icon: Hash  } : null,
            item.os_version    ? { label: 'OS',        value: item.os_version,    id: `d-${item.id}-os`,   icon: Monitor } : null,
            item.serial_number ? { label: 'S/N',       value: item.serial_number, id: `d-${item.id}-sn`,   icon: Hash  } : null,
            item.location      ? { label: 'Posizione', value: item.location,      id: `d-${item.id}-loc`,  icon: Globe } : null,
          ] as (FD | null)[]).filter((x): x is FD => x !== null)

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailItem(null)}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-sm flex flex-col overflow-hidden"
                style={{ maxHeight: '88vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
              >
                {/* Gradient header */}
                <div className="relative px-5 pt-6 pb-14"
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                  <button onClick={() => setDetailItem(null)} aria-label="Chiudi"
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <c.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isFavorite && <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 flex-shrink-0" />}
                    <h3 className="text-xl font-black text-white truncate">{item.name}</h3>
                  </div>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.label}</p>
                </div>

                {/* White body pulled up */}
                <div className="relative -mt-8 rounded-t-3xl bg-white flex-1 overflow-y-auto">
                  <div className="p-5 space-y-4">
                    {/* Info */}
                    {infoFields.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100">
                        {infoFields.map((fld, i) => (
                          <div key={fld.id}
                            className={`flex items-center gap-3 px-4 py-3 ${i < infoFields.length - 1 ? 'border-b border-slate-50' : ''}`}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: c.light }}>
                              <fld.icon className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{fld.label}</p>
                              <p className="text-sm font-mono text-slate-800 truncate">{fld.value}</p>
                            </div>
                            <CopyBtn text={fld.value} id={fld.id} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Credentials */}
                    {(item.username || item.password || item.secondary_username || item.secondary_password) && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100">
                        <div className="px-4 py-2.5 border-b border-slate-50"
                          style={{ background: c.light }}>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>
                            Credenziali
                          </p>
                        </div>
                        {item.username && (
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username</p>
                              <p className="text-sm font-mono text-slate-800 truncate">{item.username}</p>
                            </div>
                            <CopyBtn text={item.username} id={`d-${item.id}-user`} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        )}
                        {item.password && (
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</p>
                              <p className="text-sm font-mono text-slate-800">
                                {visiblePwd.has(item.id) ? item.password : '••••••••••'}
                              </p>
                            </div>
                            <button onClick={() => toggleVis(item.id, setVisiblePwd)} aria-label="Mostra password"
                              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                              style={{ background: c.light }}>
                              {visiblePwd.has(item.id)
                                ? <EyeOff className="w-3 h-3" style={{ color: c.text }} />
                                : <Eye className="w-3 h-3" style={{ color: c.text }} />}
                            </button>
                            <CopyBtn text={item.password} id={`d-${item.id}-pwd`} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        )}
                        {item.secondary_username && (
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username 2</p>
                              <p className="text-sm font-mono text-slate-800 truncate">{item.secondary_username}</p>
                            </div>
                            <CopyBtn text={item.secondary_username} id={`d-${item.id}-u2`} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        )}
                        {item.secondary_password && (
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password 2</p>
                              <p className="text-sm font-mono text-slate-800">
                                {visiblePwd2.has(item.id) ? item.secondary_password : '••••••••••'}
                              </p>
                            </div>
                            <button onClick={() => toggleVis(item.id, setVisiblePwd2)} aria-label="Mostra password 2"
                              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                              style={{ background: c.light }}>
                              {visiblePwd2.has(item.id)
                                ? <EyeOff className="w-3 h-3" style={{ color: c.text }} />
                                : <Eye className="w-3 h-3" style={{ color: c.text }} />}
                            </button>
                            <CopyBtn text={item.secondary_password} id={`d-${item.id}-p2`} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <div className="rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Note</p>
                        <p className="text-sm text-slate-600">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateItem(item.id, { isFavorite: !item.isFavorite }).then(u => { if (u) setDetailItem(u) })}
                      className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                      style={item.isFavorite
                        ? { background: '#fef3c7', borderColor: '#fcd34d', color: '#b45309' }
                        : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                      <span className="text-[10px] font-bold">{item.isFavorite ? 'Preferito' : 'Aggiungi'}</span>
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                      style={{ background: c.light, borderColor: c.from + '40', color: c.text }}>
                      <Pencil className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Modifica</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 transition-all hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Elimina</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ── FORM MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) setModal(null) }}
            className="fixed inset-0 z-[65] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg flex flex-col overflow-hidden"
              style={{ maxHeight: '92vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  {(() => {
                    const c = TYPE_CONFIG[form.type]
                    return (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ background: `linear-gradient(135deg,${c.from},${c.to})` }}>
                        <c.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                    )
                  })()}
                  <h3 className="text-base font-black text-slate-900">
                    {modal.mode === 'add' ? 'Nuovo dispositivo' : `Modifica — ${modal.item.name}`}
                  </h3>
                </div>
                <button onClick={() => setModal(null)} aria-label="Chiudi"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Tipo */}
                <div>
                  <label className={lbl}>Tipo *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_TYPES.map(t => {
                      const c = TYPE_CONFIG[t]
                      const active = form.type === t
                      return (
                        <button key={t} type="button" onClick={() => f('type', t)}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all text-center"
                          style={active
                            ? { background: `linear-gradient(135deg,${c.from},${c.to})`, borderColor: c.from, color: '#fff' }
                            : { background: c.light, borderColor: 'transparent', color: c.text }}>
                          <c.icon className="w-4 h-4" />
                          <span className="text-[10px] font-black leading-none">{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nome + Posizione */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Nome *</label>
                    <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="PC-MARIO, SRV-01" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Posizione</label>
                    <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Ufficio, Sala server" className={inp} />
                  </div>
                </div>

                {showNetwork && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>IP</label>
                      <input value={form.ip_address} onChange={e => f('ip_address', e.target.value)} placeholder="192.168.1.x" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Hostname</label>
                      <input value={form.hostname} onChange={e => f('hostname', e.target.value)} placeholder="nome-pc" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>MAC</label>
                      <input value={form.mac_address} onChange={e => f('mac_address', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Porta</label>
                      <input value={form.port} onChange={e => f('port', e.target.value)} placeholder="22, 443, 3389" className={inp} />
                    </div>
                  </div>
                )}

                {showEmail && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Server SMTP/IMAP</label>
                      <input value={form.hostname} onChange={e => f('hostname', e.target.value)} placeholder="smtp.esempio.com" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Porta</label>
                      <input value={form.port} onChange={e => f('port', e.target.value)} placeholder="465, 587, 993" className={inp} />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Email</label>
                      <input value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="info@azienda.it" className={inp} />
                    </div>
                  </div>
                )}

                {showOS && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Dominio / AD</label>
                      <input value={form.domain} onChange={e => f('domain', e.target.value)} placeholder="AZIENDA.LOCAL" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Sistema operativo</label>
                      <input value={form.os_version} onChange={e => f('os_version', e.target.value)} placeholder="Windows 11, Ubuntu 22" className={inp} />
                    </div>
                  </div>
                )}

                <div>
                  <label className={lbl}>Numero seriale</label>
                  <input value={form.serial_number} onChange={e => f('serial_number', e.target.value)} placeholder="S/N del dispositivo" className={inp} />
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credenziali principali</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Username</label>
                      <input value={form.username} onChange={e => f('username', e.target.value)} placeholder="admin" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Password</label>
                      <div className="relative">
                        <input type={showFormPwd ? 'text' : 'password'} value={form.password}
                          onChange={e => f('password', e.target.value)} aria-label="Password" className={`${inp} pr-10`} />
                        <button type="button" onClick={() => setShowFormPwd(v => !v)} aria-label="Mostra/nascondi password"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showFormPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {showDual && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credenziali secondarie</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Username 2</label>
                        <input value={form.secondary_username} onChange={e => f('secondary_username', e.target.value)} placeholder="utente locale" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Password 2</label>
                        <div className="relative">
                          <input type={showFormPwd2 ? 'text' : 'password'} value={form.secondary_password}
                            onChange={e => f('secondary_password', e.target.value)} aria-label="Password 2" className={`${inp} pr-10`} />
                          <button type="button" onClick={() => setShowFormPwd2(v => !v)} aria-label="Mostra/nascondi password 2"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showFormPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className={lbl}>Note</label>
                  <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
                    placeholder="Info aggiuntive, istruzioni" className={inp} />
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <input type="checkbox" checked={form.isFavorite} onChange={e => f('isFavorite', e.target.checked)}
                    aria-label="Aggiungi ai preferiti" className="accent-amber-400 w-4 h-4" />
                  <Star className={`w-4 h-4 ${form.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-amber-300'}`} />
                  <span className="text-sm font-bold text-amber-700">Aggiungi ai preferiti</span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Annulla
                </button>
                <button onClick={save} disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salva
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className="bg-white rounded-3xl w-full max-w-xs p-7 text-center"
              style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Elimina dispositivo</h3>
              <p className="text-sm text-slate-500 mb-6">Questa operazione non può essere annullata.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Annulla
                </button>
                <button
                  onClick={async () => { await deleteItem(deleteConfirm); setDeleteConfirm(null); setDetailItem(null) }}
                  className="py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                  Elimina
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
