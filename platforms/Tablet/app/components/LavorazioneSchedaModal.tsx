'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, Trash2, Plus, User, Package,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { Lavorazione } from '../hooks/useLavorazioni'
import { OreEntry, MaterialeEntry } from '../hooks/useLavorazioneOre'

interface LavorazioneSchedaModalProps {
  isOpen: boolean
  onClose: () => void
  lavorazione: Lavorazione | null
  oreEntries: OreEntry[]
  materialiEntries: MaterialeEntry[]
  loading: boolean
  onAddOre: (entry: Omit<OreEntry, 'id' | 'created_at'>) => Promise<{ data: any; error: any }>
  onDeleteOre: (id: string) => Promise<boolean>
  onAddMateriale: (entry: Omit<MaterialeEntry, 'id' | 'created_at'>) => Promise<{ data: any; error: any }>
  onDeleteMateriale: (id: string) => Promise<boolean>
  totalMinutes: number
  minutesByPerson: Record<string, number>
  teamMembers?: Array<{ id: string; full_name: string }>
  currentUser?: { id: string; full_name?: string; email?: string } | null
}

function fmtMinutes(min: number): string {
  if (min <= 0) return '0h'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function calcMinutes(start: string, end: string): number {
  const [hs, ms] = start.split(':').map(Number)
  const [he, me] = end.split(':').map(Number)
  return Math.max(0, (he * 60 + me) - (hs * 60 + ms))
}

const UNITS = ['pz', 'm', 'cm', 'ml', 'kg', 'g', 'l', 'mt', 'rotolo', 'conf', 'bobina']

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  da_fare:   { label: '📋 Da fare',    cls: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  in_corso:  { label: '🔄 In corso',   cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  completata:{ label: '✅ Completata', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  annullata: { label: '❌ Annullata',  cls: 'text-red-600 bg-red-50 border-red-200' },
}

export default function LavorazioneSchedaModal({
  isOpen, onClose, lavorazione,
  oreEntries, materialiEntries, loading,
  onAddOre, onDeleteOre, onAddMateriale, onDeleteMateriale,
  totalMinutes, minutesByPerson,
  teamMembers = [], currentUser,
}: LavorazioneSchedaModalProps) {
  const [tab, setTab] = useState<'ore' | 'materiali'>('ore')

  // ── Ore form state ──
  const [showOreForm, setShowOreForm] = useState(false)
  const [oreDate, setOreDate]         = useState(new Date().toISOString().slice(0, 10))
  const [oreUserName, setOreUserName] = useState('')
  const [oreStart, setOreStart]       = useState('08:00')
  const [oreEnd, setOreEnd]           = useState('17:00')
  const [oreNotes, setOreNotes]       = useState('')
  const [oreLoading, setOreLoading]   = useState(false)
  const [oreError, setOreError]       = useState('')

  // ── Materiale form state ──
  const [showMatForm, setShowMatForm] = useState(false)
  const [matName, setMatName]         = useState('')
  const [matQty, setMatQty]           = useState('1')
  const [matUnit, setMatUnit]         = useState('pz')
  const [matNotes, setMatNotes]       = useState('')
  const [matLoading, setMatLoading]   = useState(false)
  const [matError, setMatError]       = useState('')

  useEffect(() => {
    if (isOpen && currentUser) {
      setOreUserName(currentUser.full_name || currentUser.email?.split('@')[0] || '')
    }
    if (!isOpen) {
      setShowOreForm(false)
      setShowMatForm(false)
      setOreError('')
      setMatError('')
    }
  }, [isOpen, currentUser])

  if (!isOpen || !lavorazione) return null

  const oreDuration = calcMinutes(oreStart, oreEnd)
  const stCfg = STATUS_CFG[lavorazione.status] || STATUS_CFG.da_fare

  const handleAddOre = async () => {
    if (!oreUserName.trim()) { setOreError('Inserisci il nome del tecnico'); return }
    if (oreDuration <= 0) { setOreError("L'ora di fine deve essere dopo quella di inizio"); return }
    setOreLoading(true); setOreError('')
    const result = await onAddOre({
      lavorazione_id: lavorazione.id,
      user_id: currentUser?.id || '',
      user_name: oreUserName.trim(),
      work_date: oreDate,
      start_time: oreStart,
      end_time: oreEnd,
      minutes: oreDuration,
      notes: oreNotes.trim(),
    })
    if (result.error) {
      setOreError(result.error.message || 'Errore salvataggio')
    } else {
      setShowOreForm(false)
      setOreNotes('')
      setOreStart('08:00')
      setOreEnd('17:00')
    }
    setOreLoading(false)
  }

  const handleAddMateriale = async () => {
    if (!matName.trim()) { setMatError('Inserisci il nome del materiale'); return }
    const qty = parseFloat(matQty)
    if (isNaN(qty) || qty <= 0) { setMatError('Quantità non valida'); return }
    setMatLoading(true); setMatError('')
    const result = await onAddMateriale({
      lavorazione_id: lavorazione.id,
      user_id: currentUser?.id || '',
      user_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || '',
      product_id: null,
      product_name: matName.trim(),
      product_sku: '',
      quantity: qty,
      unit: matUnit,
      notes: matNotes.trim(),
    })
    if (result.error) {
      setMatError(result.error.message || 'Errore salvataggio')
    } else {
      setShowMatForm(false)
      setMatName('')
      setMatQty('1')
      setMatUnit('pz')
      setMatNotes('')
    }
    setMatLoading(false)
  }

  // Group ore by date
  const oreByDate: Record<string, OreEntry[]> = {}
  for (const e of oreEntries) {
    if (!oreByDate[e.work_date]) oreByDate[e.work_date] = []
    oreByDate[e.work_date].push(e)
  }
  const sortedDates = Object.keys(oreByDate).sort()

  return (
    <div
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">

          {/* ── Header ── */}
          <div className="px-5 py-4 border-b border-slate-100/80 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-tight">{lavorazione.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stCfg.cls}`}>
                      {stCfg.label}
                    </span>
                    {lavorazione.assigned_to && (
                      <span className="text-xs text-slate-400">👤 {lavorazione.assigned_to}</span>
                    )}
                    {(lavorazione.address || lavorazione.city) && (
                      <span className="text-xs text-slate-400">
                        📍 {[lavorazione.address, lavorazione.city].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-slate-400 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-violet-700">{fmtMinutes(totalMinutes)}</p>
                <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider mt-0.5">Ore totali</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-indigo-700">{oreEntries.length}</p>
                <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider mt-0.5">Sessioni</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-amber-700">{materialiEntries.length}</p>
                <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider mt-0.5">Materiali</p>
              </div>
            </div>

            {/* Per-person hours */}
            {Object.keys(minutesByPerson).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(minutesByPerson).map(([name, min]) => (
                  <span key={name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                    👤 {name}: <span className="text-violet-600">{fmtMinutes(min)}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mt-4 bg-slate-100/70 rounded-xl p-1">
              <button
                onClick={() => setTab('ore')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'ore'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Ore lavorate
              </button>
              <button
                onClick={() => setTab('materiali')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'materiali'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Materiali usati
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">

                {/* ════════════════ ORE TAB ════════════════ */}
                {tab === 'ore' && (
                  <motion.div key="ore" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-4">

                    {/* Add ore toggle button */}
                    <button
                      onClick={() => { setShowOreForm(v => !v); setOreError('') }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 transition-all text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Registra sessione ore
                      {showOreForm ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>

                    <AnimatePresence>
                      {showOreForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-violet-50/60 border border-violet-200/60 rounded-xl p-4 space-y-3">
                            {oreError && (
                              <p className="text-rose-600 text-sm flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 shrink-0" />{oreError}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data</label>
                                <input
                                  type="date"
                                  value={oreDate}
                                  onChange={e => setOreDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tecnico</label>
                                <input
                                  list="scheda-team-list"
                                  value={oreUserName}
                                  onChange={e => setOreUserName(e.target.value)}
                                  placeholder="Nome tecnico"
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                                />
                                <datalist id="scheda-team-list">
                                  {teamMembers.map(tm => (
                                    <option key={tm.id} value={tm.full_name} />
                                  ))}
                                </datalist>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 items-end">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inizio</label>
                                <input
                                  type="time"
                                  value={oreStart}
                                  onChange={e => setOreStart(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fine</label>
                                <input
                                  type="time"
                                  value={oreEnd}
                                  onChange={e => setOreEnd(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                                />
                              </div>
                              <div className="pb-2 text-center">
                                <p className="text-[10px] text-slate-400 mb-0.5">Durata</p>
                                <span className="text-base font-black text-violet-700">
                                  {oreDuration > 0 ? fmtMinutes(oreDuration) : '—'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Note (opzionale)</label>
                              <input
                                value={oreNotes}
                                onChange={e => setOreNotes(e.target.value)}
                                placeholder="Es: cablaggio, configurazione sistema..."
                                className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={handleAddOre}
                                disabled={oreLoading}
                                className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold disabled:opacity-50 transition-all"
                              >
                                {oreLoading ? 'Salvo...' : '✅  Salva sessione'}
                              </button>
                              <button
                                onClick={() => { setShowOreForm(false); setOreError('') }}
                                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-all"
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Ore list grouped by date */}
                    {sortedDates.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-400 text-sm font-medium">Nessuna sessione registrata</p>
                        <p className="text-slate-300 text-xs mt-1">Clicca "Registra sessione ore" per aggiungere</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedDates.map(date => {
                          const sessions = oreByDate[date]
                          const dayMin   = sessions.reduce((s, e) => s + (e.minutes || 0), 0)
                          const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('it-IT', {
                            weekday: 'long', day: 'numeric', month: 'long',
                          })
                          return (
                            <div key={date}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide capitalize">{dateLabel}</span>
                                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">
                                  {fmtMinutes(dayMin)}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {sessions.map(session => (
                                  <div key={session.id} className="bg-white border border-slate-200/50 rounded-xl p-3 flex items-center gap-3 group hover:bg-slate-50/50 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                      <User className="w-4 h-4 text-violet-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <span className="text-sm font-bold text-slate-700">{session.user_name || 'N/D'}</span>
                                        <span className="text-xs text-slate-400">
                                          {session.start_time.slice(0, 5)} → {session.end_time.slice(0, 5)}
                                        </span>
                                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md">
                                          {fmtMinutes(session.minutes || 0)}
                                        </span>
                                      </div>
                                      {session.notes && (
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">📝 {session.notes}</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => onDeleteOre(session.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                      title="Elimina sessione"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ════════════════ MATERIALI TAB ════════════════ */}
                {tab === 'materiali' && (
                  <motion.div key="materiali" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">

                    {/* Add materiale button */}
                    <button
                      onClick={() => { setShowMatForm(v => !v); setMatError('') }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi materiale
                      {showMatForm ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>

                    <AnimatePresence>
                      {showMatForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 space-y-3">
                            {matError && (
                              <p className="text-rose-600 text-sm flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 shrink-0" />{matError}
                              </p>
                            )}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Nome materiale *
                              </label>
                              <input
                                value={matName}
                                onChange={e => setMatName(e.target.value)}
                                placeholder="Es: cavo 2.5mm, presa esterna, tappo PG11..."
                                className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Quantità</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={matQty}
                                  onChange={e => setMatQty(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unità</label>
                                <select
                                  value={matUnit}
                                  onChange={e => setMatUnit(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                                >
                                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Note (opzionale)</label>
                              <input
                                value={matNotes}
                                onChange={e => setMatNotes(e.target.value)}
                                placeholder="Descrizione aggiuntiva..."
                                className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={handleAddMateriale}
                                disabled={matLoading}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition-all"
                              >
                                {matLoading ? 'Salvo...' : '✅  Aggiungi'}
                              </button>
                              <button
                                onClick={() => { setShowMatForm(false); setMatError('') }}
                                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-all"
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Materials list */}
                    {materialiEntries.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-400 text-sm font-medium">Nessun materiale registrato</p>
                        <p className="text-slate-300 text-xs mt-1">Aggiungi i materiali extra utilizzati</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {materialiEntries.map(mat => (
                          <div key={mat.id} className="bg-white border border-slate-200/50 rounded-xl p-3 flex items-center gap-3 group hover:bg-slate-50/50 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-sm font-bold text-slate-700">{mat.product_name}</span>
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                                  {mat.quantity} {mat.unit}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {mat.user_name && <span className="text-xs text-slate-400">👤 {mat.user_name}</span>}
                                {mat.notes && <span className="text-xs text-slate-400">· 📝 {mat.notes}</span>}
                                <span className="text-xs text-slate-300">
                                  {new Date(mat.created_at).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteMateriale(mat.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Elimina materiale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
