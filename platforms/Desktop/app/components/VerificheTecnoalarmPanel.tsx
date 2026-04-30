'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, ShieldCheck, Calendar, AlertTriangle,
  CheckCircle2, Clock, Pencil, Trash2, Save, ChevronDown,
  User, Phone, MapPin, ClipboardList, FileText, BadgeCheck,
  AlertCircle, XCircle, Loader2, RefreshCw, ChevronLeft,
  Building2, Wrench, ToggleLeft, ToggleRight,
} from 'lucide-react'
import type { VerificaTecnoalarm, NuovaVerifica, VerificaCampoDefinizione } from '../hooks/useVerificheTecnoalarm'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATO_CFG: Record<VerificaTecnoalarm['stato'], { label: string; cls: string; icon: React.ReactNode }> = {
  programmata:   { label: 'Programmata',    cls: 'text-blue-700 bg-blue-50 ring-blue-200',     icon: <Calendar size={11}/> },
  in_scadenza:   { label: 'In Scadenza',    cls: 'text-amber-700 bg-amber-50 ring-amber-200',  icon: <AlertTriangle size={11}/> },
  scaduta:       { label: 'Scaduta',        cls: 'text-red-700 bg-red-50 ring-red-200',         icon: <AlertCircle size={11}/> },
  in_corso:      { label: 'In Corso',       cls: 'text-purple-700 bg-purple-50 ring-purple-200',icon: <Clock size={11}/> },
  completata:    { label: 'Completata',     cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200', icon: <CheckCircle2 size={11}/> },
  annullata:     { label: 'Annullata',      cls: 'text-slate-500 bg-slate-100 ring-slate-200',  icon: <XCircle size={11}/> },
}

const ESITO_CFG = {
  positivo:              { label: 'Positivo',            cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  positivo_con_riserva:  { label: 'Positivo con riserva',cls: 'text-amber-700 bg-amber-50 ring-amber-200' },
  negativo:              { label: 'Negativo',            cls: 'text-red-700 bg-red-50 ring-red-200' },
}

const TIPO_OPTIONS = [
  { val: 'mensile',       label: 'Mensile',       mesi: 1 },
  { val: 'trimestrale',   label: 'Trimestrale',   mesi: 3 },
  { val: 'semestrale',    label: 'Semestrale',    mesi: 6 },
  { val: 'annuale',       label: 'Annuale',       mesi: 12 },
  { val: 'straordinaria', label: 'Straordinaria', mesi: 0 },
]

const EMPTY_FORM: Omit<NuovaVerifica, 'created_by_name'> = {
  cliente: '', indirizzo: '', telefono: '', riferimento: '', codice_impianto: '',
  tipo_verifica: 'semestrale', periodicita_mesi: 6,
  data_ultima_verifica: null, data_prossima_verifica: '', data_esecuzione: null,
  stato: 'programmata', tecnico_assegnato: '', tecnico_user_id: null,
  esito: null, note_tecniche: '', note_interne: '', firma_cliente: false, firma_tecnico: false,
  allegati: [], campi_abilitati: [], campi_valori: {},
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysDiff(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  return diff
}

function scadenzaLabel(v: VerificaTecnoalarm) {
  if (!v.data_prossima_verifica || v.stato === 'completata' || v.stato === 'annullata') return null
  const diff = daysDiff(v.data_prossima_verifica)
  if (diff < 0) return { txt: `Scaduta ${Math.abs(diff)}g fa`, cls: 'text-red-600' }
  if (diff === 0) return { txt: 'Scade oggi!', cls: 'text-red-600 font-semibold' }
  if (diff <= 15) return { txt: `Scade tra ${diff}g`, cls: 'text-amber-600' }
  return { txt: `Scade tra ${diff}g`, cls: 'text-slate-500' }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VerificheTecnoalarmPanelProps {
  isOpen: boolean
  onClose: () => void
  verifiche: VerificaTecnoalarm[]
  campiDefinizioni: VerificaCampoDefinizione[]
  loading: boolean
  scadute: number
  inScadenza: number
  programmate: number
  completate: number
  currentUserName: string
  isAdmin: boolean
  onAdd: (data: NuovaVerifica) => Promise<VerificaTecnoalarm | null>
  onUpdate: (id: string, data: Partial<VerificaTecnoalarm>) => Promise<VerificaTecnoalarm | null>
  onDelete: (id: string) => Promise<void>
  onCompleta: (id: string, payload: {
    esito: VerificaTecnoalarm['esito']
    note_tecniche?: string
    campi_valori?: Record<string, unknown>
    firma_cliente?: boolean
    firma_tecnico?: boolean
  }) => Promise<VerificaTecnoalarm | null>
  onRefetch: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerificheTecnoalarmPanel({
  isOpen, onClose,
  verifiche, campiDefinizioni, loading,
  scadute, inScadenza, programmate, completate,
  currentUserName, isAdmin,
  onAdd, onUpdate, onDelete, onCompleta, onRefetch,
}: VerificheTecnoalarmPanelProps) {

  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState<string>('tutti')
  const [selected, setSelected] = useState<VerificaTecnoalarm | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCompleta, setShowCompleta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [completaForm, setCompletaForm] = useState({
    esito: 'positivo' as VerificaTecnoalarm['esito'],
    note_tecniche: '',
    firma_cliente: false,
    firma_tecnico: false,
    campi_valori: {} as Record<string, unknown>,
  })

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return verifiche.filter(v => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        v.cliente.toLowerCase().includes(q) ||
        v.codice_impianto.toLowerCase().includes(q) ||
        v.tecnico_assegnato.toLowerCase().includes(q) ||
        v.indirizzo.toLowerCase().includes(q)
      const matchStato = filterStato === 'tutti' || v.stato === filterStato
      return matchSearch && matchStato
    })
  }, [verifiche, search, filterStato])

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const openNew = () => {
    setForm({ ...EMPTY_FORM })
    setEditing(false)
    setSelected(null)
    setShowForm(true)
    setShowCompleta(false)
  }

  const openEdit = (v: VerificaTecnoalarm) => {
    setForm({
      cliente: v.cliente, indirizzo: v.indirizzo, telefono: v.telefono,
      riferimento: v.riferimento, codice_impianto: v.codice_impianto,
      tipo_verifica: v.tipo_verifica, periodicita_mesi: v.periodicita_mesi,
      data_ultima_verifica: v.data_ultima_verifica,
      data_prossima_verifica: v.data_prossima_verifica,
      data_esecuzione: v.data_esecuzione,
      stato: v.stato, tecnico_assegnato: v.tecnico_assegnato, tecnico_user_id: v.tecnico_user_id,
      esito: v.esito, note_tecniche: v.note_tecniche, note_interne: v.note_interne,
      firma_cliente: v.firma_cliente, firma_tecnico: v.firma_tecnico,
      allegati: v.allegati, campi_abilitati: v.campi_abilitati, campi_valori: v.campi_valori,
    })
    setEditing(true)
    setSelected(v)
    setShowForm(true)
    setShowCompleta(false)
  }

  const setTipo = (tipo: string) => {
    const opt = TIPO_OPTIONS.find(o => o.val === tipo)
    setForm(f => ({ ...f, tipo_verifica: tipo as NuovaVerifica['tipo_verifica'], periodicita_mesi: opt?.mesi ?? 6 }))
  }

  const toggleCampo = (nome: string) => {
    setForm(f => {
      const abilitati = f.campi_abilitati.includes(nome)
        ? f.campi_abilitati.filter(c => c !== nome)
        : [...f.campi_abilitati, nome]
      return { ...f, campi_abilitati: abilitati }
    })
  }

  const handleSave = async () => {
    if (!form.cliente || !form.data_prossima_verifica) return
    setSaving(true)
    try {
      const payload: NuovaVerifica = { ...form, created_by_name: currentUserName }
      if (editing && selected) {
        await onUpdate(selected.id, payload)
      } else {
        await onAdd(payload)
      }
      setShowForm(false)
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await onDelete(id)
      if (selected?.id === id) setSelected(null)
      setConfirmDelete(null)
    } finally {
      setDeleting(null)
    }
  }

  const handleCompleta = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await onCompleta(selected.id, completaForm)
      setShowCompleta(false)
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="ml-auto w-full max-w-5xl h-full flex flex-col"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <ShieldCheck size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Verifiche Tecnoalarm</h2>
                  <p className="text-slate-400 text-xs">Manutenzioni Programmate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRefetch}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="flex gap-3 px-6 py-3 border-b border-white/5">
              {[
                { label: 'Scadute',    val: scadute,    cls: 'text-red-400',    bg: 'rgba(239,68,68,0.15)'   },
                { label: 'In Scadenza',val: inScadenza, cls: 'text-amber-400',  bg: 'rgba(245,158,11,0.15)'  },
                { label: 'Programmate',val: programmate,cls: 'text-blue-400',   bg: 'rgba(99,102,241,0.15)'  },
                { label: 'Completate', val: completate, cls: 'text-emerald-400',bg: 'rgba(16,185,129,0.15)'  },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => setFilterStato(
                    filterStato === s.label.toLowerCase().replace(' ', '_') ? 'tutti'
                    : s.label.toLowerCase().replace(' ', '_')
                  )}
                  className="flex-1 rounded-xl px-3 py-2 text-center cursor-pointer transition-all"
                  style={{ background: s.bg }}
                >
                  <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                </button>
              ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca cliente, codice impianto…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={filterStato}
                onChange={e => setFilterStato(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="tutti">Tutti gli stati</option>
                {Object.entries(STATO_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'rgba(99,102,241,0.8)' }}
              >
                <Plus size={15} />
                Nuova Verifica
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* Lista */}
              <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selected ? 'w-2/5 border-r border-white/10' : 'w-full'}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500">
                      <Loader2 size={24} className="animate-spin mr-2" /> Caricamento…
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                      <ShieldCheck size={36} className="opacity-30" />
                      <span className="text-sm">Nessuna verifica trovata</span>
                      <button onClick={openNew} className="text-indigo-400 text-xs hover:underline">Crea la prima verifica</button>
                    </div>
                  ) : filtered.map(v => {
                    const cfg = STATO_CFG[v.stato]
                    const scad = scadenzaLabel(v)
                    return (
                      <motion.div
                        key={v.id}
                        layout
                        onClick={() => { setSelected(v); setShowForm(false); setShowCompleta(false) }}
                        className={`rounded-xl p-3 cursor-pointer transition-all border ${
                          selected?.id === v.id
                            ? 'border-indigo-500/60 bg-indigo-500/10'
                            : 'border-white/5 bg-white/5 hover:bg-white/8 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm truncate">{v.cliente}</span>
                              {v.codice_impianto && (
                                <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                                  {v.codice_impianto}
                                </span>
                              )}
                            </div>
                            {v.indirizzo && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-slate-500 shrink-0" />
                                <span className="text-slate-500 text-[11px] truncate">{v.indirizzo}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${cfg.cls}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                              {v.tipo_verifica && (
                                <span className="text-[10px] text-slate-500 capitalize">{v.tipo_verifica}</span>
                              )}
                              {scad && <span className={`text-[10px] ${scad.cls}`}>{scad.txt}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(v) }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmDelete(v.id) }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        {v.tecnico_assegnato && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <User size={10} className="text-slate-600" />
                            <span className="text-[10px] text-slate-500">{v.tecnico_assegnato}</span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Dettaglio / Form */}
              <AnimatePresence mode="wait">
                {showForm && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                          <ChevronLeft size={18} />
                        </button>
                        <span className="text-white font-medium text-sm">
                          {editing ? 'Modifica Verifica' : 'Nuova Verifica'}
                        </span>
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={saving || !form.cliente || !form.data_prossima_verifica}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
                        style={{ background: 'rgba(99,102,241,0.8)' }}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salva
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* Anagrafica */}
                      <Section title="Anagrafica Impianto" icon={<Building2 size={13}/>}>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Cliente *">
                            <input value={form.cliente} onChange={e => setForm(f => ({...f, cliente: e.target.value}))}
                              placeholder="Ragione sociale / Nome" className={inputCls} />
                          </Field>
                          <Field label="Codice Impianto">
                            <input value={form.codice_impianto} onChange={e => setForm(f => ({...f, codice_impianto: e.target.value}))}
                              placeholder="es. TEC-0001" className={inputCls} />
                          </Field>
                          <Field label="Indirizzo" wide>
                            <input value={form.indirizzo} onChange={e => setForm(f => ({...f, indirizzo: e.target.value}))}
                              placeholder="Via, Città" className={inputCls} />
                          </Field>
                          <Field label="Telefono">
                            <input value={form.telefono} onChange={e => setForm(f => ({...f, telefono: e.target.value}))}
                              placeholder="+39 …" className={inputCls} />
                          </Field>
                          <Field label="Riferimento">
                            <input value={form.riferimento} onChange={e => setForm(f => ({...f, riferimento: e.target.value}))}
                              placeholder="Persona in loco" className={inputCls} />
                          </Field>
                        </div>
                      </Section>

                      {/* Pianificazione */}
                      <Section title="Pianificazione" icon={<Calendar size={13}/>}>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Tipo Verifica">
                            <select value={form.tipo_verifica} onChange={e => setTipo(e.target.value)} className={inputCls}>
                              {TIPO_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                            </select>
                          </Field>
                          <Field label="Data Prossima Verifica *">
                            <input type="date" value={form.data_prossima_verifica}
                              onChange={e => setForm(f => ({...f, data_prossima_verifica: e.target.value}))}
                              className={inputCls} />
                          </Field>
                          <Field label="Ultima Verifica">
                            <input type="date" value={form.data_ultima_verifica || ''}
                              onChange={e => setForm(f => ({...f, data_ultima_verifica: e.target.value || null}))}
                              className={inputCls} />
                          </Field>
                          <Field label="Tecnico Assegnato">
                            <input value={form.tecnico_assegnato} onChange={e => setForm(f => ({...f, tecnico_assegnato: e.target.value}))}
                              placeholder="Nome tecnico" className={inputCls} />
                          </Field>
                          <Field label="Stato">
                            <select value={form.stato} onChange={e => setForm(f => ({...f, stato: e.target.value as NuovaVerifica['stato']}))}
                              className={inputCls}>
                              {Object.entries(STATO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </Field>
                        </div>
                      </Section>

                      {/* Campi Flessibili — raggruppati per categoria */}
                      {campiDefinizioni.length > 0 && (() => {
                        const CAT_LABEL: Record<string, string> = {
                          attivita:     'Attività',
                          controlli:    'Controlli',
                          misurazioni:  'Misurazioni Tensioni',
                          dati_tecnici: 'Dati Tecnici',
                        }
                        const gruppi = campiDefinizioni.reduce<Record<string, VerificaCampoDefinizione[]>>((acc, c) => {
                          const cat = c.categoria || 'altro'
                          if (!acc[cat]) acc[cat] = []
                          acc[cat].push(c)
                          return acc
                        }, {})
                        const catOrder = ['attivita', 'controlli', 'misurazioni', 'dati_tecnici']
                        const cats = [...catOrder.filter(k => gruppi[k]), ...Object.keys(gruppi).filter(k => !catOrder.includes(k))]
                        return (
                          <Section title="Campi Verifica" icon={<ClipboardList size={13}/>}>
                            <p className="text-slate-500 text-xs mb-3">Seleziona i campi da includere in questa verifica:</p>
                            {cats.map(cat => (
                              <div key={cat} className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{CAT_LABEL[cat] || cat}</span>
                                  <div className="flex-1 border-t border-white/8"/>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const names = (gruppi[cat] || []).map(c => c.nome)
                                      const allOn = names.every(n => form.campi_abilitati.includes(n))
                                      if (allOn) {
                                        setForm(f => ({ ...f, campi_abilitati: f.campi_abilitati.filter(n => !names.includes(n)) }))
                                      } else {
                                        setForm(f => ({ ...f, campi_abilitati: Array.from(new Set([...f.campi_abilitati, ...names])) }))
                                      }
                                    }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    {(gruppi[cat] || []).every(c => form.campi_abilitati.includes(c.nome)) ? 'Deseleziona tutti' : 'Seleziona tutti'}
                                  </button>
                                </div>
                                <div className={`grid gap-2 ${cat === 'controlli' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {(gruppi[cat] || []).map(campo => {
                                    const abilitato = form.campi_abilitati.includes(campo.nome)
                                    return (
                                      <button
                                        key={campo.nome}
                                        type="button"
                                        onClick={() => toggleCampo(campo.nome)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                          abilitato
                                            ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                        }`}
                                      >
                                        <span>{campo.etichetta}</span>
                                        {abilitato
                                          ? <ToggleRight size={14} className="text-indigo-400"/>
                                          : <ToggleLeft size={14} className="text-slate-600"/>
                                        }
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </Section>
                        )
                      })()}

                      {/* Note */}
                      <Section title="Note" icon={<FileText size={13}/>}>
                        <Field label="Note Tecniche" wide>
                          <textarea value={form.note_tecniche} onChange={e => setForm(f => ({...f, note_tecniche: e.target.value}))}
                            rows={3} placeholder="Note tecniche sull'impianto…" className={`${inputCls} resize-none`} />
                        </Field>
                        <Field label="Note Interne" wide>
                          <textarea value={form.note_interne} onChange={e => setForm(f => ({...f, note_interne: e.target.value}))}
                            rows={2} placeholder="Note interne (non visibili al cliente)…" className={`${inputCls} resize-none`} />
                        </Field>
                      </Section>
                    </div>
                  </motion.div>
                )}

                {!showForm && selected && !showCompleta && (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors">
                          <ChevronLeft size={18} />
                        </button>
                        <span className="text-white font-medium text-sm truncate max-w-[200px]">{selected.cliente}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(selected)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 transition-colors">
                          <Pencil size={12} /> Modifica
                        </button>
                        {selected.stato !== 'completata' && selected.stato !== 'annullata' && (
                          <button
                            onClick={() => {
                              setCompletaForm({ esito: 'positivo', note_tecniche: selected.note_tecniche, firma_cliente: false, firma_tecnico: false, campi_valori: { ...selected.campi_valori } })
                              setShowCompleta(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors">
                            <BadgeCheck size={12} /> Completa
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {/* Status header */}
                      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <ShieldCheck size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{selected.cliente}</div>
                          {selected.codice_impianto && (
                            <div className="text-slate-400 text-xs font-mono">{selected.codice_impianto}</div>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${STATO_CFG[selected.stato].cls}`}>
                          {STATO_CFG[selected.stato].icon} {STATO_CFG[selected.stato].label}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <InfoCard icon={<MapPin size={13}/>} label="Indirizzo" value={selected.indirizzo || '—'} />
                        <InfoCard icon={<Phone size={13}/>} label="Telefono" value={selected.telefono || '—'} />
                        <InfoCard icon={<User size={13}/>} label="Riferimento" value={selected.riferimento || '—'} />
                        <InfoCard icon={<Wrench size={13}/>} label="Tecnico" value={selected.tecnico_assegnato || '—'} />
                        <InfoCard icon={<Calendar size={13}/>} label="Tipo" value={selected.tipo_verifica} />
                        <InfoCard icon={<Calendar size={13}/>} label="Prossima Verifica" value={fmtDate(selected.data_prossima_verifica)}
                          highlight={scadenzaLabel(selected)?.cls} />
                        {selected.data_ultima_verifica && (
                          <InfoCard icon={<Clock size={13}/>} label="Ultima Verifica" value={fmtDate(selected.data_ultima_verifica)} />
                        )}
                        {selected.data_esecuzione && (
                          <InfoCard icon={<CheckCircle2 size={13}/>} label="Eseguita il" value={fmtDate(selected.data_esecuzione)} />
                        )}
                        {selected.esito && (
                          <InfoCard icon={<BadgeCheck size={13}/>} label="Esito"
                            value={ESITO_CFG[selected.esito as keyof typeof ESITO_CFG]?.label || selected.esito} />
                        )}
                      </div>

                      {/* Campi abilitati */}
                      {selected.campi_abilitati.length > 0 && (
                        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Campi Verifica</div>
                          <div className="flex flex-wrap gap-2">
                            {selected.campi_abilitati.map(campo => {
                              const def = campiDefinizioni.find(c => c.nome === campo)
                              const val = selected.campi_valori[campo]
                              return (
                                <div key={campo} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                                  <span className="text-slate-400 text-[11px]">{def?.etichetta || campo}</span>
                                  {val !== undefined && val !== null && (
                                    <span className="text-white text-[11px] font-medium">
                                      {typeof val === 'boolean' ? (val ? '✓' : '✗') : String(val)}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Note */}
                      {selected.note_tecniche && (
                        <div className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Note Tecniche</div>
                          <p className="text-slate-300 text-sm whitespace-pre-wrap">{selected.note_tecniche}</p>
                        </div>
                      )}
                      {selected.note_interne && (
                        <div className="rounded-xl p-4 border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.05)' }}>
                          <div className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-2">Note Interne</div>
                          <p className="text-slate-300 text-sm whitespace-pre-wrap">{selected.note_interne}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {showCompleta && selected && (
                  <motion.div
                    key="completa"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowCompleta(false)} className="text-slate-400 hover:text-white transition-colors">
                          <ChevronLeft size={18} />
                        </button>
                        <span className="text-white font-medium text-sm">Chiudi Verifica</span>
                      </div>
                      <button onClick={handleCompleta} disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: 'rgba(16,185,129,0.7)' }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Conferma
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      <Section title="Esito Verifica" icon={<BadgeCheck size={13}/>}>
                        <div className="flex gap-2">
                          {Object.entries(ESITO_CFG).map(([k, v]) => (
                            <button key={k} type="button"
                              onClick={() => setCompletaForm(f => ({ ...f, esito: k as VerificaTecnoalarm['esito'] }))}
                              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                                completaForm.esito === k
                                  ? `ring-1 ${v.cls}`
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                              }`}>
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </Section>

                      {/* Campi flessibili da compilare — raggruppati per categoria */}
                      {selected.campi_abilitati.length > 0 && (() => {
                        const CAT_LABEL: Record<string, string> = {
                          attivita:     'Attività',
                          controlli:    'Controlli',
                          misurazioni:  'Misurazioni Tensioni',
                          dati_tecnici: 'Dati Tecnici',
                        }
                        const catOrder = ['attivita', 'controlli', 'misurazioni', 'dati_tecnici']
                        const abilitateDefs = selected.campi_abilitati
                          .map(nome => campiDefinizioni.find(c => c.nome === nome))
                          .filter(Boolean) as VerificaCampoDefinizione[]
                        const gruppi = abilitateDefs.reduce<Record<string, VerificaCampoDefinizione[]>>((acc, c) => {
                          const cat = c.categoria || 'altro'
                          if (!acc[cat]) acc[cat] = []
                          acc[cat].push(c)
                          return acc
                        }, {})
                        const cats = [...catOrder.filter(k => gruppi[k]), ...Object.keys(gruppi).filter(k => !catOrder.includes(k))]

                        const renderInput = (def: VerificaCampoDefinizione) => {
                          const campo = def.nome
                          if (def.tipo === 'boolean') return (
                            <div className="flex items-center gap-3">
                              {['true', 'false'].map(v => (
                                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                                  <input type="radio" name={campo}
                                    checked={String(completaForm.campi_valori[campo]) === v}
                                    onChange={() => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [campo]: v === 'true' } }))}
                                    className="accent-indigo-500" />
                                  <span className="text-slate-300 text-xs">{v === 'true' ? 'Sì / OK' : 'No / KO'}</span>
                                </label>
                              ))}
                            </div>
                          )
                          if (def.tipo === 'select') return (
                            <select
                              value={String(completaForm.campi_valori[campo] || '')}
                              onChange={e => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [campo]: e.target.value } }))}
                              className={inputCls}>
                              <option value="">— Seleziona —</option>
                              {def.opzioni.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )
                          if (def.tipo === 'note') return (
                            <textarea
                              value={String(completaForm.campi_valori[campo] || '')}
                              onChange={e => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [campo]: e.target.value } }))}
                              rows={2} className={`${inputCls} resize-none`} />
                          )
                          return (
                            <input
                              type={def.tipo === 'numero' ? 'number' : def.tipo === 'data' ? 'date' : 'text'}
                              value={String(completaForm.campi_valori[campo] || '')}
                              onChange={e => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [campo]: e.target.value } }))}
                              className={inputCls} />
                          )
                        }

                        return (
                          <>
                            {cats.map(cat => (
                              <Section key={cat} title={CAT_LABEL[cat] || cat} icon={<ClipboardList size={13}/>}>
                                {cat === 'controlli' ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {(gruppi[cat] || []).map(def => (
                                      <div key={def.nome} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/8 bg-white/3">
                                        <span className="text-xs text-slate-300">{def.etichetta}</span>
                                        <div className="flex items-center gap-2">
                                          {['true', 'false'].map(v => (
                                            <label key={v} className="flex items-center gap-1 cursor-pointer">
                                              <input type="radio" name={def.nome}
                                                checked={String(completaForm.campi_valori[def.nome]) === v}
                                                onChange={() => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [def.nome]: v === 'true' } }))}
                                                className="accent-indigo-500" />
                                              <span className={`text-xs ${v === 'true' ? 'text-emerald-400' : 'text-red-400'}`}>{v === 'true' ? 'OK' : 'KO'}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {(gruppi[cat] || []).map(def => (
                                      <Field key={def.nome} label={def.etichetta + (def.obbligatorio ? ' *' : '')}>
                                        {renderInput(def)}
                                      </Field>
                                    ))}
                                  </div>
                                )}
                              </Section>
                            ))}
                            {/* Campi senza definizione */}
                            {selected.campi_abilitati
                              .filter(nome => !campiDefinizioni.find(c => c.nome === nome))
                              .map(campo => (
                                <Field key={campo} label={campo}>
                                  <input
                                    value={String(completaForm.campi_valori[campo] || '')}
                                    onChange={e => setCompletaForm(f => ({ ...f, campi_valori: { ...f.campi_valori, [campo]: e.target.value } }))}
                                    className={inputCls} />
                                </Field>
                              ))
                            }
                          </>
                        )
                      })()}

                      <Section title="Note Tecniche" icon={<FileText size={13}/>}>
                        <textarea
                          value={completaForm.note_tecniche}
                          onChange={e => setCompletaForm(f => ({ ...f, note_tecniche: e.target.value }))}
                          rows={3} placeholder="Annotazioni tecniche sulla verifica…"
                          className={`${inputCls} resize-none w-full`} />
                      </Section>

                      <Section title="Firme" icon={<BadgeCheck size={13}/>}>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={completaForm.firma_tecnico}
                              onChange={e => setCompletaForm(f => ({ ...f, firma_tecnico: e.target.checked }))}
                              className="accent-indigo-500 w-4 h-4" />
                            <span className="text-slate-300 text-sm">Firma Tecnico</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={completaForm.firma_cliente}
                              onChange={e => setCompletaForm(f => ({ ...f, firma_cliente: e.target.checked }))}
                              className="accent-indigo-500 w-4 h-4" />
                            <span className="text-slate-300 text-sm">Firma Cliente</span>
                          </label>
                        </div>
                      </Section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Confirm Delete */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)' }}
                onClick={() => setConfirmDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="rounded-2xl p-6 w-80 border border-white/10"
                  style={{ background: '#1e293b' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-red-500/15">
                      <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <span className="text-white font-medium">Elimina Verifica</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-5">Sicuro di voler eliminare questa verifica? L'azione non è reversibile.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                      Annulla
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDelete)}
                      disabled={deleting === confirmDelete}
                      className="flex-1 py-2 rounded-xl text-sm text-white bg-red-500/80 hover:bg-red-500 transition-colors disabled:opacity-50">
                      {deleting === confirmDelete ? 'Eliminando…' : 'Elimina'}
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

// ─── Small sub-components ─────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-indigo-400">{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      {children}
    </div>
  )
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  )
}

function InfoCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-xl p-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="text-slate-500">{icon}</div>
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-sm font-medium ${highlight || 'text-white'}`}>{value}</span>
    </div>
  )
}
