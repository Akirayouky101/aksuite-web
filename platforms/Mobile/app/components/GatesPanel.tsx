'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, ChevronDown, ChevronUp, Pencil, Trash2,
  DoorOpen, Wrench, Calendar, User, ChevronRight, Save,
  ClipboardList, AlertCircle, CheckCircle2, Loader2, Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client { id: string; name: string; company?: string | null }

interface Gate {
  id: string
  client_id: string | null
  name: string
  brand: string | null
  model: string | null
  type: string | null
  motor_count: number
  install_date: string | null
  serial_number: string | null
  notes: string | null
  created_at: string
}

interface GateMaintenance {
  id: string
  gate_id: string
  profile_id: string | null
  date: string
  type: string
  description: string | null
  m1_work_mode: string | null
  m1_pause_time: string | null
  m1_partial_open: string | null
  m1_obstacle_sens: string | null
  m1_preflash: string | null
  m1_encoder: string | null
  m1_slowdown: string | null
  m1_electric_lock: string | null
  m1_open_limit: string | null
  m1_close_limit: string | null
  m1_open_force: string | null
  m1_close_force: string | null
  m2_work_mode: string | null
  m2_pause_time: string | null
  m2_partial_open: string | null
  m2_obstacle_sens: string | null
  m2_preflash: string | null
  m2_encoder: string | null
  m2_slowdown: string | null
  m2_electric_lock: string | null
  m2_open_limit: string | null
  m2_close_limit: string | null
  m2_open_force: string | null
  m2_close_force: string | null
  extra_params: Record<string, string> | null
  created_at: string
  profiles?: { full_name: string } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANDS = ['Nice', 'CAME', 'BFT', 'FAAC', 'Gibidi', 'Beninca', 'DEA', 'V2', 'altro']
const TYPES  = ['scorrevole', 'battente', 'sbarra', 'garage', 'altro']
const MAINT_TYPES = ['installazione', 'ordinaria', 'straordinaria', 'guasto', 'collaudo']

const WORK_MODES = [
  { val: '0', label: '0 – Automatico' },
  { val: '1', label: '1 – Semiautomatico' },
  { val: '2', label: '2 – Manuale' },
  { val: '3', label: '3 – Passo-Passo' },
  { val: '4', label: '4 – Deadman' },
]

const ENABLED_OPTS = [
  { val: 'abilitato', label: 'Abilitato' },
  { val: 'disabilitato', label: 'Disabilitato' },
]

const NICE_PARAMS: { key: keyof GateMaintenance; label: string; fn: string; opts?: { val: string; label: string }[] }[] = [
  { key: 'm1_work_mode',    label: 'Modo lavoro',           fn: 'F1', opts: WORK_MODES },
  { key: 'm1_pause_time',   label: 'Tempo pausa (s)',       fn: 'F2' },
  { key: 'm1_partial_open', label: 'Apertura parziale (%)', fn: 'F3' },
  { key: 'm1_obstacle_sens',label: 'Sensibilità ostacoli',  fn: 'F4' },
  { key: 'm1_preflash',     label: 'Pre-lampeggio (s)',     fn: 'F5' },
  { key: 'm1_encoder',      label: 'Encoder',               fn: 'F6', opts: ENABLED_OPTS },
  { key: 'm1_slowdown',     label: 'Rallentamento',         fn: 'F7', opts: ENABLED_OPTS },
  { key: 'm1_electric_lock',label: 'Elettroserratura',      fn: 'F8', opts: ENABLED_OPTS },
  { key: 'm1_open_limit',   label: 'Finecorsa apertura',    fn: 'FC+' },
  { key: 'm1_close_limit',  label: 'Finecorsa chiusura',    fn: 'FC-' },
  { key: 'm1_open_force',   label: 'Forza apertura',        fn: 'FA' },
  { key: 'm1_close_force',  label: 'Forza chiusura',        fn: 'FC' },
]

const NICE_PARAMS_M2 = NICE_PARAMS.map(p => ({
  ...p,
  key: p.key.replace('m1_', 'm2_') as keyof GateMaintenance,
}))

// ─── Sub-components ───────────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
const lbl = 'block text-xs font-semibold text-slate-500 mb-1'
const sel = `${inp} appearance-none`

function NiceDisplay({ params, motor, values }: {
  params: typeof NICE_PARAMS
  motor: string
  values: Partial<GateMaintenance>
}) {
  return (
    <div className="bg-[#1C2333] rounded-xl p-4 font-mono">
      {/* Display header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2D3748]">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
          NICE — Motore {motor}
        </span>
      </div>
      {/* Parameter grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {params.map(p => {
          const val = values[p.key] as string | null
          return (
            <div key={p.key} className="flex items-center gap-2 bg-[#0F1623] rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 w-8 shrink-0">{p.fn}</span>
              <span className="text-[11px] text-slate-400 flex-1 truncate">{p.label}</span>
              <span className={`text-xs font-bold tabular-nums ${val ? 'text-emerald-400' : 'text-slate-600'}`}>
                {val || '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  isAdmin: boolean
}

export default function GatesPanel({ isOpen, onClose, clients, isAdmin }: Props) {
  const [gates, setGates] = useState<Gate[]>([])
  const [maintenances, setMaintenances] = useState<Record<string, GateMaintenance[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedGateId, setExpandedGateId] = useState<string | null>(null)
  const [loadingMaintId, setLoadingMaintId] = useState<string | null>(null)

  // Modals state
  const [gateModal, setGateModal] = useState<{ mode: 'add' | 'edit'; gate?: Gate } | null>(null)
  const [maintModal, setMaintModal] = useState<{ mode: 'add' | 'edit'; gateId: string; maint?: GateMaintenance } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'gate' | 'maint'; id: string } | null>(null)

  // Gate form
  const [gateForm, setGateForm] = useState({
    name: '', client_id: '', brand: '', model: '', type: 'scorrevole',
    motor_count: 1, install_date: '', serial_number: '', notes: ''
  })

  // Maintenance form
  const [maintForm, setMaintForm] = useState<Record<string, string>>({
    date: new Date().toISOString().split('T')[0],
    type: 'ordinaria', description: '',
    m1_work_mode: '', m1_pause_time: '', m1_partial_open: '', m1_obstacle_sens: '',
    m1_preflash: '', m1_encoder: '', m1_slowdown: '', m1_electric_lock: '',
    m1_open_limit: '', m1_close_limit: '', m1_open_force: '', m1_close_force: '',
    m2_work_mode: '', m2_pause_time: '', m2_partial_open: '', m2_obstacle_sens: '',
    m2_preflash: '', m2_encoder: '', m2_slowdown: '', m2_electric_lock: '',
    m2_open_limit: '', m2_close_limit: '', m2_open_force: '', m2_close_force: '',
  })
  const [motorCount, setMotorCount] = useState(1)

  const fetchGates = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('gates')
      .select('*')
      .order('created_at', { ascending: false })
    setGates((data as Gate[]) || [])
    setLoading(false)
  }, [])

  const fetchMaintenances = useCallback(async (gateId: string) => {
    setLoadingMaintId(gateId)
    const { data } = await supabase
      .from('gate_maintenances')
      .select('*, profiles(full_name)')
      .eq('gate_id', gateId)
      .order('date', { ascending: false })
    setMaintenances(prev => ({ ...prev, [gateId]: (data as GateMaintenance[]) || [] }))
    setLoadingMaintId(null)
  }, [])

  useEffect(() => { if (isOpen) fetchGates() }, [isOpen, fetchGates])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return gates
    return gates.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.brand?.toLowerCase().includes(q) ||
      g.model?.toLowerCase().includes(q) ||
      clients.find(c => c.id === g.client_id)?.name.toLowerCase().includes(q)
    )
  }, [search, gates, clients])

  const clientName = (id: string | null) => {
    if (!id) return null
    const c = clients.find(c => c.id === id)
    return c ? `${c.name}${c.company ? ` — ${c.company}` : ''}` : null
  }

  // ── Gate CRUD ──────────────────────────────────────────────────────────────

  const openAddGate = () => {
    setGateForm({ name: '', client_id: '', brand: 'Nice', model: '', type: 'scorrevole', motor_count: 1, install_date: '', serial_number: '', notes: '' })
    setGateModal({ mode: 'add' })
  }

  const openEditGate = (gate: Gate) => {
    setGateForm({
      name: gate.name, client_id: gate.client_id || '', brand: gate.brand || '',
      model: gate.model || '', type: gate.type || 'scorrevole', motor_count: gate.motor_count,
      install_date: gate.install_date || '', serial_number: gate.serial_number || '', notes: gate.notes || ''
    })
    setGateModal({ mode: 'edit', gate })
  }

  const saveGate = async () => {
    if (!gateForm.name.trim()) return
    setSaving(true)
    const payload = {
      name: gateForm.name.trim(),
      client_id: gateForm.client_id || null,
      brand: gateForm.brand || null,
      model: gateForm.model || null,
      type: gateForm.type || null,
      motor_count: gateForm.motor_count,
      install_date: gateForm.install_date || null,
      serial_number: gateForm.serial_number || null,
      notes: gateForm.notes || null,
    }
    if (gateModal?.mode === 'add') {
      await supabase.from('gates').insert(payload)
    } else if (gateModal?.gate) {
      await supabase.from('gates').update(payload).eq('id', gateModal.gate.id)
    }
    setSaving(false)
    setGateModal(null)
    fetchGates()
  }

  const deleteGate = async (id: string) => {
    await supabase.from('gates').delete().eq('id', id)
    setDeleteConfirm(null)
    if (expandedGateId === id) setExpandedGateId(null)
    fetchGates()
  }

  // ── Maintenance CRUD ───────────────────────────────────────────────────────

  const openAddMaint = (gateId: string, motorCount: number) => {
    setMotorCount(motorCount)
    setMaintForm({
      date: new Date().toISOString().split('T')[0],
      type: 'ordinaria', description: '',
      m1_work_mode: '', m1_pause_time: '', m1_partial_open: '', m1_obstacle_sens: '',
      m1_preflash: '', m1_encoder: '', m1_slowdown: '', m1_electric_lock: '',
      m1_open_limit: '', m1_close_limit: '', m1_open_force: '', m1_close_force: '',
      m2_work_mode: '', m2_pause_time: '', m2_partial_open: '', m2_obstacle_sens: '',
      m2_preflash: '', m2_encoder: '', m2_slowdown: '', m2_electric_lock: '',
      m2_open_limit: '', m2_close_limit: '', m2_open_force: '', m2_close_force: '',
    })
    setMaintModal({ mode: 'add', gateId })
  }

  const openEditMaint = (gateId: string, maint: GateMaintenance, mc: number) => {
    setMotorCount(mc)
    const f: Record<string, string> = { date: maint.date, type: maint.type, description: maint.description || '' }
    ;[...NICE_PARAMS, ...NICE_PARAMS_M2].forEach(p => {
      f[p.key as string] = (maint[p.key] as string | null) || ''
    })
    setMaintForm(f)
    setMaintModal({ mode: 'edit', gateId, maint })
  }

  const saveMaint = async () => {
    if (!maintModal) return
    setSaving(true)
    const nullify = (v: string) => v.trim() || null
    const payload = {
      gate_id: maintModal.gateId,
      date: maintForm.date,
      type: maintForm.type,
      description: nullify(maintForm.description),
      m1_work_mode: nullify(maintForm.m1_work_mode),
      m1_pause_time: nullify(maintForm.m1_pause_time),
      m1_partial_open: nullify(maintForm.m1_partial_open),
      m1_obstacle_sens: nullify(maintForm.m1_obstacle_sens),
      m1_preflash: nullify(maintForm.m1_preflash),
      m1_encoder: nullify(maintForm.m1_encoder),
      m1_slowdown: nullify(maintForm.m1_slowdown),
      m1_electric_lock: nullify(maintForm.m1_electric_lock),
      m1_open_limit: nullify(maintForm.m1_open_limit),
      m1_close_limit: nullify(maintForm.m1_close_limit),
      m1_open_force: nullify(maintForm.m1_open_force),
      m1_close_force: nullify(maintForm.m1_close_force),
      m2_work_mode: nullify(maintForm.m2_work_mode),
      m2_pause_time: nullify(maintForm.m2_pause_time),
      m2_partial_open: nullify(maintForm.m2_partial_open),
      m2_obstacle_sens: nullify(maintForm.m2_obstacle_sens),
      m2_preflash: nullify(maintForm.m2_preflash),
      m2_encoder: nullify(maintForm.m2_encoder),
      m2_slowdown: nullify(maintForm.m2_slowdown),
      m2_electric_lock: nullify(maintForm.m2_electric_lock),
      m2_open_limit: nullify(maintForm.m2_open_limit),
      m2_close_limit: nullify(maintForm.m2_close_limit),
      m2_open_force: nullify(maintForm.m2_open_force),
      m2_close_force: nullify(maintForm.m2_close_force),
    }
    if (maintModal.mode === 'add') {
      await supabase.from('gate_maintenances').insert(payload)
    } else if (maintModal.maint) {
      await supabase.from('gate_maintenances').update(payload).eq('id', maintModal.maint.id)
    }
    setSaving(false)
    setMaintModal(null)
    fetchMaintenances(maintModal.gateId)
  }

  const deleteMaint = async (id: string, gateId: string) => {
    await supabase.from('gate_maintenances').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchMaintenances(gateId)
  }

  const handleToggleGate = async (id: string) => {
    if (expandedGateId === id) { setExpandedGateId(null); return }
    setExpandedGateId(id)
    if (!maintenances[id]) await fetchMaintenances(id)
  }

  const typeColor = (t: string) => {
    if (t === 'guasto')        return 'bg-red-100 text-red-700 border-red-200'
    if (t === 'straordinaria') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (t === 'installazione') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (t === 'collaudo')      return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  const brandColor = (b: string | null) => {
    if (b === 'Nice')  return 'bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7]'
    if (b === 'CAME')  return 'bg-orange-50 text-orange-800 border-orange-200'
    if (b === 'BFT')   return 'bg-blue-50 text-blue-800 border-blue-200'
    if (b === 'FAAC')  return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  if (!isOpen) return null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <DoorOpen size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">Cancelli & Automazioni</h2>
            <p className="text-slate-400 text-xs">Archivio manutenzioni e parametri</p>
          </div>
          {isAdmin && (
            <button
              onClick={openAddGate}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Nuovo cancello
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca cancello, brand, cliente…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" /> Caricamento…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <DoorOpen size={40} className="mb-3 opacity-30" />
              <p className="font-medium">{search ? 'Nessun risultato' : 'Nessun cancello registrato'}</p>
              {isAdmin && !search && (
                <button onClick={openAddGate} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                  Aggiungi il primo cancello
                </button>
              )}
            </div>
          ) : filtered.map(gate => (
            <div key={gate.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {/* Gate row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleToggleGate(gate.id)}
              >
                {/* Brand badge */}
                <div className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${brandColor(gate.brand)}`}>
                  {gate.brand || '—'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{gate.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {gate.model && <span className="text-xs text-slate-500">{gate.model}</span>}
                    {gate.type && <span className="text-[10px] text-slate-400 capitalize">• {gate.type}</span>}
                    {gate.motor_count === 2 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">2 motori</span>}
                    {gate.client_id && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Building2 size={10} /> {clientName(gate.client_id)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); openEditGate(gate) }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'gate', id: gate.id }) }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  {expandedGateId === gate.id
                    ? <ChevronUp size={16} className="text-slate-400" />
                    : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {/* Expanded: maintenance list */}
              <AnimatePresence>
                {expandedGateId === gate.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="px-4 py-3 bg-slate-50/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <ClipboardList size={12} /> Interventi
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => openAddMaint(gate.id, gate.motor_count)}
                            className="flex items-center gap-1 text-xs bg-slate-700 text-white px-2.5 py-1 rounded-lg hover:bg-slate-600 font-semibold transition-colors"
                          >
                            <Plus size={11} /> Nuovo intervento
                          </button>
                        )}
                      </div>

                      {loadingMaintId === gate.id ? (
                        <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Caricamento…
                        </div>
                      ) : !maintenances[gate.id]?.length ? (
                        <p className="text-xs text-slate-400 py-3 text-center">Nessun intervento registrato</p>
                      ) : maintenances[gate.id].map(m => (
                        <div key={m.id} className="mb-3 rounded-xl bg-white border border-slate-200 overflow-hidden">
                          {/* Maint header */}
                          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${typeColor(m.type)}`}>
                              {m.type}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(m.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            {m.profiles?.full_name && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-auto">
                                <User size={10} /> {m.profiles.full_name}
                              </span>
                            )}
                            {isAdmin && (
                              <div className="flex gap-1 ml-1">
                                <button
                                  onClick={() => openEditMaint(gate.id, m, gate.motor_count)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'maint', id: m.id })}
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {m.description && (
                            <div className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100">
                              {m.description}
                            </div>
                          )}

                          {/* Display Nice M1 */}
                          <div className="p-3">
                            <NiceDisplay params={NICE_PARAMS} motor="1" values={m} />
                          </div>

                          {/* Display Nice M2 (se doppio motore) */}
                          {gate.motor_count === 2 && (
                            <div className="px-3 pb-3">
                              <NiceDisplay params={NICE_PARAMS_M2} motor="2" values={m} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Gate Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setGateModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold">{gateModal.mode === 'add' ? 'Nuovo cancello' : 'Modifica cancello'}</h3>
                <button onClick={() => setGateModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className={lbl}>Nome *</label>
                  <input value={gateForm.name} onChange={e => setGateForm(p => ({ ...p, name: e.target.value }))} placeholder="es. Cancello Principale" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Brand</label>
                    <select value={gateForm.brand} onChange={e => setGateForm(p => ({ ...p, brand: e.target.value }))} className={sel}>
                      <option value="">—</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Modello</label>
                    <input value={gateForm.model} onChange={e => setGateForm(p => ({ ...p, model: e.target.value }))} placeholder="es. Robus 600" className={inp} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Tipologia</label>
                    <select value={gateForm.type} onChange={e => setGateForm(p => ({ ...p, type: e.target.value }))} className={sel}>
                      {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>N° Motori</label>
                    <select value={gateForm.motor_count} onChange={e => setGateForm(p => ({ ...p, motor_count: +e.target.value }))} className={sel}>
                      <option value={1}>1 motore</option>
                      <option value={2}>2 motori</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Cliente</label>
                  <select value={gateForm.client_id} onChange={e => setGateForm(p => ({ ...p, client_id: e.target.value }))} className={sel}>
                    <option value="">— Nessun cliente —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Data installazione</label>
                    <input type="date" value={gateForm.install_date} onChange={e => setGateForm(p => ({ ...p, install_date: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>N° Seriale</label>
                    <input value={gateForm.serial_number} onChange={e => setGateForm(p => ({ ...p, serial_number: e.target.value }))} placeholder="es. ABC12345" className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Note</label>
                  <textarea value={gateForm.notes} onChange={e => setGateForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inp} />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setGateModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
                <button
                  onClick={saveGate}
                  disabled={saving || !gateForm.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salva
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Maintenance Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {maintModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setMaintModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-[#1C2333] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-white font-bold font-mono tracking-wide">
                    {maintModal.mode === 'add' ? 'Nuovo Intervento' : 'Modifica Intervento'}
                  </h3>
                </div>
                <button onClick={() => setMaintModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                {/* Base fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Data *</label>
                    <input type="date" value={maintForm.date} onChange={e => setMaintForm(p => ({ ...p, date: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Tipo intervento</label>
                    <select value={maintForm.type} onChange={e => setMaintForm(p => ({ ...p, type: e.target.value }))} className={sel}>
                      {MAINT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Descrizione / Note intervento</label>
                  <textarea value={maintForm.description} onChange={e => setMaintForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Cosa è stato fatto…" className={inp} />
                </div>

                {/* ── Nice T4 Parameters — Motore 1 ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Parametri Motore 1</span>
                  </div>
                  <div className="bg-[#1C2333] rounded-xl p-4 grid grid-cols-2 gap-2.5">
                    {NICE_PARAMS.map(p => (
                      <div key={p.key as string} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <span className="text-emerald-400">{p.fn}</span> {p.label}
                        </label>
                        {p.opts ? (
                          <select
                            value={maintForm[p.key as string] || ''}
                            onChange={e => setMaintForm(prev => ({ ...prev, [p.key as string]: e.target.value }))}
                            className="bg-[#0F1623] text-emerald-400 border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">—</option>
                            {p.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input
                            value={maintForm[p.key as string] || ''}
                            onChange={e => setMaintForm(prev => ({ ...prev, [p.key as string]: e.target.value }))}
                            className="bg-[#0F1623] text-emerald-400 border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                            placeholder="—"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Nice T4 Parameters — Motore 2 (se doppio) ── */}
                {motorCount === 2 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Parametri Motore 2</span>
                    </div>
                    <div className="bg-[#1C2333] rounded-xl p-4 grid grid-cols-2 gap-2.5">
                      {NICE_PARAMS_M2.map(p => (
                        <div key={p.key as string} className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                            <span className="text-blue-400">{p.fn}</span> {p.label}
                          </label>
                          {p.opts ? (
                            <select
                              value={maintForm[p.key as string] || ''}
                              onChange={e => setMaintForm(prev => ({ ...prev, [p.key as string]: e.target.value }))}
                              className="bg-[#0F1623] text-blue-400 border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                            >
                              <option value="">—</option>
                              {p.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                            </select>
                          ) : (
                            <input
                              value={maintForm[p.key as string] || ''}
                              onChange={e => setMaintForm(prev => ({ ...prev, [p.key as string]: e.target.value }))}
                              className="bg-[#0F1623] text-blue-400 border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                              placeholder="—"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setMaintModal(null)} className="px-4 py-2 rounded-lg border text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
                <button
                  onClick={saveMaint}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C2333] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salva intervento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-1">
                {deleteConfirm.type === 'gate' ? 'Elimina cancello?' : 'Elimina intervento?'}
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                {deleteConfirm.type === 'gate'
                  ? 'Verranno eliminati anche tutti gli interventi associati.'
                  : 'Questa operazione non è reversibile.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'gate') deleteGate(deleteConfirm.id)
                    else {
                      const gateId = Object.entries(maintenances).find(([, maints]) =>
                        maints.some(m => m.id === deleteConfirm.id)
                      )?.[0]
                      if (gateId) deleteMaint(deleteConfirm.id, gateId)
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
                >
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
