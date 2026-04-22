'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserCheck, Search, Users, Calendar, BarChart2,
  Upload, Trash2, FileText, CheckCircle2, XCircle, Clock,
  Shield, Heart, Dumbbell, Timer, Plus, ImageOff,
  Save, GraduationCap, AlertTriangle, ChevronLeft, ChevronRight,
  Briefcase, Phone, MapPin, CreditCard, User, Banknote, Pencil, Bell,
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
const STATUS_CFG: Record<EmployeeStatus, { label: string; dot: string; badge: string }> = {
  attivo:   { label: 'Attivo',    dot: 'bg-emerald-400', badge: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  in_prova: { label: 'In Prova',  dot: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 ring-amber-200' },
  sospeso:  { label: 'Sospeso',   dot: 'bg-orange-400',  badge: 'text-orange-700 bg-orange-50 ring-orange-200' },
  cessato:  { label: 'Cessato',   dot: 'bg-slate-300',   badge: 'text-slate-500 bg-slate-100 ring-slate-200' },
}
const LEAVE_LABELS: Record<LeaveType, { label: string; icon: string; color: string }> = {
  ferie:               { label: 'Ferie',               icon: '🏖', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  permesso:            { label: 'Permesso',             icon: '⏰', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  malattia:            { label: 'Malattia',             icon: '🤒', color: 'bg-red-50 border-red-200 text-red-700' },
  maternita_paternita: { label: 'Maternità/Paternità',  icon: '👶', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  altro:               { label: 'Altro',                icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-600' },
}
const LEAVE_STATUS_CFG: Record<LeaveStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  in_attesa: { label: 'In Attesa', cls: 'text-amber-700 bg-amber-50 ring-amber-200',   icon: <Clock size={10}/> },
  approvato: { label: 'Approvato', cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200', icon: <CheckCircle2 size={10}/> },
  rifiutato: { label: 'Rifiutato', cls: 'text-red-600 bg-red-50 ring-red-200',         icon: <XCircle size={10}/> },
}
const DOC_CATS: { key: DocCategory; label: string; icon: React.ReactNode; active: string; inactive: string }[] = [
  { key: 'corsi',                  label: 'Corsi',          icon: <GraduationCap size={12}/>, active: 'bg-blue-500 text-white shadow-blue-200',     inactive: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' },
  { key: 'corsi_sicurezza',        label: 'Sicurezza',      icon: <Shield size={12}/>,        active: 'bg-amber-500 text-white shadow-amber-200',    inactive: 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50' },
  { key: 'documenti',              label: 'Documenti',      icon: <FileText size={12}/>,      active: 'bg-slate-600 text-white shadow-slate-200',    inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' },
  { key: 'certificazioni_mediche', label: 'Mediche',        icon: <Heart size={12}/>,         active: 'bg-rose-500 text-white shadow-rose-200',      inactive: 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50' },
  { key: 'training',               label: 'Training',       icon: <Dumbbell size={12}/>,      active: 'bg-purple-500 text-white shadow-purple-200',  inactive: 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50' },
  { key: 'timbrature',             label: 'Timbrature',     icon: <Timer size={12}/>,         active: 'bg-orange-500 text-white shadow-orange-200',  inactive: 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50' },
]

// Avatar gradient palette
const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-600', 'from-violet-400 to-purple-600', 'from-blue-400 to-indigo-600',
  'from-emerald-400 to-teal-600', 'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500',
]
function avatarGradient(name: string) { return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length] }

// ─── Props ────────────────────────────────────────────────────────────────────
interface HREditModal {
  record: HRWorkRecord
  step: 'request' | 'verify' | 'edit'
  codeInput: string
  error: string
  editForm: { check_in: string; check_out: string; hours_worked: string; break_minutes: number; notes: string }
}

interface HRPanelProps {
  isOpen: boolean; onClose: () => void
  hrUsers: HRUser[]; documents: HRDocument[]; leaveRequests: HRLeaveRequest[]; workRecords: HRWorkRecord[]
  isAdmin: boolean; currentUserId: string; currentUserName: string
  onUpsertHRProfile: (profileId: string, data: Partial<Omit<HRProfile,'profile_id'|'created_at'>>) => Promise<void>
  onAddDocument: (data: Omit<HRDocument,'id'|'user_id'|'created_at'>) => Promise<HRDocument|null>
  onDeleteDocument: (id: string) => Promise<void>
  onAddLeave: (data: Omit<HRLeaveRequest,'id'|'user_id'|'created_at'>) => Promise<HRLeaveRequest|null>
  onUpdateLeaveStatus: (id: string, status: LeaveStatus, by: string) => Promise<void>
  onDeleteLeave: (id: string) => Promise<void>
  onAddWorkRecord: (data: Omit<HRWorkRecord,'id'|'user_id'|'created_at'>) => Promise<HRWorkRecord|null>
  onDeleteWorkRecord: (id: string) => Promise<void>
  onUpdateWorkRecord: (id: string, data: Partial<Omit<HRWorkRecord,'id'|'user_id'|'created_at'>>) => Promise<boolean>
  initialProfileId?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcDays(s: string, e: string) { return Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1) }
function calcHoursFromTime(ci: string, co: string) {
  const [ch, cm] = ci.split(':').map(Number); const [oh, om] = co.split(':').map(Number)
  return Math.max(0, parseFloat(((oh * 60 + om - ch * 60 - cm) / 60).toFixed(2)))
}
function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('it-IT') }
function monthLabel(y: number, m: number) { return new Date(y, m, 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' }) }

type MainTab = 'dipendenti' | 'ferie' | 'statistiche'
type DetailTab = 'profilo' | 'documenti' | 'timbrature'

// ─── Small reusable ────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <div className="text-rose-400">{icon}</div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-slate-100"/>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HRPanel({
  isOpen, onClose, hrUsers, documents, leaveRequests, workRecords, isAdmin,
  currentUserId, currentUserName,
  onUpsertHRProfile, onAddDocument, onDeleteDocument,
  onAddLeave, onUpdateLeaveStatus, onDeleteLeave,
  onAddWorkRecord, onDeleteWorkRecord, onUpdateWorkRecord,
  initialProfileId,
}: HRPanelProps) {
  const [mainTab, setMainTab] = useState<MainTab>('dipendenti')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('profilo')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | 'tutti'>('tutti')

  const [profForm, setProfForm] = useState<Partial<HRProfile>>({})
  const [profDirty, setProfDirty] = useState(false)
  const [savingProf, setSavingProf] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const [docCat, setDocCat] = useState<DocCategory>('documenti')
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', expiry_date: '', notes: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docFileRef = useRef<HTMLInputElement>(null)

  const [showWorkForm, setShowWorkForm] = useState(false)
  const [workForm, setWorkForm] = useState({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' })
  const [savingWork, setSavingWork] = useState(false)
  const [workMonth, setWorkMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })

  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ profile_id: '', type: 'ferie' as LeaveType, start_date: '', end_date: '', hours: '', notes: '' })
  const [savingLeave, setSavingLeave] = useState(false)

  const [hrEditModal, setHrEditModal] = useState<HREditModal | null>(null)
  const [savingHREdit, setSavingHREdit] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)

  const [modCodes, setModCodes] = useState<{ id: string; record_id: string; status: string }[]>([])

  const fetchModCodes = useCallback(async () => {
    if (!isOpen) return
    const { data } = await supabase
      .from('hr_modification_codes')
      .select('id, record_id, status')
      .in('status', ['requested', 'code_sent'])
    setModCodes(data || [])
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    fetchModCodes()
    const channel = supabase
      .channel('hr-panel-mod-codes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_modification_codes' }, () => fetchModCodes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isOpen, fetchModCodes])

  const pendingRecordIds = useMemo(() => new Set(modCodes.map(c => c.record_id)), [modCodes])

  const [statsYear, setStatsYear] = useState(new Date().getFullYear())
  const [statsMonth, setStatsMonth] = useState<number | null>(null)

  const selectedUser = hrUsers.find(u => u.profile_id === selectedId) || null

  useEffect(() => {
    if (!selectedId) { setProfForm({}); return }
    const u = hrUsers.find(u => u.profile_id === selectedId)
    if (!u) return
    setProfForm(u.hr ? { ...u.hr } : { status: 'attivo', ferie_giorni_anno: 26, ferie_giorni_residui: 26, permessi_ore_anno: 104, permessi_ore_residui: 104 })
    setProfDirty(false)
  }, [selectedId, hrUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectUser = (u: HRUser) => {
    setSelectedId(u.profile_id); setProfDirty(false)
    setDetailTab('profilo'); setShowDocForm(false); setShowWorkForm(false)
  }

  // Auto-navigate to specific employee's timbrature tab (deep-link from notification toast)
  useEffect(() => {
    if (!initialProfileId || !hrUsers.length || !isOpen) return
    const u = hrUsers.find(u => u.profile_id === initialProfileId)
    if (u) { setSelectedId(initialProfileId); setDetailTab('timbrature') }
  }, [initialProfileId, hrUsers, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = hrUsers.filter(u => {
    if (filterStatus !== 'tutti' && u.hr?.status !== filterStatus) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.hr?.role || '').toLowerCase().includes(q)
  })

  const handlePhotoUpload = async (file: File) => {
    if (!selectedId) return; setUploadingPhoto(true)
    try {
      const resized = await new Promise<Blob>(resolve => {
        const img = new Image(); img.onload = () => {
          const MAX = 300; let { width, height } = img
          if (width > MAX || height > MAX) { if (width > height) { height = Math.round(height * MAX / width); width = MAX } else { width = Math.round(width * MAX / height); height = MAX } }
          const c = document.createElement('canvas'); c.width = width; c.height = height
          c.getContext('2d')!.drawImage(img, 0, 0, width, height); c.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
        }; img.src = URL.createObjectURL(file)
      })
      const path = `hr/photo_${selectedId}_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, resized, { contentType: 'image/jpeg', upsert: true })
      if (error) { console.error(error); return }
      const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      setProfForm(p => ({ ...p, photo_url: url })); setProfDirty(true)
    } finally { setUploadingPhoto(false) }
  }

  const handleSaveProfile = async () => {
    if (!selectedId) return; setSavingProf(true)
    await onUpsertHRProfile(selectedId, profForm); setSavingProf(false); setProfDirty(false)
  }

  const handleAddDocument = async () => {
    if (!selectedId || !docForm.name.trim()) return; setUploadingDoc(true)
    let fileUrl: string | null = null, fileName: string | null = null
    if (docFile) {
      const path = `hr-docs/${selectedId}/${Date.now()}_${docFile.name}`
      const { error } = await supabase.storage.from('product-images').upload(path, docFile, { cacheControl: '3600' })
      if (!error) { fileUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl; fileName = docFile.name }
    }
    await onAddDocument({ profile_id: selectedId, category: docCat, name: docForm.name.trim(), file_url: fileUrl, file_name: fileName, expiry_date: docForm.expiry_date || null, notes: docForm.notes || null })
    setUploadingDoc(false); setShowDocForm(false); setDocForm({ name: '', expiry_date: '', notes: '' }); setDocFile(null)
  }

  const handleAddWork = async () => {
    if (!selectedId || !workForm.date) return; setSavingWork(true)
    let hrs = parseFloat(workForm.hours_worked) || 0
    if (!hrs && workForm.check_in && workForm.check_out) hrs = calcHoursFromTime(workForm.check_in, workForm.check_out)
    await onAddWorkRecord({ profile_id: selectedId, date: workForm.date, hours_worked: hrs, check_in: workForm.check_in || null, check_out: workForm.check_out || null, notes: workForm.notes || null })
    setSavingWork(false); setShowWorkForm(false); setWorkForm({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' })
  }

  const handleHROpenEdit = (r: HRWorkRecord) => {
    const pending = modCodes.find(c => c.record_id === r.id)
    const step = pending?.status === 'code_sent' ? 'verify' as const : 'request' as const
    setHrEditModal({
      record: r, step, codeInput: '', error: '',
      editForm: {
        check_in: r.check_in || '',
        check_out: r.check_out || '',
        hours_worked: String(r.hours_worked),
        break_minutes: (r as any).break_minutes ?? 60,
        notes: r.notes || '',
      },
    })
  }

  const handleHRSendCode = async () => {
    if (!hrEditModal || sendingCode) return
    setSendingCode(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const existing = modCodes.find(c => c.record_id === hrEditModal.record.id && c.status === 'requested')
    if (existing) {
      await supabase.from('hr_modification_codes')
        .update({ code, status: 'code_sent', expires_at: expires })
        .eq('id', existing.id)
    } else {
      await supabase.from('hr_modification_codes').insert([{
        record_id: hrEditModal.record.id,
        profile_id: hrEditModal.record.profile_id,
        code,
        status: 'code_sent',
        expires_at: expires,
      }])
    }
    fetchModCodes()
    setHrEditModal(p => p ? { ...p, step: 'verify' } : null)
    setSendingCode(false)
  }

  const handleHRVerifyCode = async () => {
    if (!hrEditModal) return
    const { count } = await supabase
      .from('hr_modification_codes')
      .update({ used_at: new Date().toISOString(), status: 'code_verified' }, { count: 'exact' })
      .eq('record_id', hrEditModal.record.id)
      .eq('code', hrEditModal.codeInput.toUpperCase().trim())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
    if (count && count > 0) {
      setHrEditModal(p => p ? { ...p, step: 'edit', error: '' } : null)
    } else {
      setHrEditModal(p => p ? { ...p, error: 'Codice non valido o scaduto' } : null)
    }
  }

  const handleHREditSave = async () => {
    if (!hrEditModal) return
    const { editForm, record } = hrEditModal
    let hrs: number
    if (editForm.check_in && editForm.check_out) {
      hrs = calcHoursFromTime(editForm.check_in, editForm.check_out)
    } else {
      hrs = parseFloat(editForm.hours_worked)
    }
    if (isNaN(hrs) || hrs < 0) return
    setSavingHREdit(true)
    const ok = await onUpdateWorkRecord(record.id, {
      check_in: editForm.check_in || null,
      check_out: editForm.check_out || null,
      hours_worked: hrs,
      notes: editForm.notes || null,
    })
    setSavingHREdit(false)
    if (ok) {
      await supabase.from('hr_modification_codes')
        .update({ status: 'completed' })
        .eq('record_id', record.id)
      fetchModCodes()
      setHrEditModal(null)
    }
  }

  const handleAddLeave = async () => {
    if (!leaveForm.profile_id || !leaveForm.start_date || !leaveForm.end_date) return
    const u = hrUsers.find(u => u.profile_id === leaveForm.profile_id); if (!u) return
    setSavingLeave(true)
    await onAddLeave({ profile_id: leaveForm.profile_id, profile_name: u.name, type: leaveForm.type, start_date: leaveForm.start_date, end_date: leaveForm.end_date, days: calcDays(leaveForm.start_date, leaveForm.end_date), hours: leaveForm.hours ? parseFloat(leaveForm.hours) : null, notes: leaveForm.notes || null, status: 'in_attesa', reviewed_by: null, reviewed_at: null })
    setSavingLeave(false); setShowLeaveForm(false); setLeaveForm({ profile_id: '', type: 'ferie', start_date: '', end_date: '', hours: '', notes: '' })
  }

  const stats = useMemo(() => hrUsers.filter(u => u.hr).map(u => {
    const wr = workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === u.profile_id && d.getFullYear() === statsYear && (statsMonth === null || d.getMonth() === statsMonth) })
    const lr = leaveRequests.filter(r => { const d = new Date(r.start_date); return r.profile_id === u.profile_id && r.status === 'approvato' && d.getFullYear() === statsYear && (statsMonth === null || d.getMonth() === statsMonth) })
    const oreLav = parseFloat(wr.reduce((s, r) => s + r.hours_worked, 0).toFixed(1))
    const giorniLav = wr.length
    const ferieUsate = parseFloat(lr.filter(r => r.type === 'ferie').reduce((s, r) => s + r.days, 0).toFixed(1))
    const permUsateH = parseFloat(lr.filter(r => r.type === 'permesso').reduce((s, r) => s + (r.hours || r.days * 8), 0).toFixed(1))
    return { u, oreLav, giorniLav, ferieUsate, ferieResidue: u.hr!.ferie_giorni_residui, ferieAnno: u.hr!.ferie_giorni_anno, permUsateH, permResiduiH: u.hr!.permessi_ore_residui, permAnnoH: u.hr!.permessi_ore_anno }
  }), [hrUsers, workRecords, leaveRequests, statsYear, statsMonth])

  const inp = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all"
  const lbl = "block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1"
  const pendingLeaves = leaveRequests.filter(r => r.status === 'in_attesa').length
  const activeCount = hrUsers.filter(u => u.hr && (u.hr.status === 'attivo' || u.hr.status === 'in_prova')).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-[1000px] max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-7 py-5 shrink-0 overflow-hidden">
          {/* bg decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-pink-50 to-white"/>
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-rose-100/60 blur-2xl"/>
          <div className="absolute -bottom-4 left-32 w-20 h-20 rounded-full bg-pink-100/60 blur-xl"/>
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-300">
              <UserCheck size={20} className="text-white"/>
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-lg leading-tight">Risorse Umane</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                <span className="text-emerald-600 font-semibold">{activeCount}</span> attivi ·{' '}
                <span className="font-medium text-slate-500">{hrUsers.length}</span> totali
                {pendingLeaves > 0 && <> · <span className="text-amber-600 font-semibold">{pendingLeaves} in attesa</span></>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-200">
            <X size={18}/>
          </button>
        </div>

        {/* ── Main tabs ── */}
        <div className="flex gap-0.5 px-7 pt-2 pb-0 shrink-0 border-b border-slate-100">
          {([
            ['dipendenti', <Users size={14}/>, 'Dipendenti'],
            ['ferie', <Calendar size={14}/>, 'Ferie & Permessi'],
            ['statistiche', <BarChart2 size={14}/>, 'Statistiche'],
          ] as const).map(([t, icon, label]) => (
            <button key={t} onClick={() => setMainTab(t as MainTab)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl border-b-2 ${mainTab === t ? 'text-rose-600 border-rose-500 bg-rose-50/60' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}>
              {icon}{label}
              {t === 'ferie' && pendingLeaves > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center font-bold shadow-sm">{pendingLeaves}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ TAB: DIPENDENTI ═══ */}
        {mainTab === 'dipendenti' && (
          <div className="flex-1 flex overflow-hidden">
            {/* ── Left sidebar ── */}
            <div className="w-[240px] shrink-0 flex flex-col bg-slate-50/60 border-r border-slate-100 overflow-hidden">
              <div className="p-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca dipendente…"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-sm"/>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['tutti','attivo','in_prova','cessato'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${filterStatus === s ? 'bg-rose-500 text-white shadow-sm shadow-rose-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
                      {s === 'tutti' ? 'Tutti' : STATUS_CFG[s as EmployeeStatus].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
                {filtered.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Nessun risultato</p>}
                {filtered.map(u => {
                  const isSelected = selectedId === u.profile_id
                  const grad = avatarGradient(u.name)
                  return (
                    <button key={u.profile_id} onClick={() => selectUser(u)}
                      className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all flex items-center gap-3 group ${isSelected ? 'bg-white shadow-sm border border-rose-100 ring-1 ring-rose-200' : 'hover:bg-white hover:shadow-sm border border-transparent'}`}>
                      <div className={`w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br ${grad} shadow-sm`}>
                        {u.hr?.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={u.hr.photo_url} alt="" className="w-full h-full object-cover"/>
                          : <span className="text-white font-bold text-sm">{u.name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate transition-colors ${isSelected ? 'text-rose-700' : 'text-slate-700'}`}>{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.hr?.role || u.email}</p>
                      </div>
                      {u.hr && (
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CFG[u.hr.status].dot}`}/>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Right detail ── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {!selectedUser ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <UserCheck size={32} className="text-slate-200"/>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">Seleziona un dipendente</p>
                    <p className="text-xs text-slate-300 mt-1">dalla lista a sinistra</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Detail hero ── */}
                  <div className="relative px-6 py-5 shrink-0 border-b border-slate-100 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-r ${avatarGradient(selectedUser.name)} opacity-[0.04]`}/>
                    <div className="relative flex items-center gap-4">
                      {/* Photo */}
                      <div className="relative shrink-0">
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br ${avatarGradient(selectedUser.name)} shadow-lg`}>
                          {(profForm.photo_url || selectedUser.hr?.photo_url)
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={profForm.photo_url || selectedUser.hr?.photo_url || ''} alt="" className="w-full h-full object-cover"/>
                            : <span className="text-white font-bold text-2xl">{selectedUser.name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        {isAdmin && (
                          <>
                            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }}/>
                            <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                              className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-slate-100 text-rose-500 rounded-full flex items-center justify-center shadow hover:bg-rose-50 disabled:opacity-50 transition-colors">
                              {uploadingPhoto ? <div className="w-2.5 h-2.5 border border-rose-400 border-t-transparent rounded-full animate-spin"/> : <Upload size={9}/>}
                            </button>
                          </>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-lg leading-none">{selectedUser.name}</h3>
                          {selectedUser.hr ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ring-1 ${STATUS_CFG[selectedUser.hr.status].badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[selectedUser.hr.status].dot}`}/>
                              {STATUS_CFG[selectedUser.hr.status].label}
                            </span>
                          ) : (
                            <span className="inline-flex text-[10px] px-2 py-1 rounded-full font-semibold ring-1 text-slate-400 bg-slate-50 ring-slate-200">Non configurato</span>
                          )}
                        </div>
                        {selectedUser.hr?.role && <p className="text-sm text-slate-500 mt-1">{selectedUser.hr.role}{selectedUser.hr?.department ? <> · <span className="text-slate-400">{selectedUser.hr.department}</span></> : ''}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
                      </div>
                      {/* Mini stats if HR configured */}
                      {selectedUser.hr && (
                        <div className="hidden lg:flex items-center gap-3 shrink-0">
                          <div className="text-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-lg font-bold text-emerald-600">{selectedUser.hr.ferie_giorni_residui}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Ferie gg</p>
                          </div>
                          <div className="text-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-lg font-bold text-blue-600">{selectedUser.hr.permessi_ore_residui}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Perm. h</p>
                          </div>
                        </div>
                      )}
                      {profDirty && isAdmin && (
                        <button onClick={handleSaveProfile} disabled={savingProf}
                          className="flex items-center gap-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-rose-200 disabled:opacity-50 shrink-0 hover:shadow-rose-300 transition-all">
                          <Save size={13}/>{savingProf ? 'Salvo…' : 'Salva'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Sub-tabs ── */}
                  <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-100 shrink-0 bg-slate-50/30">
                    {(['profilo','documenti','timbrature'] as DetailTab[]).map(t => {
                      const docCount = t === 'documenti' ? documents.filter(d => d.profile_id === selectedId).length : 0
                      return (
                        <button key={t} onClick={() => setDetailTab(t)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${detailTab === t ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}>
                          {t === 'profilo' ? 'Profilo HR' : t === 'documenti' ? 'Documenti' : 'Timbrature'}
                          {docCount > 0 && t === 'documenti' && <span className="ml-1.5 text-[9px] bg-slate-200 text-slate-500 rounded-full px-1.5 py-0.5">{docCount}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* ── Profilo ── */}
                  {detailTab === 'profilo' && (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      {/* Anagrafica */}
                      <div>
                        <SectionTitle icon={<User size={12}/>} title="Anagrafica"/>
                        <div className="grid grid-cols-2 gap-3">
                          {[['Ruolo', 'role', 'text', 'Tecnico, Commerciale…'], ['Reparto', 'department', 'text', 'Operativo, Admin…'], ['Telefono', 'phone', 'text', '+39 …'], ['Data nascita', 'birth_date', 'date', '']].map(([label, key, type, ph]) => (
                            <div key={key}>
                              <label className={lbl}>{label}</label>
                              <input type={type} placeholder={ph} value={(profForm as any)[key] || ''}
                                onChange={e => { setProfForm(p => ({ ...p, [key]: e.target.value || null })); setProfDirty(true) }}
                                disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 cursor-default bg-slate-50' : '')}/>
                            </div>
                          ))}
                          <div className="col-span-2">
                            <label className={lbl}>Indirizzo</label>
                            <input value={profForm.address || ''} onChange={e => { setProfForm(p => ({ ...p, address: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 cursor-default bg-slate-50' : '')} placeholder="Via Roma 1, Milano"/>
                          </div>
                        </div>
                      </div>
                      {/* Contratto */}
                      <div>
                        <SectionTitle icon={<Briefcase size={12}/>} title="Contratto"/>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Tipo contratto</label>
                            <select value={profForm.contract_type || ''} onChange={e => { setProfForm(p => ({ ...p, contract_type: e.target.value as ContractType || null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60' : '')} title="Contratto">
                              <option value="">—</option>
                              {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={lbl}>Stato</label>
                            <select value={profForm.status || 'attivo'} onChange={e => { setProfForm(p => ({ ...p, status: e.target.value as EmployeeStatus })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60' : '')} title="Stato">
                              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </div>
                          {[['Data assunzione', 'hire_date', 'date'], ['Fine contratto', 'contract_end_date', 'date']].map(([label, key, type]) => (
                            <div key={key}>
                              <label className={lbl}>{label}</label>
                              <input type={type} value={(profForm as any)[key] || ''} onChange={e => { setProfForm(p => ({ ...p, [key]: e.target.value || null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 cursor-default bg-slate-50' : '')}/>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Ferie & Permessi */}
                      <div>
                        <SectionTitle icon={<Calendar size={12}/>} title="Ferie & Permessi"/>
                        <div className="grid grid-cols-2 gap-3">
                          {[['Ferie gg/anno', 'ferie_giorni_anno', 26], ['Ferie residue', 'ferie_giorni_residui', 26], ['Permessi h/anno', 'permessi_ore_anno', 104], ['Permessi residui (h)', 'permessi_ore_residui', 104]].map(([label, key, def]) => (
                            <div key={String(key)}>
                              <label className={lbl}>{label}</label>
                              <input type="number" value={(profForm as any)[key] ?? def} onChange={e => { setProfForm(p => ({ ...p, [key]: Number(e.target.value) })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 cursor-default bg-slate-50' : '')}/>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Dati economici + bancari */}
                      <div>
                        <SectionTitle icon={<Banknote size={12}/>} title="Dati Economici"/>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={lbl}>RAL (€)</label><input type="number" value={profForm.gross_salary || ''} onChange={e => { setProfForm(p => ({ ...p, gross_salary: e.target.value ? Number(e.target.value) : null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} placeholder="0"/></div>
                          <div><label className={lbl}>Netto/mese (€)</label><input type="number" value={profForm.net_salary || ''} onChange={e => { setProfForm(p => ({ ...p, net_salary: e.target.value ? Number(e.target.value) : null })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} placeholder="0"/></div>
                          <div><label className={lbl}>Codice Fiscale</label><input value={profForm.tax_code || ''} onChange={e => { setProfForm(p => ({ ...p, tax_code: e.target.value.toUpperCase() })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} maxLength={16} placeholder="RSSMRA80A01H501U"/></div>
                          <div><label className={lbl}>IBAN</label><input value={profForm.iban || ''} onChange={e => { setProfForm(p => ({ ...p, iban: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} placeholder="IT60X054280111001234567890"/></div>
                          <div className="col-span-2"><label className={lbl}>Contatto emergenza</label><input value={profForm.emergency_contact || ''} onChange={e => { setProfForm(p => ({ ...p, emergency_contact: e.target.value })); setProfDirty(true) }} disabled={!isAdmin} className={inp + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} placeholder="Mario Rossi — +39 333 1234567"/></div>
                        </div>
                      </div>
                      {/* Note */}
                      <div>
                        <label className={lbl}>Note interne</label>
                        <textarea value={profForm.notes || ''} onChange={e => { setProfForm(p => ({ ...p, notes: e.target.value })); setProfDirty(true) }} rows={3} disabled={!isAdmin} className={inp + ' resize-none' + (!isAdmin ? ' opacity-60 bg-slate-50' : '')} placeholder="Annotazioni…"/>
                      </div>
                    </div>
                  )}

                  {/* ── Documenti ── */}
                  {detailTab === 'documenti' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex gap-2 px-6 py-3 border-b border-slate-100 shrink-0 overflow-x-auto">
                        {DOC_CATS.map(c => {
                          const count = documents.filter(d => d.profile_id === selectedId && d.category === c.key).length
                          return (
                            <button key={c.key} onClick={() => setDocCat(c.key)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${docCat === c.key ? c.active + ' shadow-md border-transparent' : c.inactive + ' border'}`}>
                              {c.icon}{c.label}{count > 0 && <span className="opacity-70">({count})</span>}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {documents.filter(d => d.profile_id === selectedId && d.category === docCat).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-14 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center"><FileText size={22} className="text-slate-200"/></div>
                            <p className="text-xs text-slate-400">Nessun documento in questa categoria</p>
                          </div>
                        )}
                        {documents.filter(d => d.profile_id === selectedId && d.category === docCat).map(doc => {
                          const isExpiring = doc.expiry_date && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 86400000)
                          return (
                            <div key={doc.id} className={`flex items-center gap-3 bg-white rounded-2xl border px-4 py-3 shadow-sm hover:shadow-md transition-shadow ${isExpiring ? 'border-red-200 bg-red-50/30' : 'border-slate-200/60'}`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExpiring ? 'bg-red-100' : 'bg-slate-100'}`}>
                                <FileText size={15} className={isExpiring ? 'text-red-400' : 'text-slate-400'}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                                  {doc.file_name && <span className="truncate max-w-[120px]">{doc.file_name}</span>}
                                  {doc.expiry_date && <span className={`flex items-center gap-0.5 font-medium ${isExpiring ? 'text-red-500' : 'text-slate-400'}`}>{isExpiring && <AlertTriangle size={9}/>}Scade {fmtDate(doc.expiry_date)}</span>}
                                  {doc.notes && <span>· {doc.notes}</span>}
                                </div>
                              </div>
                              {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-rose-500 hover:text-rose-600 shrink-0 px-2.5 py-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">Apri</a>}
                              {isAdmin && <button onClick={() => onDeleteDocument(doc.id)} className="text-slate-200 hover:text-red-400 transition-colors shrink-0 p-1 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>}
                            </div>
                          )
                        })}
                      </div>
                      {isAdmin && (
                        <div className="px-6 py-3 border-t border-slate-100 shrink-0 bg-slate-50/30">
                          {!showDocForm ? (
                            <button onClick={() => setShowDocForm(true)} className="flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors py-1">
                              <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center"><Plus size={12}/></div>Aggiungi documento
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2"><input value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome documento *" className={inp + ' text-xs py-2'}/></div>
                                <input type="date" value={docForm.expiry_date} onChange={e => setDocForm(p => ({ ...p, expiry_date: e.target.value }))} className={inp + ' text-xs py-2'} title="Scadenza"/>
                                <input value={docForm.notes} onChange={e => setDocForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note opzionali" className={inp + ' text-xs py-2'}/>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <input ref={docFileRef} type="file" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)}/>
                                <button onClick={() => docFileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-colors shadow-sm">
                                  <Upload size={11}/>{docFile ? docFile.name.slice(0, 20) + '…' : 'Allega file (opz.)'}
                                </button>
                                <button onClick={handleAddDocument} disabled={uploadingDoc || !docForm.name.trim()} className="flex items-center gap-1.5 text-xs bg-rose-500 text-white px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-rose-600 transition-colors font-semibold shadow-sm">
                                  {uploadingDoc ? 'Carico…' : 'Salva'}
                                </button>
                                <button onClick={() => { setShowDocForm(false); setDocForm({ name: '', expiry_date: '', notes: '' }); setDocFile(null) }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2">Annulla</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Timbrature ── */}
                  {detailTab === 'timbrature' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setWorkMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 })} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={14}/></button>
                          <span className="text-sm font-bold text-slate-700 capitalize min-w-[140px] text-center">{monthLabel(workMonth.y, workMonth.m)}</span>
                          <button onClick={() => setWorkMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 })} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={14}/></button>
                        </div>
                        {(() => {
                          const recs = workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m })
                          const tot = parseFloat(recs.reduce((s, r) => s + r.hours_worked, 0).toFixed(1))
                          return (
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
                                <span className="text-slate-400">Giorni:</span><span className="font-bold text-slate-700">{recs.length}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-1.5 border border-blue-100">
                                <span className="text-blue-400">Ore totali:</span><span className="font-bold text-blue-700">{tot}h</span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
                        {workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m }).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center"><Timer size={22} className="text-slate-200"/></div>
                            <p className="text-xs text-slate-400">Nessuna timbratura in {monthLabel(workMonth.y, workMonth.m)}</p>
                          </div>
                        )}
                        {workRecords.filter(r => { const d = new Date(r.date); return r.profile_id === selectedId && d.getFullYear() === workMonth.y && d.getMonth() === workMonth.m })
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(r => {
                          const hasPending = pendingRecordIds.has(r.id)
                          return (
                          <div key={r.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow ${hasPending ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200/70'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasPending ? 'bg-amber-100 border border-amber-200' : 'bg-blue-50 border border-blue-100'}`}>
                              <span className={`text-[10px] font-bold ${hasPending ? 'text-amber-700' : 'text-blue-600'}`}>{new Date(r.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).replace(' ', '\n')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {hasPending && <Bell size={11} className="text-amber-500 animate-pulse flex-shrink-0" />}
                                <span className={`font-bold ${hasPending ? 'text-amber-700 animate-pulse' : 'text-slate-800'}`}>{r.hours_worked}h</span>
                                {r.check_in && r.check_out && <span className={`text-xs px-2 py-0.5 rounded-lg ${hasPending ? 'text-amber-700 bg-amber-100' : 'text-slate-400 bg-slate-50'}`}>{r.check_in} → {r.check_out}</span>}
                              </div>
                              {hasPending && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Richiesta modifica in attesa</p>}
                              {r.notes && <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.notes}</p>}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => handleHROpenEdit(r)} title="Richiedi modifica" className="text-slate-200 hover:text-orange-400 transition-colors p-1 hover:bg-orange-50 rounded-lg"><Pencil size={13}/></button>
                                <button onClick={() => onDeleteWorkRecord(r.id)} title="Elimina" className="text-slate-200 hover:text-red-400 transition-colors p-1 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>
                              </div>
                            )}
                          </div>
                          )
                        })}
                      </div>
                      {isAdmin && (
                        <div className="px-6 py-3 border-t border-slate-100 shrink-0 bg-slate-50/30">
                          {!showWorkForm ? (
                            <button onClick={() => setShowWorkForm(true)} className="flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors py-1">
                              <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center"><Plus size={12}/></div>Aggiungi giorno
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2">
                                <input type="date" value={workForm.date} onChange={e => setWorkForm(p => ({ ...p, date: e.target.value }))} className={inp + ' text-xs py-2'} title="Data"/>
                                <input type="number" step="0.5" value={workForm.hours_worked} onChange={e => setWorkForm(p => ({ ...p, hours_worked: e.target.value }))} placeholder="Ore" className={inp + ' text-xs py-2'}/>
                                <input type="time" value={workForm.check_in} onChange={e => setWorkForm(p => ({ ...p, check_in: e.target.value }))} className={inp + ' text-xs py-2'} title="Entrata"/>
                                <input type="time" value={workForm.check_out} onChange={e => setWorkForm(p => ({ ...p, check_out: e.target.value }))} className={inp + ' text-xs py-2'} title="Uscita"/>
                              </div>
                              <div className="flex items-center gap-2">
                                <input value={workForm.notes} onChange={e => setWorkForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note" className={inp + ' text-xs py-2 flex-1'}/>
                                <button onClick={handleAddWork} disabled={savingWork || !workForm.date} className="flex items-center gap-1.5 text-xs bg-rose-500 text-white px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-rose-600 transition-colors font-semibold shadow-sm shrink-0">{savingWork ? 'Salvo…' : 'Salva'}</button>
                                <button onClick={() => { setShowWorkForm(false); setWorkForm({ date: '', hours_worked: '', check_in: '', check_out: '', notes: '' }) }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 shrink-0">Annulla</button>
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
            <div className="flex items-center justify-between px-7 py-4 shrink-0 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Richieste</p>
                <p className="text-xs text-slate-400">{pendingLeaves} in attesa di approvazione</p>
              </div>
              <button onClick={() => setShowLeaveForm(true)} className="flex items-center gap-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all">
                <Plus size={14}/>Nuova richiesta
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-4 space-y-2">
              {leaveRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center"><Calendar size={26} className="text-slate-200"/></div>
                  <p className="text-sm text-slate-400">Nessuna richiesta ancora</p>
                </div>
              )}
              {leaveRequests.map(req => {
                const st = LEAVE_STATUS_CFG[req.status]
                const lt = LEAVE_LABELS[req.type]
                return (
                  <div key={req.id} className={`flex items-center gap-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow px-4 py-3 ${req.status === 'in_attesa' ? 'border-amber-100' : 'border-slate-200/60'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${lt.color} border`}>{lt.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{req.profile_name}</p>
                        <span className="text-xs text-slate-500">{lt.label}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ${st.cls}`}>{st.icon}{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(req.start_date)} – {fmtDate(req.end_date)} · <span className="font-medium text-slate-600">{req.days} gg</span>{req.hours ? ` · ${req.hours}h` : ''}{req.notes ? ` · ${req.notes}` : ''}</p>
                      {req.reviewed_by && <p className="text-[9px] text-slate-300 mt-0.5">Revisionato da {req.reviewed_by}</p>}
                    </div>
                    {isAdmin && req.status === 'in_attesa' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'approvato', currentUserName)} className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-3 py-2 text-xs font-semibold shadow-sm hover:bg-emerald-600 transition-colors"><CheckCircle2 size={11}/>Approva</button>
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'rifiutato', currentUserName)} className="flex items-center gap-1.5 bg-white text-red-500 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-red-50 transition-colors"><XCircle size={11}/>Rifiuta</button>
                      </div>
                    )}
                    <button onClick={() => { if (confirm('Eliminare questa richiesta?')) onDeleteLeave(req.id) }} className="text-slate-200 hover:text-red-400 transition-colors p-1.5 hover:bg-red-50 rounded-xl shrink-0"><Trash2 size={13}/></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB: STATISTICHE ═══ */}
        {mainTab === 'statistiche' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-4 px-7 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Anno</span>
                <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-rose-300 shadow-sm" title="Anno">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Mese</span>
                <select value={statsMonth === null ? '' : statsMonth} onChange={e => setStatsMonth(e.target.value === '' ? null : Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-rose-300 shadow-sm" title="Mese">
                  <option value="">Tutto l'anno</option>
                  {Array.from({length:12},(_,i)=>i).map(m=><option key={m} value={m}>{new Date(statsYear,m,1).toLocaleString('it-IT',{month:'long'})}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-7 py-4">
              {stats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center"><BarChart2 size={26} className="text-slate-200"/></div>
                  <p className="text-sm text-slate-400">Nessun dipendente con profilo HR</p>
                </div>
              )}
              <div className="space-y-3">
                {stats.map(({ u, oreLav, giorniLav, ferieUsate, ferieResidue, ferieAnno, permUsateH, permResiduiH, permAnnoH }) => {
                  const feriePct = ferieAnno > 0 ? Math.round((ferieUsate / ferieAnno) * 100) : 0
                  const permPct  = permAnnoH > 0 ? Math.round((permUsateH / permAnnoH) * 100) : 0
                  return (
                    <div key={u.profile_id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow px-5 py-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(u.name)} flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}>
                          {u.hr?.photo_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={u.hr.photo_url} alt="" className="w-full h-full object-cover"/>
                            : <span className="text-white font-bold">{u.name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.hr?.role || '—'}{u.hr?.department ? ` · ${u.hr.department}` : ''}</p>
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded-full font-semibold ring-1 ${STATUS_CFG[u.hr!.status].badge}`}>{STATUS_CFG[u.hr!.status].label}</div>
                      </div>
                      {/* Stat chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        {[
                          { label: 'Ore Lavorate', value: `${oreLav}h`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                          { label: 'Giorni Lavorati', value: `${giorniLav} gg`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
                          { label: 'Ferie Residue', value: `${ferieResidue} gg`, color: ferieResidue < 5 ? 'text-amber-700' : 'text-emerald-700', bg: ferieResidue < 5 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100' },
                          { label: 'Permessi Residui', value: `${permResiduiH}h`, color: permResiduiH < 8 ? 'text-amber-700' : 'text-teal-700', bg: permResiduiH < 8 ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100' },
                        ].map(chip => (
                          <div key={chip.label} className={`rounded-xl border px-3 py-2 ${chip.bg}`}>
                            <p className={`text-base font-bold ${chip.color}`}>{chip.value}</p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{chip.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Progress bars */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Ferie usate</span><span className="font-semibold text-slate-600">{ferieUsate} / {ferieAnno} gg</span></div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all" style={{ width: `${Math.min(feriePct, 100)}%` }}/></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Permessi usati</span><span className="font-semibold text-slate-600">{permUsateH} / {permAnnoH}h</span></div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all" style={{ width: `${Math.min(permPct, 100)}%` }}/></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ LEAVE FORM MODAL ═══ */}
      <AnimatePresence>
        {showLeaveForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-[60]" onClick={() => setShowLeaveForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50">
                <div>
                  <h3 className="font-bold text-slate-800">Nuova Richiesta</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ferie, permessi o altro</p>
                </div>
                <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-colors"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={lbl}>Dipendente *</label>
                  <select value={leaveForm.profile_id} onChange={e => setLeaveForm(p => ({ ...p, profile_id: e.target.value }))} className={inp} title="Dipendente">
                    <option value="">Seleziona…</option>
                    {hrUsers.map(u => <option key={u.profile_id} value={u.profile_id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Tipo *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(LEAVE_LABELS) as [LeaveType, typeof LEAVE_LABELS[LeaveType]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setLeaveForm(p => ({ ...p, type: k }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${leaveForm.type === k ? v.color + ' border-current shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <span className="text-base">{v.icon}</span>{v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Dal *</label><input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} className={inp}/></div>
                  <div><label className={lbl}>Al *</label><input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} className={inp}/></div>
                </div>
                {leaveForm.start_date && leaveForm.end_date && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <Calendar size={13} className="text-rose-400"/>
                    <span className="text-xs font-semibold text-rose-700">{calcDays(leaveForm.start_date, leaveForm.end_date)} giorni</span>
                  </div>
                )}
                {leaveForm.type === 'permesso' && (
                  <div><label className={lbl}>Ore permesso</label><input type="number" step="0.5" value={leaveForm.hours} onChange={e => setLeaveForm(p => ({ ...p, hours: e.target.value }))} placeholder="Es: 4" className={inp}/></div>
                )}
                <div><label className={lbl}>Note</label><textarea value={leaveForm.notes} onChange={e => setLeaveForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inp + ' resize-none'} placeholder="Motivazione opzionale…"/></div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button onClick={() => setShowLeaveForm(false)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold transition-colors shadow-sm">Annulla</button>
                <button onClick={handleAddLeave} disabled={savingLeave || !leaveForm.profile_id || !leaveForm.start_date || !leaveForm.end_date}
                  className="flex-1 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl py-2.5 text-sm font-semibold shadow-lg shadow-rose-200 disabled:opacity-50 hover:shadow-rose-300 transition-all">
                  {savingLeave ? 'Invio…' : 'Invia Richiesta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ HR EDIT RECORD MODAL ═══ */}
      <AnimatePresence>
        {hrEditModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-[60]" onClick={e => { if (e.target === e.currentTarget) setHrEditModal(null) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {hrEditModal.step === 'request' ? 'Richiedi modifica' : hrEditModal.step === 'verify' ? 'Inserisci codice' : 'Modifica timbratura'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(hrEditModal.record.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <button onClick={() => setHrEditModal(null)} title="Chiudi" className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-colors"><X size={18}/></button>
              </div>

              {hrEditModal.step === 'request' && (
                <div className="p-6 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-700 mb-1">Dati attuali</p>
                    <p>{hrEditModal.record.check_in && hrEditModal.record.check_out ? `${hrEditModal.record.check_in} → ${hrEditModal.record.check_out}` : `${hrEditModal.record.hours_worked}h`}</p>
                  </div>
                  {modCodes.find(c => c.record_id === hrEditModal.record.id)?.status === 'requested' ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
                        <Bell size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 font-medium">Il dipendente ha già richiesto la modifica. Genera il codice e comunicaglielo verbalmente.</p>
                      </div>
                      <button onClick={handleHRSendCode} disabled={sendingCode} className="w-full bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all disabled:opacity-60">
                        Genera codice
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">Verrà generato un codice da comunicare verbalmente al dipendente per autorizzare la modifica.</p>
                      <button onClick={handleHRSendCode} disabled={sendingCode} className="w-full bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all disabled:opacity-60">
                        Genera codice di autorizzazione
                      </button>
                    </>
                  )}
                </div>
              )}

              {hrEditModal.step === 'verify' && (
                <div className="p-6 space-y-4">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                    <p className="text-xs font-semibold text-orange-600 mb-1">In attesa del codice</p>
                    <p className="text-xs text-slate-500">Chiedi al dipendente di aprire l&apos;app e comunicarti il codice nella sezione Timbrature</p>
                  </div>
                  <div>
                    <label className={lbl}>Codice di autorizzazione</label>
                    <input
                      value={hrEditModal.codeInput}
                      onChange={e => setHrEditModal(p => p ? { ...p, codeInput: e.target.value.toUpperCase(), error: '' } : null)}
                      placeholder="Es: A1B2C3"
                      maxLength={6}
                      className={inp + ' text-center text-xl font-mono tracking-widest uppercase'}
                    />
                    {hrEditModal.error && <p className="text-xs text-red-500 mt-1">{hrEditModal.error}</p>}
                  </div>
                  <button onClick={handleHRVerifyCode} disabled={hrEditModal.codeInput.length < 6} className="w-full bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-orange-200 disabled:opacity-50 transition-all">
                    Verifica codice
                  </button>
                </div>
              )}

              {hrEditModal.step === 'edit' && (
                <div className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Entrata</label>
                      <input type="time" value={hrEditModal.editForm.check_in} title="Ora entrata"
                        onChange={e => setHrEditModal(p => p ? { ...p, editForm: { ...p.editForm, check_in: e.target.value } } : null)}
                        className={inp + ' text-xs py-2'}/>
                    </div>
                    <div>
                      <label className={lbl}>Uscita</label>
                      <input type="time" value={hrEditModal.editForm.check_out} title="Ora uscita"
                        onChange={e => setHrEditModal(p => p ? { ...p, editForm: { ...p.editForm, check_out: e.target.value } } : null)}
                        className={inp + ' text-xs py-2'}/>
                    </div>
                  </div>
                  {(!hrEditModal.editForm.check_in || !hrEditModal.editForm.check_out) && (
                    <div>
                      <label className={lbl}>Ore lavorate</label>
                      <input type="number" step="0.5" value={hrEditModal.editForm.hours_worked} title="Ore lavorate" placeholder="0.0"
                        onChange={e => setHrEditModal(p => p ? { ...p, editForm: { ...p.editForm, hours_worked: e.target.value } } : null)}
                        className={inp + ' text-xs py-2'}/>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Note</label>
                    <input value={hrEditModal.editForm.notes} title="Note"
                      onChange={e => setHrEditModal(p => p ? { ...p, editForm: { ...p.editForm, notes: e.target.value } } : null)}
                      placeholder="Note opzionali…" className={inp + ' text-xs py-2'}/>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setHrEditModal(null)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold transition-colors">Annulla</button>
                    <button onClick={handleHREditSave} disabled={savingHREdit} className="flex-1 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl py-2.5 text-sm font-semibold shadow-lg shadow-orange-200 disabled:opacity-50 transition-all">
                      {savingHREdit ? 'Salvo…' : 'Salva'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

