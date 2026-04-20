'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserCheck, Search, Users, Calendar, BarChart2,
  Upload, Trash2, FileText, CheckCircle2, XCircle, Clock,
  Briefcase, Phone, Mail, BookOpen, Shield, Heart, Dumbbell,
  Timer, Plus, ChevronDown, ChevronUp, ImageOff, PiggyBank,
  Save, GraduationCap, FileBadge, ClipboardList, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type {
  HRUser, HRProfile, HRDocument, HRLeaveRequest, HRWorkRecord,
  LeaveStatus, LeaveType, DocCategory, ContractType, EmployeeStatus,
} from '../hooks/useHR'

// ─── Config ───────────────────────────────────────────────────────────────────
const CONTRACT_LABELS: Record<ContractType, string> = {
  indeterminato: 'Tempo Indeterminato', determinato: 'Tempo Determinato',
  apprendistato: 'Apprendistato', collaborazione: 'Co.co.co.', stage: 'Stage', consulente: 'Consulente',
}
const STATUS_CFG: Record<EmployeeStatus, { label: string; cls: string }> = {
  attivo:   { label: 'Attivo',    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  in_prova: { label: 'In Prova',  cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  sospeso:  { label: 'Sospeso',   cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  cessato:  { label: 'Cessato',   cls: 'text-slate-500 bg-slate-100 border-slate-200' },
}
const LEAVE_LABELS: Record<LeaveType, string> = {
  ferie: '🏖 Ferie', permesso: '⏰ Permesso', malattia: '🤒 Malattia',
  maternita_paternita: '👶 Maternità/Paternità', altro: '📋 Altro',
}
const LEAVE_STATUS: Record<LeaveStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  in_attesa: { label: 'In Attesa', cls: 'text-amber-700 bg-amber-50', icon: <Clock size={11}/> },
  approvato: { label: 'Approvato', cls: 'text-emerald-700 bg-emerald-50', icon: <CheckCircle2 size={11}/> },
  rifiutato: { label: 'Rifiutato', cls: 'text-red-700 bg-red-50', icon: <XCircle size={11}/> },
}
const DOC_CATS: { key: DocCategory; label: string; icon: React.ReactNode; pill: string }[] = [
  { key: 'corsi',                  label: 'Corsi',                  icon: <GraduationCap size={13}/>, pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'corsi_sicurezza',        label: 'Corsi Sicurezza',        icon: <Shield size={13}/>,        pill: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'documenti',              label: 'Documenti',              icon: <FileText size={13}/>,      pill: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'certificazioni_mediche', label: 'Cert. Mediche',          icon: <Heart size={13}/>,         pill: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'training',               label: 'Training',               icon: <Dumbbell size={13}/>,      pill: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'timbrature',             label: 'Timbrature',             icon: <Timer size={13}/>,         pill: 'bg-orange-100 text-orange-700 border-orange-200' },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface HRPanelProps {
  isOpen: boolean
  onClose: () => void
  hrUsers: HRUser[]
  documents: HRDocument[]
  leaveRequests: HRLeaveRequest[]
  workRecords: HRWorkRecord[]
  isAdmin: boolean
  currentUserId: string
  currentUserName: string
  onUpsertHRProfile: (profileId: string, data: Partial<Omit<HRProfile,'profile_id'|'created_at'>>) => Promise<void>
  onAddDocument: (data: Omit<HRDocument,'id'|'user_id'|'created_at'>) => Promise<HRDocument|null>
  onDeleteDocument: (id: string) => Promise<void>
  onAddLeave: (data: Omit<HRLeaveRequest,'id'|'user_id'|'created_at'>) => Promise<HRLeaveRequest|null>
  onUpdateLeaveStatus: (id: string, status: LeaveStatus, by: string) => Promise<void>
  onDeleteLeave: (id: string) => Promise<void>
  onAddWorkRecord: (data: Omit<HRWorkRecord,'id'|'user_id'|'created_at'>) => Promise<HRWorkRecord|null>
  onDeleteWorkRecord: (id: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcDays(s: string, e: string) { return Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1) }
function calcHoursFromTime(ci: string, co: string) {
  const [ch, cm] = ci.split(':').map(Number)
  const [oh, om] = co.split(':').map(Number)
  return Math.max(0, parseFloat(((oh * 60 + om - ch * 60 - cm) / 60).toFixed(2)))
}
function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('it-IT') }
function monthLabel(y: number, m: number) { return new Date(y, m, 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' }) }

type MainTab = 'dipendenti' | 'ferie' | 'statistiche'
type DetailTab = 'profilo' | 'documenti' | 'timbrature'

// ─── Component ────────────────────────────────────────────────────────────────
export default function HRPanel({
  isOpen, onClose, hrUsers, documents, leaveRequests, workRecords, isAdmin,
  currentUserId, currentUserName,
  onUpsertHRProfile, onAddDocument, onDeleteDocument,
  onAddLeave, onUpdateLeaveStatus, onDeleteLeave,
  onAddWorkRecord, onDeleteWorkRecord,
}: HRPanelProps) {
  const [mainTab, setMainTab] = useState<MainTab>('dipendenti')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('profilo')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | 'tutti'>('tutti')

  // Profilo form
  const [profForm, setProfForm] = useState<Partial<HRProfile>>({})
  const [profDirty, setProfDirty] = useState(false)
  const [savingProf, setSavingProf] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  // Documento form
  const [docCat, setDocCat] = useState<DocCategory>('documenti')
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', expiry_date: '', notes: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docFileRef = useRef<HTMLInputElement>(null)

  // Work record form
  const [showWorkForm, setShowWorkForm] = useState(false)
  const [workForm, setWorkForm] = useState({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' })
  const [savingWork, setSavingWork] = useState(false)
  const [workMonth, setWorkMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })

  // Ferie form
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ profile_id: '', type: 'ferie' as LeaveType, start_date: '', end_date: '', hours: '', notes: '' })
  const [savingLeave, setSavingLeave] = useState(false)

  // Statistiche
  const [statsYear, setStatsYear] = useState(new Date().getFullYear())
  const [statsMonth, setStatsMonth] = useState<number | null>(null) // null = tutto l'anno

  const selectedUser = hrUsers.find(u => u.profile_id === selectedId) || null

  // Sync profilo form when user changes
  const selectUser = (u: HRUser) => {
    setSelectedId(u.profile_id)
    setProfForm(u.hr ? { ...u.hr } : { status: 'attivo', ferie_giorni_anno: 26, ferie_giorni_residui: 26, permessi_ore_anno: 104, permessi_ore_residui: 104 })
    setProfDirty(false)
    setDetailTab('profilo')
    setShowDocForm(false)
    setShowWorkForm(false)
  }

  const filtered = hrUsers.filter(u => {
    if (filterStatus !== 'tutti' && u.hr?.status !== filterStatus) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.hr?.role || '').toLowerCase().includes(q) || (u.hr?.department || '').toLowerCase().includes(q)
  })

  // ── Photo upload ──────────────────────────────────────────────
  const handlePhotoUpload = async (file: File) => {
    if (!selectedId) return
    setUploadingPhoto(true)
    try {
      const resized = await new Promise<Blob>(resolve => {
        const img = new Image()
        img.onload = () => {
          const MAX = 300; let { width, height } = img
          if (width > MAX || height > MAX) { if (width > height) { height = Math.round(height * MAX / width); width = MAX } else { width = Math.round(width * MAX / height); height = MAX } }
          const c = document.createElement('canvas'); c.width = width; c.height = height
          c.getContext('2d')!.drawImage(img, 0, 0, width, height)
          c.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
        }
        img.src = URL.createObjectURL(file)
      })
      const path = `hr/photo_${selectedId}_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, resized, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true })
      if (error) { console.error(error); return }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      const url = urlData.publicUrl
      setProfForm(p => ({ ...p, photo_url: url }))
      setProfDirty(true)
    } finally { setUploadingPhoto(false) }
  }

  // ── Save HR profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!selectedId) return
    setSavingProf(true)
    await onUpsertHRProfile(selectedId, profForm)
    setSavingProf(false)
    setProfDirty(false)
  }

  // ── Upload document ───────────────────────────────────────────
  const handleAddDocument = async () => {
    if (!selectedId || !docForm.name.trim()) return
    setUploadingDoc(true)
    let fileUrl: string | null = null, fileName: string | null = null
    if (docFile) {
      const path = `hr-docs/${selectedId}/${Date.now()}_${docFile.name}`
      const { error } = await supabase.storage.from('product-images').upload(path, docFile, { cacheControl: '3600' })
      if (!error) {
        const { data: u } = supabase.storage.from('product-images').getPublicUrl(path)
        fileUrl = u.publicUrl; fileName = docFile.name
      }
    }
    await onAddDocument({
      profile_id: selectedId, category: docCat,
      name: docForm.name.trim(), file_url: fileUrl, file_name: fileName,
      expiry_date: docForm.expiry_date || null, notes: docForm.notes || null,
    })
    setUploadingDoc(false)
    setShowDocForm(false)
    setDocForm({ name: '', expiry_date: '', notes: '' }); setDocFile(null)
  }

  // ── Add work record ───────────────────────────────────────────
  const handleAddWork = async () => {
    if (!selectedId || !workForm.date) return
    setSavingWork(true)
    let hrs = parseFloat(workForm.hours_worked) || 0
    if (!hrs && workForm.check_in && workForm.check_out) hrs = calcHoursFromTime(workForm.check_in, workForm.check_out)
    await onAddWorkRecord({
      profile_id: selectedId,
      date: workForm.date,
      hours_worked: hrs,
      check_in: workForm.check_in || null,
      check_out: workForm.check_out || null,
      notes: workForm.notes || null,
    })
    setSavingWork(false)
    setShowWorkForm(false)
    setWorkForm({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' })
  }

  // ── Add leave request ─────────────────────────────────────────
  const handleAddLeave = async () => {
    if (!leaveForm.profile_id || !leaveForm.start_date || !leaveForm.end_date) return
    const u = hrUsers.find(u => u.profile_id === leaveForm.profile_id)
    if (!u) return
    setSavingLeave(true)
    await onAddLeave({
      profile_id: leaveForm.profile_id, profile_name: u.name,
      type: leaveForm.type, start_date: leaveForm.start_date, end_date: leaveForm.end_date,
      days: calcDays(leaveForm.start_date, leaveForm.end_date),
      hours: leaveForm.hours ? parseFloat(leaveForm.hours) : null,
      notes: leaveForm.notes || null, status: 'in_attesa', reviewed_by: null, reviewed_at: null,
    })
    setSavingLeave(false)
    setShowLeaveForm(false)
    setLeaveForm({ profile_id: '', type: 'ferie', start_date: '', end_date: '', hours: '', notes: '' })
  }

  // ── Statistics ────────────────────────────────────────────────
  const stats = useMemo(() => {
    return hrUsers.filter(u => u.hr).map(u => {
      const wr = workRecords.filter(r => {
        if (r.profile_id !== u.profile_id) return false
        const d = new Date(r.date)
        if (d.getFullYear() !== statsYear) return false
        if (statsMonth !== null && d.getMonth() !== statsMonth) return false
        return true
      })
      const lr = leaveRequests.filter(r => {
        if (r.profile_id !== u.profile_id || r.status !== 'approvato') return false
        const d = new Date(r.start_date)
        if (d.getFullYear() !== statsYear) return false
        if (statsMonth !== null && d.getMonth() !== statsMonth) return false
        return true
      })
      const oreLav = parseFloat(wr.reduce((s, r) => s + r.hours_worked, 0).toFixed(1))
      const giorniLav = wr.length
      const ferieUsate = parseFloat(lr.filter(r => r.type === 'ferie').reduce((s, r) => s + r.days, 0).toFixed(1))
      const permUsateH = parseFloat(lr.filter(r => r.type === 'permesso').reduce((s, r) => s + (r.hours || r.days * 8), 0).toFixed(1))
      return { u, oreLav, giorniLav, ferieUsate, ferieResidue: u.hr!.ferie_giorni_residui, permUsateH, permResiduiH: u.hr!.permessi_ore_residui }
    })
  }, [hrUsers, workRecords, leaveRequests, statsYear, statsMonth])

  // ─────────────────────────────────────────────────────────────
  const inp = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all"
  const lbl = "block text-[11px] font-medium text-slate-500 mb-1"
  const pendingLeaves = leaveRequests.filter(r => r.status === 'in_attesa').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <UserCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-slate-800 font-bold">HR — Risorse Umane</h2>
              <p className="text-slate-400 text-xs">{hrUsers.filter(u => u.hr && (u.hr.status === 'attivo' || u.hr.status === 'in_prova')).length} dipendenti attivi · {hrUsers.length} utenti totali</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"><X size={20}/></button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-slate-100 bg-white/40 shrink-0">
          {([['dipendenti', <Users size={13}/>, 'Dipendenti'], ['ferie', <Calendar size={13}/>, `Ferie & Permessi`], ['statistiche', <BarChart2 size={13}/>, 'Statistiche']] as const).map(([t, icon, label]) => (
            <button key={t} onClick={() => setMainTab(t as MainTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${mainTab === t ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {icon}{label}
              {t === 'ferie' && pendingLeaves > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center font-bold">{pendingLeaves}</span>}
            </button>
          ))}
        </div>

        {/* ═══ TAB: DIPENDENTI ═══ */}
        {mainTab === 'dipendenti' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: user list */}
            <div className="w-64 shrink-0 border-r border-slate-100 flex flex-col bg-white/20 overflow-hidden">
              <div className="p-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-rose-300"/>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(['tutti','attivo','in_prova','cessato'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${filterStatus === s ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                      {s === 'tutti' ? 'Tutti' : STATUS_CFG[s as EmployeeStatus].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
                {filtered.map(u => (
                  <button key={u.profile_id} onClick={() => selectUser(u)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2.5 ${selectedId === u.profile_id ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-50'}`}>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.hr?.photo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={u.hr.photo_url} alt="" className="w-full h-full object-cover"/>
                        : <span className="text-slate-500 font-bold text-xs">{u.name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.hr?.role || u.email}</p>
                    </div>
                    {u.hr && <span className={`ml-auto shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_CFG[u.hr.status].cls}`}>{STATUS_CFG[u.hr.status].label[0]}</span>}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Nessun utente</p>}
              </div>
            </div>

            {/* Right: detail */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
                  <UserCheck size={48} className="opacity-20"/>
                  <p className="text-sm">Seleziona un dipendente</p>
                </div>
              ) : (
                <>
                  {/* Detail header */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 shrink-0 bg-white/40">
                    {/* Photo */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                        {(profForm.photo_url || selectedUser.hr?.photo_url)
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={profForm.photo_url || selectedUser.hr?.photo_url || ''} alt="" className="w-full h-full object-cover"/>
                          : <ImageOff size={20} className="text-slate-300"/>
                        }
                      </div>
                      {isAdmin && (
                        <>
                          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }}/>
                          <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 disabled:opacity-50">
                            <Upload size={10}/>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                        {selectedUser.hr && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CFG[selectedUser.hr.status].cls}`}>{STATUS_CFG[selectedUser.hr.status].label}</span>}
                        {!selectedUser.hr && <span className="text-xs px-2 py-0.5 rounded-full border font-medium text-slate-400 bg-slate-50 border-slate-200">Non configurato</span>}
                      </div>
                      <p className="text-sm text-slate-400">{selectedUser.hr?.role || '—'}{selectedUser.hr?.department ? ` · ${selectedUser.hr.department}` : ''}</p>
                      <p className="text-xs text-slate-400">{selectedUser.email}</p>
                    </div>
                    {profDirty && isAdmin && (
                      <button onClick={handleSaveProfile} disabled={savingProf}
                        className="flex items-center gap-1.5 bg-rose-500 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-rose-200 disabled:opacity-50 shrink-0">
                        <Save size={13}/>{savingProf ? 'Salvo...' : 'Salva'}
                      </button>
                    )}
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-1 px-5 py-2 border-b border-slate-100 shrink-0 bg-white/20">
                    {(['profilo','documenti','timbrature'] as DetailTab[]).map(t => (
                      <button key={t} onClick={() => setDetailTab(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${detailTab === t ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        {t === 'profilo' ? 'Profilo HR' : t === 'documenti' ? 'Documenti' : 'Timbrature'}
                        {t === 'documenti' && documents.filter(d => d.profile_id === selectedId).length > 0 && (
                          <span className="ml-1 text-[10px] bg-slate-200 text-slate-500 rounded-full px-1">{documents.filter(d => d.profile_id === selectedId).length}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* ── Profilo sub-tab ── */}
                  {detailTab === 'profilo' && (
                    <div className="flex-1 overflow-y-auto p-5">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          ['Ruolo', 'role', 'text', 'Tecnico, Commerciale...'],
                          ['Reparto', 'department', 'text', 'Operativo, Admin...'],
                          ['Telefono', 'phone', 'text', '+39 ...'],
                          ['Data nascita', 'birth_date', 'date', ''],
                          ['Data assunzione', 'hire_date', 'date', ''],
                          ['Fine contratto', 'contract_end_date', 'date', ''],
                        ].map(([label, key, type, ph]) => (
                          <div key={key}>
                            <label className={lbl}>{label}</label>
                            <input type={type} placeholder={ph}
                              value={(profForm as any)[key] || ''}
                              onChange={e => { setProfForm(p => ({ ...p, [key]: e.target.value || null })); setProfDirty(true) }}
                              disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60 cursor-default')}/>
                          </div>
                        ))}
                        <div>
                          <label className={lbl}>Contratto</label>
                          <select value={profForm.contract_type || ''} onChange={e => { setProfForm(p => ({ ...p, contract_type: e.target.value as ContractType || null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} title="Tipo contratto">
                            <option value="">—</option>
                            {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Stato</label>
                          <select value={profForm.status || 'attivo'} onChange={e => { setProfForm(p => ({ ...p, status: e.target.value as EmployeeStatus })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} title="Stato">
                            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>RAL (€)</label>
                          <input type="number" value={profForm.gross_salary || ''} onChange={e => { setProfForm(p => ({ ...p, gross_salary: e.target.value ? Number(e.target.value) : null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} placeholder="0"/>
                        </div>
                        <div>
                          <label className={lbl}>Netto/mese (€)</label>
                          <input type="number" value={profForm.net_salary || ''} onChange={e => { setProfForm(p => ({ ...p, net_salary: e.target.value ? Number(e.target.value) : null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} placeholder="0"/>
                        </div>
                        <div>
                          <label className={lbl}>Ferie gg/anno</label>
                          <input type="number" value={profForm.ferie_giorni_anno ?? 26} onChange={e => { setProfForm(p => ({ ...p, ferie_giorni_anno: Number(e.target.value) })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')}/>
                        </div>
                        <div>
                          <label className={lbl}>Ferie residue</label>
                          <input type="number" value={profForm.ferie_giorni_residui ?? 26} onChange={e => { setProfForm(p => ({ ...p, ferie_giorni_residui: Number(e.target.value) })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')}/>
                        </div>
                        <div>
                          <label className={lbl}>Permessi h/anno</label>
                          <input type="number" value={profForm.permessi_ore_anno ?? 104} onChange={e => { setProfForm(p => ({ ...p, permessi_ore_anno: Number(e.target.value) })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')}/>
                        </div>
                        <div>
                          <label className={lbl}>Permessi residui (h)</label>
                          <input type="number" value={profForm.permessi_ore_residui ?? 104} onChange={e => { setProfForm(p => ({ ...p, permessi_ore_residui: Number(e.target.value) })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')}/>
                        </div>
                        <div>
                          <label className={lbl}>Codice Fiscale</label>
                          <input value={profForm.tax_code || ''} onChange={e => { setProfForm(p => ({ ...p, tax_code: e.target.value.toUpperCase() })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} maxLength={16} placeholder="RSSMRA..."/>
                        </div>
                        <div>
                          <label className={lbl}>IBAN</label>
                          <input value={profForm.iban || ''} onChange={e => { setProfForm(p => ({ ...p, iban: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} placeholder="IT..."/>
                        </div>
                        <div className="col-span-2">
                          <label className={lbl}>Indirizzo</label>
                          <input value={profForm.address || ''} onChange={e => { setProfForm(p => ({ ...p, address: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} placeholder="Via..."/>
                        </div>
                        <div className="col-span-2">
                          <label className={lbl}>Contatto emergenza</label>
                          <input value={profForm.emergency_contact || ''} onChange={e => { setProfForm(p => ({ ...p, emergency_contact: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (isAdmin ? '' : ' opacity-60')} placeholder="Nome - Telefono"/>
                        </div>
                        <div className="col-span-2">
                          <label className={lbl}>Note</label>
                          <textarea value={profForm.notes || ''} onChange={e => { setProfForm(p => ({ ...p, notes: e.target.value })); setProfDirty(true) }} rows={2} disabled={!isAdmin} className={inp + ' resize-none' + (isAdmin ? '' : ' opacity-60')}/>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Documenti sub-tab ── */}
                  {detailTab === 'documenti' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Category pills */}
                      <div className="flex gap-1.5 flex-wrap px-5 py-3 border-b border-slate-100 shrink-0">
                        {DOC_CATS.map(c => (
                          <button key={c.key} onClick={() => setDocCat(c.key)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${docCat === c.key ? c.pill + ' shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            {c.icon}{c.label}
                            <span className="text-[10px] opacity-60">({documents.filter(d => d.profile_id === selectedId && d.category === c.key).length})</span>
                          </button>
                        ))}
                      </div>
                      {/* Doc list */}
                      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                        {documents.filter(d => d.profile_id === selectedId && d.category === docCat).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                            <FileText size={32} className="opacity-30"/>
                            <p className="text-xs">Nessun documento in questa categoria</p>
                          </div>
                        )}
                        {documents.filter(d => d.profile_id === selectedId && d.category === docCat).map(doc => {
                          const isExpiring = doc.expiry_date && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 86400000)
                          return (
                            <div key={doc.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm">
                              <FileText size={16} className="text-slate-300 shrink-0"/>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                  {doc.file_name && <span>{doc.file_name}</span>}
                                  {doc.expiry_date && <span className={`flex items-center gap-0.5 ${isExpiring ? 'text-red-500' : ''}`}>{isExpiring && <AlertTriangle size={10}/>}Scade {fmtDate(doc.expiry_date)}</span>}
                                  {doc.notes && <span>· {doc.notes}</span>}
                                </div>
                              </div>
                              {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-rose-500 hover:underline shrink-0">Apri</a>}
                              {isAdmin && <button onClick={() => onDeleteDocument(doc.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0 p-0.5"><Trash2 size={13}/></button>}
                            </div>
                          )
                        })}
                      </div>
                      {/* Add document */}
                      {isAdmin && (
                        <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                          {!showDocForm ? (
                            <button onClick={() => setShowDocForm(true)} className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors">
                              <Plus size={14}/>Aggiungi documento
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                  <input value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome documento *" className={inp + ' text-xs py-1.5'}/>
                                </div>
                                <input type="date" value={docForm.expiry_date} onChange={e => setDocForm(p => ({ ...p, expiry_date: e.target.value }))} className={inp + ' text-xs py-1.5'} title="Scadenza"/>
                                <input value={docForm.notes} onChange={e => setDocForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note" className={inp + ' text-xs py-1.5'}/>
                              </div>
                              <div className="flex items-center gap-2">
                                <input ref={docFileRef} type="file" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)}/>
                                <button onClick={() => docFileRef.current?.click()} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                                  <Upload size={11}/>{docFile ? docFile.name : 'Allega file (opz.)'}
                                </button>
                                <button onClick={handleAddDocument} disabled={uploadingDoc || !docForm.name.trim()} className="flex items-center gap-1 text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-rose-600 transition-colors">
                                  {uploadingDoc ? 'Carico...' : 'Salva'}
                                </button>
                                <button onClick={() => { setShowDocForm(false); setDocForm({ name: '', expiry_date: '', notes: '' }); setDocFile(null) }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">Annulla</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Timbrature sub-tab ── */}
                  {detailTab === 'timbrature' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Month nav */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setWorkMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 })} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">‹</button>
                          <span className="text-sm font-medium text-slate-700 capitalize">{monthLabel(workMonth.y, workMonth.m)}</span>
                          <button onClick={() => setWorkMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 })} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">›</button>
                        </div>
                        {(() => {
                          const monthRec = workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m })
                          return <div className="text-xs text-slate-500">{monthRec.length} giorni · {parseFloat(monthRec.reduce((s, r) => s + r.hours_worked, 0).toFixed(1))}h totali</div>
                        })()}
                      </div>
                      {/* Records list */}
                      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
                        {workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m }).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2"><Timer size={32} className="opacity-30"/><p className="text-xs">Nessuna timbratura in questo mese</p></div>
                        )}
                        {workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m })
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(r => (
                          <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2 text-sm">
                            <span className="text-slate-400 text-xs w-20 shrink-0">{fmtDate(r.date)}</span>
                            <span className="font-semibold text-slate-700">{r.hours_worked}h</span>
                            {r.check_in && r.check_out && <span className="text-xs text-slate-400">{r.check_in} – {r.check_out}</span>}
                            {r.notes && <span className="text-xs text-slate-400 truncate">{r.notes}</span>}
                            {isAdmin && <button onClick={() => onDeleteWorkRecord(r.id)} className="ml-auto text-slate-300 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13}/></button>}
                          </div>
                        ))}
                      </div>
                      {/* Add work record */}
                      {isAdmin && (
                        <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                          {!showWorkForm ? (
                            <button onClick={() => setShowWorkForm(true)} className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"><Plus size={14}/>Aggiungi giorno</button>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2">
                                <div><input type="date" value={workForm.date} onChange={e => setWorkForm(p => ({ ...p, date: e.target.value }))} className={inp + ' text-xs py-1.5'} title="Data"/></div>
                                <div><input type="number" step="0.5" value={workForm.hours_worked} onChange={e => setWorkForm(p => ({ ...p, hours_worked: e.target.value }))} placeholder="Ore" className={inp + ' text-xs py-1.5'}/></div>
                                <div><input type="time" value={workForm.check_in} onChange={e => setWorkForm(p => ({ ...p, check_in: e.target.value }))} className={inp + ' text-xs py-1.5'} title="Entrata"/></div>
                                <div><input type="time" value={workForm.check_out} onChange={e => setWorkForm(p => ({ ...p, check_out: e.target.value }))} className={inp + ' text-xs py-1.5'} title="Uscita"/></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input value={workForm.notes} onChange={e => setWorkForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note" className={inp + ' text-xs py-1.5 flex-1'}/>
                                <button onClick={handleAddWork} disabled={savingWork || !workForm.date} className="flex items-center gap-1 text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-rose-600 transition-colors shrink-0">{savingWork ? 'Salvo...' : 'Salva'}</button>
                                <button onClick={() => { setShowWorkForm(false); setWorkForm({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' }) }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 shrink-0">Annulla</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: FERIE & PERMESSI ═══ */}
        {mainTab === 'ferie' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 shrink-0">
              <p className="text-sm text-slate-500">{pendingLeaves} richieste in attesa</p>
              <button onClick={() => setShowLeaveForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all">
                <Plus size={14}/>Nuova richiesta
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {leaveRequests.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2"><Calendar size={40} className="opacity-20"/><p className="text-sm">Nessuna richiesta</p></div>}
              {leaveRequests.map(req => {
                const cfg = LEAVE_STATUS[req.status]
                return (
                  <div key={req.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{req.profile_name}</p>
                        <span className="text-xs text-slate-500">{LEAVE_LABELS[req.type]}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.icon}{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(req.start_date)} – {fmtDate(req.end_date)} · {req.days} gg{req.hours ? ` · ${req.hours}h` : ''}{req.notes ? ` · ${req.notes}` : ''}</p>
                      {req.reviewed_by && <p className="text-[10px] text-slate-300">Revisionato da {req.reviewed_by}</p>}
                    </div>
                    {isAdmin && req.status === 'in_attesa' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'approvato', currentUserName)} className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"><CheckCircle2 size={11}/>Approva</button>
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'rifiutato', currentUserName)} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"><XCircle size={11}/>Rifiuta</button>
                      </div>
                    )}
                    <button onClick={() => { if (confirm('Eliminare questa richiesta?')) onDeleteLeave(req.id) }} className="text-slate-300 hover:text-red-400 transition-colors p-1 shrink-0"><Trash2 size={13}/></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB: STATISTICHE ═══ */}
        {mainTab === 'statistiche' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Period filter */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Anno:</span>
                <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none" title="Anno">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Mese:</span>
                <select value={statsMonth === null ? '' : statsMonth} onChange={e => setStatsMonth(e.target.value === '' ? null : Number(e.target.value))} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none" title="Mese">
                  <option value="">Tutto l'anno</option>
                  {Array.from({length:12},(_,i)=>i).map(m=><option key={m} value={m}>{new Date(statsYear,m,1).toLocaleString('it-IT',{month:'long'})}</option>)}
                </select>
              </div>
            </div>
            {/* Stats table */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {stats.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2"><BarChart2 size={40} className="opacity-20"/><p className="text-sm">Nessun dipendente configurato</p></div>}
              {stats.length > 0 && (
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-xs text-slate-400 font-medium">
                      <th className="text-left pb-2 pl-3">Dipendente</th>
                      <th className="text-right pb-2">Ore Lav.</th>
                      <th className="text-right pb-2">Giorni Lav.</th>
                      <th className="text-right pb-2">Ferie Usate</th>
                      <th className="text-right pb-2">Ferie Res.</th>
                      <th className="text-right pb-2">Perm. (h)</th>
                      <th className="text-right pb-2 pr-3">Perm. Res. (h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(({ u, oreLav, giorniLav, ferieUsate, ferieResidue, permUsateH, permResiduiH }) => (
                      <tr key={u.profile_id} className="bg-white border border-slate-200/60 rounded-xl shadow-sm">
                        <td className="py-3 pl-3 rounded-l-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 overflow-hidden">
                              {u.hr?.photo_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={u.hr.photo_url} alt="" className="w-full h-full object-cover"/>
                                : u.name[0]?.toUpperCase()
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700 text-xs">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.hr?.role || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3"><span className="font-bold text-slate-700">{oreLav}</span><span className="text-slate-400 text-xs">h</span></td>
                        <td className="text-right py-3"><span className="font-bold text-slate-700">{giorniLav}</span></td>
                        <td className="text-right py-3"><span className={`font-bold ${ferieUsate > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{ferieUsate}</span><span className="text-slate-400 text-xs">gg</span></td>
                        <td className="text-right py-3"><span className={`font-bold ${ferieResidue < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{ferieResidue}</span><span className="text-slate-400 text-xs">gg</span></td>
                        <td className="text-right py-3"><span className={`font-bold ${permUsateH > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{permUsateH}</span><span className="text-slate-400 text-xs">h</span></td>
                        <td className="text-right py-3 pr-3 rounded-r-xl"><span className={`font-bold ${permResiduiH < 8 ? 'text-amber-600' : 'text-emerald-600'}`}>{permResiduiH}</span><span className="text-slate-400 text-xs">h</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ LEAVE FORM MODAL ═══ */}
      <AnimatePresence>
        {showLeaveForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setShowLeaveForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Nuova Richiesta</h3>
                <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18}/></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className={lbl}>Dipendente *</label>
                  <select value={leaveForm.profile_id} onChange={e => setLeaveForm(p => ({ ...p, profile_id: e.target.value }))} className={inp} title="Dipendente">
                    <option value="">Seleziona...</option>
                    {hrUsers.map(u => <option key={u.profile_id} value={u.profile_id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Tipo *</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value as LeaveType }))} className={inp} title="Tipo">
                    {Object.entries(LEAVE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Dal *</label><input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} className={inp}/></div>
                  <div><label className={lbl}>Al *</label><input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} className={inp}/></div>
                </div>
                {leaveForm.start_date && leaveForm.end_date && (
                  <p className="text-xs text-rose-600 font-medium">{calcDays(leaveForm.start_date, leaveForm.end_date)} giorni</p>
                )}
                {leaveForm.type === 'permesso' && (
                  <div><label className={lbl}>Ore permesso</label><input type="number" step="0.5" value={leaveForm.hours} onChange={e => setLeaveForm(p => ({ ...p, hours: e.target.value }))} placeholder="Es: 4" className={inp}/></div>
                )}
                <div><label className={lbl}>Note</label><textarea value={leaveForm.notes} onChange={e => setLeaveForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inp + ' resize-none'}/></div>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
                <button onClick={() => setShowLeaveForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium transition-colors">Annulla</button>
                <button onClick={handleAddLeave} disabled={savingLeave || !leaveForm.profile_id || !leaveForm.start_date || !leaveForm.end_date}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg shadow-rose-200 disabled:opacity-50 transition-all">
                  {savingLeave ? 'Salvo...' : 'Invia Richiesta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

