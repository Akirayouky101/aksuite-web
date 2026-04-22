'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, ChevronLeft, ChevronRight, Plus, Trash2, Users, BarChart2, Pencil, ShieldCheck, Send, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WorkRecord {
  id: string
  user_id: string
  profile_id: string
  date: string
  hours_worked: number
  check_in: string | null
  check_out: string | null
  break_minutes: number
  notes: string | null
  created_at: string
}

const BREAK_OPTIONS = [
  { value: 0,  label: 'Continuato' },
  { value: 15, label: "15'" },
  { value: 30, label: "30'" },
  { value: 45, label: "45'" },
  { value: 60, label: '1h (default)' },
] as const

function fmtBreak(min: number): string {
  if (min === 0) return 'Continuato'
  if (min < 60) return `Pausa ${min}'`
  const h = min / 60
  return `Pausa ${h % 1 === 0 ? h : h.toFixed(1)}h`
}

function calcHoursWeb(checkIn: string, checkOut: string, breakMin: number): number {
  const [hi, mi] = checkIn.split(':').map(Number)
  const [ho, mo] = checkOut.split(':').map(Number)
  const raw = ho * 60 + mo - (hi * 60 + mi)
  return Math.max(0, parseFloat(((raw - breakMin) / 60).toFixed(2)))
}

interface Profile {
  id: string
  full_name: string | null
  email: string | null
}

interface ModCode {
  id: string
  record_id: string
  profile_id: string
  code: string | null
  expires_at: string
  used_at: string | null
  status: string
}

type EditStep = 'request' | 'verify' | 'edit'

interface EditModal {
  record: WorkRecord
  step: EditStep
  codeInput: string
  error: string
  editForm: { check_in: string; check_out: string; break_minutes: number; notes: string; hours_worked: string }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface Props {
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
}

const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function pad(n: number) { return n.toString().padStart(2, '0') }

function monthRange(year: number, month: number): [string, string] {
  const from = `${year}-${pad(month + 1)}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`
  return [from, to]
}

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

function initials(name: string | null, email: string | null) {
  const n = name || email || '?'
  const parts = n.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return n.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]

export default function TimbraturePanel({ isOpen, onClose, isAdmin = false }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ profile_id: '', date: '', check_in: '', check_out: '', hours_worked: '', break_minutes: 60, notes: '' })
  const [saving, setSaving] = useState(false)
  const [modCodes, setModCodes] = useState<ModCode[]>([])
  const [editModal, setEditModal] = useState<EditModal | null>(null)

  const fetchModCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('hr_modification_codes')
      .select('*')
      .in('status', ['requested', 'code_sent'])
    if (error) {
      console.error('[TimbraturePanel] hr_modification_codes fetch error:', error.message, error.code)
    }
    setModCodes((data || []) as ModCode[])
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [from, to] = monthRange(year, month)
    const [{ data: recs }, { data: profs }] = await Promise.all([
      supabase.from('hr_work_records').select('*').gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
    ])
    setRecords((recs || []) as WorkRecord[])
    setProfiles((profs || []) as Profile[])
    setLoading(false)
    await fetchModCodes()
  }, [year, month, fetchModCodes])

  useEffect(() => { if (isOpen) fetchData() }, [isOpen, fetchData])

  // Realtime subscription: aggiorna i campanelli in tempo reale
  useEffect(() => {
    if (!isOpen) return
    const channel = supabase
      .channel('mod-codes-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_modification_codes' }, () => {
        fetchModCodes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isOpen, fetchModCodes])

  const handleOpenEdit = (record: WorkRecord) => {
    const pending = modCodes.find(c => c.record_id === record.id)
    const step: EditStep = pending?.status === 'code_sent' ? 'verify' : 'request'
    setEditModal({
      record,
      step,
      codeInput: '',
      error: '',
      editForm: {
        check_in: record.check_in || '',
        check_out: record.check_out || '',
        break_minutes: record.break_minutes ?? 60,
        notes: record.notes || '',
        hours_worked: String(record.hours_worked),
      },
    })
  }

  const handleSendCode = async () => {
    if (!editModal) return
    const code = generateCode()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const existing = modCodes.find(c => c.record_id === editModal.record.id && c.status === 'requested')
    if (existing) {
      await supabase.from('hr_modification_codes')
        .update({ code, status: 'code_sent', expires_at: expires })
        .eq('id', existing.id)
    } else {
      await supabase.from('hr_modification_codes').insert([{
        record_id: editModal.record.id,
        profile_id: editModal.record.profile_id,
        code,
        status: 'code_sent',
        expires_at: expires,
      }])
    }
    fetchModCodes()
    setEditModal(prev => prev ? { ...prev, step: 'verify' } : null)
  }

  const handleVerifyCode = async () => {
    if (!editModal) return
    const { count } = await supabase
      .from('hr_modification_codes')
      .update({ used_at: new Date().toISOString() }, { count: 'exact' })
      .eq('record_id', editModal.record.id)
      .eq('code', editModal.codeInput.toUpperCase().trim())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
    if (count && count > 0) {
      setEditModal(prev => prev ? { ...prev, step: 'edit', error: '' } : null)
    } else {
      setEditModal(prev => prev ? { ...prev, error: 'Codice non valido o scaduto' } : null)
    }
  }

  const handleEditSave = async () => {
    if (!editModal) return
    const { editForm, record } = editModal
    let hrs: number
    if (editForm.check_in && editForm.check_out) {
      hrs = calcHoursWeb(editForm.check_in, editForm.check_out, editForm.break_minutes)
    } else {
      hrs = parseFloat(editForm.hours_worked)
    }
    if (isNaN(hrs) || hrs < 0) return
    setSaving(true)
    const { error } = await supabase.from('hr_work_records').update({
      check_in: editForm.check_in || null,
      check_out: editForm.check_out || null,
      hours_worked: hrs,
      break_minutes: editForm.break_minutes,
      notes: editForm.notes || null,
    }).eq('id', record.id)
    setSaving(false)
    if (!error) {
      await supabase.from('hr_modification_codes').delete().eq('record_id', record.id)
      setEditModal(null); fetchData()
    }
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  // Group records by profile
  const byProfile = useMemo(() => {
    const map = new Map<string, { profile: Profile; records: WorkRecord[]; totalHours: number; days: number }>()
    for (const p of profiles) {
      const recs = records.filter(r => r.profile_id === p.id)
      if (recs.length > 0 || !selectedProfile) {
        map.set(p.id, {
          profile: p,
          records: recs,
          totalHours: recs.reduce((s, r) => s + Number(r.hours_worked), 0),
          days: recs.length,
        })
      }
    }
    return map
  }, [records, profiles, selectedProfile])

  const allProfiles = Array.from(byProfile.values())
  const displayProfiles = selectedProfile ? allProfiles.filter(p => p.profile.id === selectedProfile) : allProfiles
  const pendingRecordIds = useMemo(() => new Set(modCodes.map(c => c.record_id)), [modCodes])
  const totalHoursAll = records.reduce((s, r) => s + Number(r.hours_worked), 0)
  const activeDays = new Set(records.map(r => r.date)).size

  const handleAddRecord = async () => {
    if (!addForm.profile_id || !addForm.date) return
    let hrs: number
    if (addForm.check_in && addForm.check_out) {
      hrs = calcHoursWeb(addForm.check_in, addForm.check_out, addForm.break_minutes)
    } else {
      hrs = parseFloat(addForm.hours_worked)
    }
    if (isNaN(hrs) || hrs < 0) return
    setSaving(true)
    const { error } = await supabase.from('hr_work_records').upsert([{
      user_id: addForm.profile_id,
      profile_id: addForm.profile_id,
      date: addForm.date,
      check_in: addForm.check_in || null,
      check_out: addForm.check_out || null,
      hours_worked: hrs,
      break_minutes: addForm.break_minutes,
      notes: addForm.notes || null,
    }], { onConflict: 'profile_id,date' })
    setSaving(false)
    if (!error) {
      setShowAddForm(false)
      setAddForm({ profile_id: '', date: '', check_in: '', check_out: '', hours_worked: '', break_minutes: 60, notes: '' })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('hr_work_records').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl shadow-slate-300/40 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Timbrature</h2>
                <p className="text-white/70 text-xs mt-0.5">Gestione presenze dipendenti</p>
              </div>
            </div>
            <button title="Chiudi" onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Month nav + stats */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button title="Mese precedente" onClick={prevMonth} className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <span className="font-bold text-slate-800 min-w-[140px] text-center">{MONTHS[month]} {year}</span>
              <button title="Mese successivo" onClick={nextMonth} className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BarChart2 size={14} className="text-orange-500" />
                <span className="font-semibold text-slate-700">{fmtHours(totalHoursAll)}</span>
                <span>totali</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={14} className="text-blue-500" />
                <span className="font-semibold text-slate-700">{allProfiles.filter(p => p.days > 0).length}</span>
                <span>presenti</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Plus size={14} /> Aggiungi
                </button>
              )}
            </div>
          </div>

          {/* Filter by employee */}
          <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto border-b border-slate-100 flex-shrink-0">
            <button
              onClick={() => setSelectedProfile(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${!selectedProfile ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Tutti
            </button>
            {profiles.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(prev => prev === p.id ? null : p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${selectedProfile === p.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {p.full_name?.split(' ')[0] || p.email || '?'}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : displayProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Clock className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">Nessuna timbratura per {MONTHS[month]}</p>
                <p className="text-slate-400 text-sm mt-1">Le timbrature registrate appariranno qui</p>
              </div>
            ) : (
              displayProfiles.map(({ profile, records: recs, totalHours, days }, idx) => (
                <div key={profile.id} className="bg-slate-50/80 rounded-2xl border border-slate-200/60 overflow-hidden">
                  {/* Employee header */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-200/60">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {initials(profile.full_name, profile.email)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{profile.full_name || profile.email}</p>
                      <p className="text-xs text-slate-500">{days} giorni · {fmtHours(totalHours)} totali</p>
                    </div>
                    {totalHours > 0 && (
                      <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold">
                        {fmtHours(totalHours)}
                      </div>
                    )}
                  </div>

                  {/* Records */}
                  {recs.length === 0 ? (
                    <p className="text-slate-400 text-sm px-4 py-3 text-center">Nessuna timbratura questo mese</p>
                  ) : (
                    <div className="divide-y divide-slate-200/60">
                      {recs.map(r => {
                        const hasPending = pendingRecordIds.has(r.id)
                        return (
                        <div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-colors group ${hasPending ? 'bg-amber-50' : ''}`}>
                          <div className="w-16 flex-shrink-0">
                            <p className="text-xs font-bold text-slate-700">
                              {new Date(r.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(r.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short' })}
                            </p>
                          </div>
                          <div className="flex-1">
                            {r.check_in && (
                              <div className="flex items-center gap-1">
                                {hasPending && <Bell size={11} className="text-amber-500 animate-pulse flex-shrink-0" />}
                                <p className={`text-xs ${hasPending ? 'text-amber-700 font-bold animate-pulse' : 'text-slate-600'}`}>
                                  {r.check_in}{r.check_out ? ` → ${r.check_out}` : ' → in corso'}
                                </p>
                              </div>
                            )}
                            {hasPending && (
                              <p className="text-xs text-amber-600 font-semibold mt-0.5">Richiesta modifica in attesa</p>
                            )}
                            <p className={`text-xs font-semibold mt-0.5 ${(r.break_minutes ?? 60) === 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                              {fmtBreak(r.break_minutes ?? 60)}
                            </p>
                            {r.notes && <p className="text-xs text-slate-400 mt-0.5">{r.notes}</p>}
                          </div>
                          <div className="text-sm font-bold text-slate-700 w-12 text-right">
                            {fmtHours(Number(r.hours_worked))}
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                title="Richiedi modifica"
                                onClick={() => handleOpenEdit(r)}
                                className="w-7 h-7 flex items-center justify-center text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                title="Elimina timbratura"
                                onClick={() => handleDelete(r.id)}
                                className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Edit record modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setEditModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Modifica timbratura</h3>
                <button title="Chiudi" onClick={() => setEditModal(null)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Record info */}
              <div className="bg-slate-50 rounded-xl p-3 mb-5">
                <p className="text-sm font-semibold text-slate-700">
                  {profiles.find(p => p.id === editModal.record.profile_id)?.full_name || '—'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(editModal.record.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                {editModal.record.check_in && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editModal.record.check_in}{editModal.record.check_out ? ` → ${editModal.record.check_out}` : ' → in corso'}
                  </p>
                )}
              </div>

              {editModal.step === 'request' && (
                <div>
                  {modCodes.find(c => c.record_id === editModal.record.id)?.status === 'requested' ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-sm text-slate-600">
                          Il dipendente ha richiesto la modifica. Genera un codice e comunicaglielo verbalmente.
                        </p>
                      </div>
                      <button
                        onClick={handleSendCode}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
                      >
                        Genera codice
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Send className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-sm text-slate-600">
                          Per modificare questa timbratura serve il consenso del dipendente.
                          Genera un codice da comunicargli verbalmente.
                        </p>
                      </div>
                      <button
                        onClick={handleSendCode}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-amber-600 transition-colors"
                      >
                        Genera codice
                      </button>
                    </>
                  )}
                </div>
              )}

              {editModal.step === 'verify' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-sm text-slate-600">
                      Richiesta inviata. Inserisci il codice a 6 caratteri che ti fornirà il dipendente.
                    </p>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Codice (es. A3X7KP)"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-xl font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:border-orange-400 uppercase"
                    value={editModal.codeInput}
                    onChange={e => setEditModal(prev => prev ? { ...prev, codeInput: e.target.value.toUpperCase(), error: '' } : null)}
                  />
                  {editModal.error && (
                    <p className="text-red-500 text-xs font-semibold text-center mt-2">{editModal.error}</p>
                  )}
                  <button
                    onClick={handleVerifyCode}
                    disabled={editModal.codeInput.length < 6}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-amber-600 transition-colors disabled:opacity-40"
                  >
                    Verifica codice
                  </button>
                </div>
              )}

              {editModal.step === 'edit' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-600">Codice verificato — modifica abilitata</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Entrata</label>
                      <input type="time" title="Orario entrata" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" value={editModal.editForm.check_in} onChange={e => setEditModal(prev => prev ? { ...prev, editForm: { ...prev.editForm, check_in: e.target.value } } : null)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Uscita</label>
                      <input type="time" title="Orario uscita" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" value={editModal.editForm.check_out} onChange={e => setEditModal(prev => prev ? { ...prev, editForm: { ...prev.editForm, check_out: e.target.value } } : null)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Pausa</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {BREAK_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setEditModal(prev => prev ? { ...prev, editForm: { ...prev.editForm, break_minutes: opt.value } } : null)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            editModal.editForm.break_minutes === opt.value
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {editModal.editForm.check_in && editModal.editForm.check_out && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                        Ore nette: {calcHoursWeb(editModal.editForm.check_in, editModal.editForm.check_out, editModal.editForm.break_minutes).toFixed(2)}h
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Note</label>
                    <input type="text" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Facoltativo" value={editModal.editForm.notes} onChange={e => setEditModal(prev => prev ? { ...prev, editForm: { ...prev.editForm, notes: e.target.value } } : null)} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors">Annulla</button>
                    <button onClick={handleEditSave} disabled={saving} className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                      {saving ? 'Salvo...' : 'Salva modifiche'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAddForm(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aggiungi timbratura</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Dipendente</label>
                  <select
                    title="Dipendente"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={addForm.profile_id}
                    onChange={e => setAddForm(p => ({ ...p, profile_id: e.target.value }))}
                  >
                    <option value="">Seleziona dipendente</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Data</label>
                  <input type="date" title="Data" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Entrata</label>
                    <input type="time" title="Entrata" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" value={addForm.check_in} onChange={e => setAddForm(p => ({ ...p, check_in: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Uscita</label>
                    <input type="time" title="Uscita" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" value={addForm.check_out} onChange={e => setAddForm(p => ({ ...p, check_out: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Pausa</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {BREAK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAddForm(p => ({ ...p, break_minutes: opt.value }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          addForm.break_minutes === opt.value
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {addForm.check_in && addForm.check_out && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                      Ore nette: {calcHoursWeb(addForm.check_in, addForm.check_out, addForm.break_minutes).toFixed(2)}h
                    </p>
                  )}
                  {!(addForm.check_in && addForm.check_out) && (
                    <div className="mt-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Ore (manuale)</label>
                      <input type="number" step="0.5" min="0" max="24" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="8" value={addForm.hours_worked} onChange={e => setAddForm(p => ({ ...p, hours_worked: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Note</label>
                  <input type="text" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Facoltativo" value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors">Annulla</button>
                <button
                  onClick={handleAddRecord}
                  disabled={saving || !addForm.profile_id || !addForm.date}
                  className="flex-2 flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvo...' : 'Salva'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
