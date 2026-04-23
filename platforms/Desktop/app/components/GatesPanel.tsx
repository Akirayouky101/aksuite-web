'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, ChevronDown, ChevronUp, Pencil, Trash2,
  DoorOpen, Calendar, User, Save,
  ClipboardList, AlertCircle, Loader2, Building2, Settings2
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
  oview_params: Record<string, string> | null
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

const NICE_PARAMS: { key: string; label: string; fn: string; opts?: { val: string; label: string }[] }[] = [
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

const EMPTY_OVIEW = (): Record<string, string> => {
  const o: Record<string, string> = {}
  ;[...NICE_PARAMS, ...NICE_PARAMS_M2].forEach(p => { o[p.key] = '' })
  return o
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
const lbl = 'block text-xs font-semibold text-slate-500 mb-1'
const sel = `${inp} appearance-none`

function NiceDisplay({ params, motor, values, accentColor = 'emerald' }: {
  params: typeof NICE_PARAMS
  motor: string
  values: Record<string, string | null | undefined>
  accentColor?: 'emerald' | 'blue'
}) {
  const dot   = accentColor === 'blue' ? 'bg-blue-400'   : 'bg-emerald-400'
  const label = accentColor === 'blue' ? 'text-blue-400'  : 'text-emerald-400'
  const val   = accentColor === 'blue' ? 'text-blue-400'  : 'text-emerald-400'
  return (
    <div className="bg-[#1C2333] rounded-xl p-4 font-mono">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2D3748]">
        <div className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
        <span className={`${label} text-xs font-bold tracking-widest uppercase`}>
          NICE O-View — Motore {motor}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {params.map(p => {
          const v = values[p.key]
          return (
            <div key={p.key} className="flex items-center gap-2 bg-[#0F1623] rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-slate-500 w-8 shrink-0">{p.fn}</span>
              <span className="text-[11px] text-slate-400 flex-1 truncate">{p.label}</span>
              <span className={`text-xs font-bold tabular-nums ${v ? val : 'text-slate-600'}`}>{v || '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NiceForm({ params, values, onChange, accentColor = 'emerald' }: {
  params: typeof NICE_PARAMS
  values: Record<string, string>
  onChange: (key: string, val: string) => void
  accentColor?: 'emerald' | 'blue'
}) {
  const accentText  = accentColor === 'blue' ? 'text-blue-400'       : 'text-emerald-400'
  const focusBorder = accentColor === 'blue' ? 'focus:border-blue-500' : 'focus:border-emerald-500'
  const inputCls = `bg-[#0F1623] ${accentText} border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none ${focusBorder}`
  return (
    <div className="bg-[#1C2333] rounded-xl p-4 grid grid-cols-2 gap-2.5">
      {params.map(p => (
        <div key={p.key} className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
            <span className={accentText}>{p.fn}</span> {p.label}
          </label>
          {p.opts ? (
            <select value={values[p.key] || ''} onChange={e => onChange(p.key, e.target.value)} className={inputCls}>
              <option value="">—</option>
              {p.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          ) : (
            <input value={values[p.key] || ''} onChange={e => onChange(p.key, e.target.value)} className={inputCls} placeholder="—" />
          )}
        </div>
      ))}
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
  const [showOview, setShowOview] = useState(false)

  // Gate form
  const [gateForm, setGateForm] = useState({
    name: '', client_id: '', brand: 'Nice', model: '', type: 'scorrevole',
    motor_count: 1, install_date: '', serial_number: '', notes: ''
  })
  const [oviewForm, setOviewForm] = useState<Record<string, string>>(EMPTY_OVIEW())

  // Maintenance form
  const [maintForm, setMaintForm] = useState<Record<string, string>>({
    date: new Date().toISOString().split('T')[0],
    type: 'ordinaria', description: '',
    ...EMPTY_OVIEW(),
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

  const hasOview = (g: Gate) => g.oview_params && Object.values(g.oview_params).some(v => v)

  // ── Gate CRUD ──────────────────────────────────────────────────────────────

  const openAddGate = () => {
    setGateForm({ name: '', client_id: '', brand: 'Nice', model: '', type: 'scorrevole', motor_count: 1, install_date: '', serial_number: '', notes: '' })
    setOviewForm(EMPTY_OVIEW())
    setShowOview(false)
    setGateModal({ mode: 'add' })
  }

  const openEditGate = (gate: Gate) => {
    setGateForm({
      name: gate.name, client_id: gate.client_id || '', brand: gate.brand || 'Nice',
      model: gate.model || '', type: gate.type || 'scorrevole', motor_count: gate.motor_count,
      install_date: gate.install_date || '', serial_number: gate.serial_number || '', notes: gate.notes || ''
    })
    const o = EMPTY_OVIEW()
    if (gate.oview_params) Object.assign(o, gate.oview_params)
    setOviewForm(o)
    setShowOview(!!hasOview(gate))
    setGateModal({ mode: 'edit', gate })
  }

  const saveGate = async () => {
    if (!gateForm.name.trim()) return
    setSaving(true)
    const oviewPayload: Record<string, string> = {}
    Object.entries(oviewForm).forEach(([k, v]) => { if (v.trim()) oviewPayload[k] = v.trim() })
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
      oview_params: Object.keys(oviewPayload).length ? oviewPayload : null,
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

  const openAddMaint = (gateId: string, mc: number, gate?: Gate) => {
    setMotorCount(mc)
    const base = EMPTY_OVIEW()
    if (gate?.oview_params) Object.assign(base, gate.oview_params)
    setMaintForm({ date: new Date().toISOString().split('T')[0], type: 'ordinaria', description: '', ...base })
    setMaintModal({ mode: 'add', gateId })
  }

  const openEditMaint = (gateId: string, maint: GateMaintenance, mc: number) => {
    setMotorCount(mc)
    const f: Record<string, string> = { date: maint.date, type: maint.type, description: maint.description || '' }
    ;[...NICE_PARAMS, ...NICE_PARAMS_M2].forEach(p => {
      f[p.key] = (maint[p.key as keyof GateMaintenance] as string | null) || ''
    })
    setMaintForm(f)
    setMaintModal({ mode: 'edit', gateId, maint })
  }

  const saveMaint = async () => {
    if (!maintModal) return
    setSaving(true)
    const nullify = (v: string) => v.trim() || null
    const payload: Record<string, unknown> = {
      gate_id: maintModal.gateId,
      date: maintForm.date,
      type: maintForm.type,
      description: nullify(maintForm.description),
    }
    ;[...NICE_PARAMS, ...NICE_PARAMS_M2].forEach(p => {
      payload[p.key] = nullify(maintForm[p.key] || '')
    })
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

  const maintDisplayVals = (params: typeof NICE_PARAMS, m: GateMaintenance) =>
    Object.fromEntries(params.map(p => [p.key, m[p.key as keyof GateMaintenance] as string | null]))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Main Modal (centered) ── */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <DoorOpen size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">Cancelli & Automazioni</h2>
            <p className="text-slate-400 text-xs">Archivio impianti, parametri O-View e manutenzioni</p>
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
        <div className="px-6 py-3 border-b border-slate-100 shrink-0">
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
                    {hasOview(gate) && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Settings2 size={8} /> O-View
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
                    <div className="px-4 py-3 bg-slate-50/60 space-y-3">
                      {/* Gate details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        {gate.serial_number && <span><span className="font-semibold text-slate-500">S/N:</span> {gate.serial_number}</span>}
                        {gate.install_date && <span><span className="font-semibold text-slate-500">Installato:</span> {new Date(gate.install_date + 'T00:00:00').toLocaleDateString('it-IT')}</span>}
                        {gate.notes && <span className="col-span-2 sm:col-span-3 italic text-slate-500">{gate.notes}</span>}
                      </div>

                      {/* O-View params */}
                      {hasOview(gate) && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Settings2 size={11} /> Parametri O-View — Configurazione attuale
                          </p>
                          <NiceDisplay
                            params={NICE_PARAMS}
                            motor="1"
                            values={Object.fromEntries(NICE_PARAMS.map(p => [p.key, gate.oview_params?.[p.key] ?? null]))}
                          />
                          {gate.motor_count === 2 && (
                            <div className="mt-2">
                              <NiceDisplay
                                params={NICE_PARAMS_M2}
                                motor="2"
                                values={Object.fromEntries(NICE_PARAMS_M2.map(p => [p.key, gate.oview_params?.[p.key] ?? null]))}
                                accentColor="blue"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Maintenance list */}
                      <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <ClipboardList size={12} /> Interventi
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => openAddMaint(gate.id, gate.motor_count, gate)}
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
                            <NiceDisplay params={NICE_PARAMS} motor="1" values={maintDisplayVals(NICE_PARAMS, m)} />
                          </div>

                          {/* Display Nice M2 (se doppio motore) */}
                          {gate.motor_count === 2 && (
                            <div className="px-3 pb-3">
                              <NiceDisplay params={NICE_PARAMS_M2} motor="2" values={maintDisplayVals(NICE_PARAMS_M2, m)} accentColor="blue" />
                            </div>
                          )}
                        </div>
                      ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        </motion.div>
      </div>

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                <h3 className="text-white font-bold">{gateModal.mode === 'add' ? 'Nuovo cancello' : 'Modifica cancello'}</h3>
                <button onClick={() => setGateModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
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

                {/* ── O-View parameters (collapsible) ── */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOview(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1C2333] rounded-xl text-white text-sm font-mono font-bold hover:bg-[#232d40] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Parametri O-View — configurazione attuale</span>
                    </div>
                    {showOview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {showOview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Motore 1</span>
                          </div>
                          <NiceForm
                            params={NICE_PARAMS}
                            values={oviewForm}
                            onChange={(k, v) => setOviewForm(p => ({ ...p, [k]: v }))}
                            accentColor="emerald"
                          />
                          {gateForm.motor_count === 2 && (
                            <>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Motore 2</span>
                              </div>
                              <NiceForm
                                params={NICE_PARAMS_M2}
                                values={oviewForm}
                                onChange={(k, v) => setOviewForm(p => ({ ...p, [k]: v }))}
                                accentColor="blue"
                              />
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              <div className="bg-[#1C2333] px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-white font-bold font-mono tracking-wide">
                    {maintModal.mode === 'add' ? 'Nuovo Intervento' : 'Modifica Intervento'}
                  </h3>
                </div>
                <button onClick={() => setMaintModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
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

                {/* Motore 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Parametri Motore 1</span>
                  </div>
                  <NiceForm
                    params={NICE_PARAMS}
                    values={maintForm}
                    onChange={(k, v) => setMaintForm(p => ({ ...p, [k]: v }))}
                    accentColor="emerald"
                  />
                </div>

                {/* Motore 2 */}
                {motorCount === 2 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Parametri Motore 2</span>
                    </div>
                    <NiceForm
                      params={NICE_PARAMS_M2}
                      values={maintForm}
                      onChange={(k, v) => setMaintForm(p => ({ ...p, [k]: v }))}
                      accentColor="blue"
                    />
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
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
