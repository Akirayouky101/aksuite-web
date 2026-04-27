'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Eye, EyeOff, Copy, Trash2, Pencil, Save, Loader2,
  Monitor, Server, HardDrive, Mail, Router, Network, Video, Printer,
  Shield, Cpu, Star, Lock, Globe, Hash, ChevronRight,
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

const EMPTY_FORM = (type: InfraType = 'PC'): Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  type, name: '', hostname: '', ip_address: '', mac_address: '',
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

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props { isOpen: boolean; onClose: () => void }
type ModalMode = { mode: 'add'; type: InfraType } | { mode: 'edit'; item: InfrastructureItem }

// ─── Component ───────────────────────────────────────────────────────────────
export default function InfrastructurePanel({ isOpen, onClose }: Props) {
  const { items, isLoading, addItem, updateItem, deleteItem } = useInfrastructure()

  // which type modal is open
  const [activeType, setActiveType]   = useState<InfraType | null>(null)
  const [typeSearch, setTypeSearch]   = useState('')

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

  // items filtered for the open type modal
  const typeItems = useMemo(() => {
    if (!activeType) return []
    const q = typeSearch.toLowerCase()
    return items.filter(item => {
      if (item.type !== activeType) return false
      if (!q) return true
      return [item.name, item.hostname, item.ip_address, item.location,
              item.username, item.domain, item.notes]
        .some(v => v && v.toLowerCase().includes(q))
    })
  }, [items, activeType, typeSearch])

  const openAdd = (type: InfraType) => {
    setForm(EMPTY_FORM(type))
    setShowFormPwd(false); setShowFormPwd2(false)
    setModal({ mode: 'add', type })
  }

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
              className="rounded-3xl w-full max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '88vh', background: '#f8fafc', boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)' }}
            >
              {/* Top bar */}
              <div className="bg-white px-6 py-4 border-b border-slate-100/80 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#0f172a,#334155)', boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}>
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-none tracking-tight">Infrastruttura Aziendale</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{items.length} dispositivi registrati</p>
                  </div>
                </div>
                <button onClick={onClose} aria-label="Chiudi"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Type cards grid */}
              <div className="overflow-y-auto flex-1 p-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {ALL_TYPES.map((type, idx) => {
                      const c = TYPE_CONFIG[type]
                      const count = items.filter(i => i.type === type).length
                      return (
                        <motion.button
                          key={type}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 28 }}
                          onClick={() => { setActiveType(type); setTypeSearch('') }}
                          whileHover={{ scale: 1.03, y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative rounded-2xl overflow-hidden group"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
                        >
                          {/* Gradient top */}
                          <div className="h-[88px] flex flex-col items-center justify-center relative overflow-hidden"
                            style={{ background: `linear-gradient(145deg, ${c.from}, ${c.to})` }}>
                            {/* Shine */}
                            <div className="absolute inset-0 opacity-20"
                              style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
                            <c.icon className="w-9 h-9 text-white drop-shadow-sm" />
                          </div>
                          {/* White bottom */}
                          <div className="bg-white px-3 py-2.5 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[13px] font-black text-slate-800 leading-tight">{c.label}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {count === 0 ? 'Vuoto' : `${count} ${count === 1 ? 'voce' : 'voci'}`}
                              </p>
                            </div>
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                              style={{ background: c.light }}>
                              <ChevronRight className="w-3 h-3" style={{ color: c.text }} />
                            </div>
                          </div>
                          {/* Count badge */}
                          {count > 0 && (
                            <div className="absolute top-2 left-2 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black"
                              style={{ background: 'rgba(255,255,255,0.95)', color: c.from, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                              {count}
                            </div>
                          )}
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

      {/* ── TYPE MODAL (lista + ricerca + aggiungi) ──────────────────────── */}
      <AnimatePresence>
        {activeType && (() => {
          const c = TYPE_CONFIG[activeType]
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveType(null)}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="rounded-3xl w-full max-w-md flex flex-col overflow-hidden"
                style={{ maxHeight: '88vh', background: '#f8fafc', boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                {/* Gradient header */}
                <div className="relative px-5 pt-7 pb-16 shrink-0"
                  style={{ background: `linear-gradient(145deg, ${c.from}, ${c.to})` }}>
                  {/* Shine overlay */}
                  <div className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.6) 0%, transparent 60%)' }} />
                  <button onClick={() => setActiveType(null)} aria-label="Chiudi"
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                    <c.icon className="w-7 h-7 text-white drop-shadow" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-none">{c.label}</h3>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {items.filter(i => i.type === activeType).length} dispositivi
                  </p>
                </div>

                {/* White body pulled up */}
                <div className="relative -mt-8 rounded-t-3xl bg-white flex-1 flex flex-col overflow-hidden" style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04)' }}>
                  {/* Search + Add */}
                  <div className="px-4 pt-5 pb-3 shrink-0">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={typeSearch}
                          onChange={e => setTypeSearch(e.target.value)}
                          placeholder={`Cerca ${c.label}…`}
                          className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                          style={{ background: '#f1f5f9', outlineColor: c.from }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <button
                        onClick={() => openAdd(activeType)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 12px ${c.from}40` }}>
                        <Plus className="w-3.5 h-3.5" />
                        Aggiungi
                      </button>
                    </div>
                  </div>

                  {/* Device list */}
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {typeItems.length === 0 ? (
                      <div className="text-center py-14">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          style={{ background: c.light, border: `2px dashed ${c.from}30` }}>
                          <c.icon className="w-6 h-6" style={{ color: c.from + 'a0' }} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                          {typeSearch ? 'Nessun risultato' : `Nessun ${c.label} registrato`}
                        </p>
                        {!typeSearch && (
                          <p className="text-xs text-slate-400 mt-1">Clicca Aggiungi per iniziare</p>
                        )}
                      </div>
                    ) : (
                      typeItems.map((item, i) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
                          onClick={() => setDetailItem(item)}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full text-left rounded-2xl px-3.5 py-3 flex items-center gap-3 transition-shadow hover:shadow-md"
                          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 3px 8px ${c.from}35` }}>
                            <c.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {item.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                              <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                              {item.ip_address || item.hostname || item.location || '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.username && (
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: c.light }}>
                                <Lock className="w-2.5 h-2.5" style={{ color: c.text }} />
                              </div>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
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
              className="fixed inset-0 z-[65] flex items-center justify-center p-4"
              style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="rounded-3xl w-full max-w-sm flex flex-col overflow-hidden"
                style={{ maxHeight: '88vh', background: '#fff', boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                {/* Gradient header */}
                <div className="relative px-5 pt-7 pb-16 shrink-0"
                  style={{ background: `linear-gradient(145deg, ${c.from}, ${c.to})` }}>
                  <div className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.6) 0%, transparent 60%)' }} />
                  <button onClick={() => setDetailItem(null)} aria-label="Chiudi"
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                    <c.icon className="w-7 h-7 text-white drop-shadow" />
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isFavorite && <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 flex-shrink-0" />}
                    <h3 className="text-2xl font-black text-white truncate tracking-tight">{item.name}</h3>
                  </div>
                  <p className="text-[13px] font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.label}</p>
                </div>

                {/* White body */}
                <div className="relative -mt-8 rounded-t-3xl bg-white flex-1 overflow-y-auto">
                  <div className="p-5 space-y-4">
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

                    {(item.username || item.password || item.secondary_username || item.secondary_password) && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100">
                        <div className="px-4 py-2.5 border-b border-slate-50" style={{ background: c.light }}>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>Credenziali</p>
                        </div>
                        {item.username && (
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.light }}>
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
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</p>
                              <p className="text-sm font-mono text-slate-800">{visiblePwd.has(item.id) ? item.password : '••••••••••'}</p>
                            </div>
                            <button onClick={() => toggleVis(item.id, setVisiblePwd)} aria-label="Mostra password"
                              className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: c.light }}>
                              {visiblePwd.has(item.id) ? <EyeOff className="w-3 h-3" style={{ color: c.text }} /> : <Eye className="w-3 h-3" style={{ color: c.text }} />}
                            </button>
                            <CopyBtn text={item.password} id={`d-${item.id}-pwd`} copiedId={copiedId} onCopy={copy} light={c.light} />
                          </div>
                        )}
                        {item.secondary_username && (
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.light }}>
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
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.light }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: c.text }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password 2</p>
                              <p className="text-sm font-mono text-slate-800">{visiblePwd2.has(item.id) ? item.secondary_password : '••••••••••'}</p>
                            </div>
                            <button onClick={() => toggleVis(item.id, setVisiblePwd2)} aria-label="Mostra password 2"
                              className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: c.light }}>
                              {visiblePwd2.has(item.id) ? <EyeOff className="w-3 h-3" style={{ color: c.text }} /> : <Eye className="w-3 h-3" style={{ color: c.text }} />}
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

                  <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateItem(item.id, { isFavorite: !item.isFavorite }).then(u => { if (u) setDetailItem(u) })}
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-all active:scale-95"
                      style={item.isFavorite
                        ? { background: '#fef3c7', border: '1.5px solid #fcd34d', color: '#b45309' }
                        : { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                      <span className="text-[10px] font-bold leading-none">{item.isFavorite ? 'Preferito' : 'Preferiti'}</span>
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-all active:scale-95"
                      style={{ background: c.light, border: `1.5px solid ${c.from}30`, color: c.text }}>
                      <Pencil className="w-4 h-4" />
                      <span className="text-[10px] font-bold leading-none">Modifica</span>
                    </button>
                    <button onClick={() => setDeleteConfirm(item.id)}
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-all active:scale-95"
                      style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#e11d48' }}>
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold leading-none">Elimina</span>
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
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="rounded-3xl w-full max-w-lg flex flex-col overflow-hidden"
              style={{ maxHeight: '92vh', background: '#fff', boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  {(() => {
                    const c = TYPE_CONFIG[form.type]
                    return (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg,${c.from},${c.to})`, boxShadow: `0 4px 10px ${c.from}40` }}>
                        <c.icon className="w-4 h-4 text-white" />
                      </div>
                    )
                  })()}
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight">
                    {modal.mode === 'add' ? `Nuovo ${TYPE_CONFIG[form.type].label}` : `Modifica — ${modal.item.name}`}
                  </h3>
                </div>
                <button onClick={() => setModal(null)} aria-label="Chiudi"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {modal.mode === 'edit' && (
                  <div>
                    <label className={lbl}>Tipo</label>
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
                )}

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
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                  Annulla
                </button>
                <button onClick={save} disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${TYPE_CONFIG[form.type].from}, ${TYPE_CONFIG[form.type].to})`, boxShadow: `0 4px 12px ${TYPE_CONFIG[form.type].from}40` }}>
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
            className="fixed inset-0 z-[75] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className="rounded-3xl w-full max-w-xs p-7 text-center"
              style={{ background: '#fff', boxShadow: '0 40px 100px rgba(0,0,0,0.35)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#fff1f2', border: '1.5px solid #fecdd3' }}>
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1 tracking-tight">Elimina dispositivo</h3>
              <p className="text-sm text-slate-400 mb-6">Questa operazione non può essere annullata.</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => setDeleteConfirm(null)}
                  className="py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                  Annulla
                </button>
                <button
                  onClick={async () => { await deleteItem(deleteConfirm); setDeleteConfirm(null); setDetailItem(null) }}
                  className="py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e11d48,#fb7185)', boxShadow: '0 4px 12px rgba(225,29,72,0.35)' }}>
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
