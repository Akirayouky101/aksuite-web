'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserCheck, Plus, Search, Edit2, Trash2, Users, Calendar,
  Phone, Mail, FileText, Upload, ImageOff, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Briefcase, AlertCircle, PiggyBank,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  HREmployee, HRLeaveRequest, LeaveStatus, LeaveType, ContractType, EmployeeStatus,
} from '../hooks/useHR'

interface HRPanelProps {
  isOpen: boolean
  onClose: () => void
  employees: HREmployee[]
  leaveRequests: HRLeaveRequest[]
  isAdmin: boolean
  onAddEmployee: (data: Omit<HREmployee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<HREmployee | null>
  onUpdateEmployee: (id: string, data: Partial<HREmployee>) => Promise<void>
  onDeleteEmployee: (id: string) => Promise<void>
  onAddLeave: (data: Omit<HRLeaveRequest, 'id' | 'user_id' | 'created_at'>) => Promise<HRLeaveRequest | null>
  onUpdateLeaveStatus: (id: string, status: LeaveStatus, reviewedBy: string) => Promise<void>
  onDeleteLeave: (id: string) => Promise<void>
  currentUserName: string
}

const CONTRACT_LABELS: Record<ContractType, string> = {
  indeterminato: 'Tempo Indeterminato', determinato: 'Tempo Determinato',
  apprendistato: 'Apprendistato', collaborazione: 'Co.co.co.', stage: 'Stage', consulente: 'Consulente',
}
const STATUS_CFG: Record<EmployeeStatus, { label: string; color: string; bg: string; border: string }> = {
  attivo:    { label: 'Attivo',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  in_prova:  { label: 'In Prova', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  sospeso:   { label: 'Sospeso',  color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  cessato:   { label: 'Cessato',  color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200' },
}
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ferie: '🏖 Ferie', permesso: '⏰ Permesso', malattia: '🤒 Malattia',
  maternita_paternita: '👶 Maternità/Paternità', altro: '📋 Altro',
}
const LEAVE_STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  in_attesa:  { label: 'In Attesa', color: 'text-amber-700',  bg: 'bg-amber-50',   icon: <Clock size={12} /> },
  approvato:  { label: 'Approvato', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle2 size={12} /> },
  rifiutato:  { label: 'Rifiutato', color: 'text-red-700',    bg: 'bg-red-50',     icon: <XCircle size={12} /> },
}

const emptyEmployee = (): Omit<HREmployee, 'id' | 'user_id' | 'created_at' | 'updated_at'> => ({
  full_name: '', role: '', department: '', email: '', phone: '', birth_date: null,
  hire_date: null, contract_type: 'indeterminato', contract_end_date: null,
  gross_salary: null, net_salary: null, iban: '', tax_code: '', address: '',
  emergency_contact: '', photo_url: null, notes: '', status: 'attivo',
  ferie_giorni_anno: 26, ferie_giorni_residui: 26,
})

type Tab = 'dipendenti' | 'ferie'

export default function HRPanel({
  isOpen, onClose, employees, leaveRequests, isAdmin,
  onAddEmployee, onUpdateEmployee, onDeleteEmployee,
  onAddLeave, onUpdateLeaveStatus, onDeleteLeave, currentUserName,
}: HRPanelProps) {
  const [tab, setTab] = useState<Tab>('dipendenti')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<HREmployee | null>(null)
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [empForm, setEmpForm] = useState(emptyEmployee())
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', type: 'ferie' as LeaveType, start_date: '', end_date: '', notes: '' })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | 'tutti'>('attivo')

  const filtered = employees.filter(e => {
    if (filterStatus !== 'tutti' && e.status !== filterStatus) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return e.full_name.toLowerCase().includes(q) || (e.role || '').toLowerCase().includes(q) || (e.department || '').toLowerCase().includes(q)
  })

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const resized = await new Promise<Blob>(resolve => {
        const img = new Image()
        img.onload = () => {
          const MAX = 400
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else { width = Math.round(width * MAX / height); height = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
        }
        img.src = URL.createObjectURL(file)
      })
      const path = `hr/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, resized, { contentType: 'image/jpeg', cacheControl: '3600' })
      if (error) { console.error(error); return }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      setEmpForm(prev => ({ ...prev, photo_url: urlData.publicUrl }))
    } finally { setUploadingPhoto(false) }
  }

  const openAdd = () => { setEditingEmployee(null); setEmpForm(emptyEmployee()); setShowEmpForm(true) }
  const openEdit = (e: HREmployee) => { setEditingEmployee(e); setEmpForm({ ...e } as any); setShowEmpForm(true) }

  const handleSaveEmployee = async () => {
    if (!empForm.full_name.trim()) return
    setSaving(true)
    if (editingEmployee) await onUpdateEmployee(editingEmployee.id, empForm)
    else await onAddEmployee(empForm)
    setSaving(false)
    setShowEmpForm(false)
  }

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const ms = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.round(ms / 86400000) + 1)
  }

  const handleSaveLeave = async () => {
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) return
    const emp = employees.find(e => e.id === leaveForm.employee_id)
    if (!emp) return
    setSaving(true)
    await onAddLeave({
      employee_id: leaveForm.employee_id,
      employee_name: emp.full_name,
      type: leaveForm.type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      days: calcDays(leaveForm.start_date, leaveForm.end_date),
      notes: leaveForm.notes || null,
      status: 'in_attesa',
      reviewed_by: null,
      reviewed_at: null,
    })
    setSaving(false)
    setShowLeaveForm(false)
    setLeaveForm({ employee_id: '', type: 'ferie', start_date: '', end_date: '', notes: '' })
  }

  if (!isOpen) return null

  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
  const labelCls = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-slate-800 font-bold text-lg">HR — Risorse Umane</h2>
              <p className="text-slate-400 text-xs">{employees.filter(e => e.status === 'attivo' || e.status === 'in_prova').length} dipendenti attivi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(['dipendenti', 'ferie'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t === 'dipendenti' ? <span className="flex items-center gap-1.5"><Users size={14} /> Dipendenti</span>
                : <span className="flex items-center gap-1.5"><Calendar size={14} /> Ferie & Permessi {leaveRequests.filter(r => r.status === 'in_attesa').length > 0 && <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center">{leaveRequests.filter(r => r.status === 'in_attesa').length}</span>}</span>}
            </button>
          ))}
        </div>

        {/* ── TAB DIPENDENTI ── */}
        {tab === 'dipendenti' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 shrink-0">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca dipendente..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-rose-300" />
              </div>
              <div className="flex gap-1">
                {(['tutti', 'attivo', 'in_prova', 'cessato'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === s ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                    {s === 'tutti' ? 'Tutti' : STATUS_CFG[s as EmployeeStatus].label}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <button onClick={openAdd}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all shrink-0">
                  <Plus size={15} /> Aggiungi
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Nessun dipendente trovato</p>
                </div>
              )}
              {filtered.map(emp => {
                const st = STATUS_CFG[emp.status]
                const isExp = expandedId === emp.id
                return (
                  <div key={emp.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <button className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedId(isExp ? null : emp.id)}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {emp.photo_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                          : <span className="text-slate-400 font-bold text-sm">{emp.full_name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{emp.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.role || '—'}{emp.department ? ` · ${emp.department}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
                        {emp.ferie_giorni_residui !== null && (
                          <span className="text-xs text-slate-400 hidden sm:block">{emp.ferie_giorni_residui}gg ferie</span>
                        )}
                        {isExp ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExp && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-500">
                              {emp.email && <div className="flex items-center gap-1.5"><Mail size={11} className="text-slate-400" />{emp.email}</div>}
                              {emp.phone && <div className="flex items-center gap-1.5"><Phone size={11} className="text-slate-400" />{emp.phone}</div>}
                              {emp.hire_date && <div className="flex items-center gap-1.5"><Briefcase size={11} className="text-slate-400" />Dal {new Date(emp.hire_date).toLocaleDateString('it-IT')}</div>}
                              {emp.contract_type && <div className="flex items-center gap-1.5"><FileText size={11} className="text-slate-400" />{CONTRACT_LABELS[emp.contract_type]}</div>}
                              {emp.gross_salary && <div className="flex items-center gap-1.5"><PiggyBank size={11} className="text-slate-400" />€{emp.gross_salary.toLocaleString('it-IT')}/anno lordi</div>}
                              {emp.tax_code && <div className="flex items-center gap-1.5"><FileText size={11} className="text-slate-400" />CF: {emp.tax_code}</div>}
                              <div className="flex items-center gap-1.5 col-span-full">
                                <Calendar size={11} className="text-slate-400" />
                                Ferie: <span className="font-medium text-slate-700">{emp.ferie_giorni_residui}</span>/{emp.ferie_giorni_anno} giorni residui
                              </div>
                            </div>
                            {emp.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{emp.notes}</p>}
                            {isAdmin && (
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => openEdit(emp)}
                                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs transition-colors">
                                  <Edit2 size={11} /> Modifica
                                </button>
                                <button onClick={() => { if (confirm(`Eliminare ${emp.full_name}?`)) onDeleteEmployee(emp.id) }}
                                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg px-3 py-1.5 text-xs transition-colors">
                                  <Trash2 size={11} /> Elimina
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB FERIE ── */}
        {tab === 'ferie' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 shrink-0">
              <p className="text-sm text-slate-500">{leaveRequests.filter(r => r.status === 'in_attesa').length} richieste in attesa</p>
              <button onClick={() => setShowLeaveForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all">
                <Plus size={15} /> Nuova richiesta
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {leaveRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Calendar size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Nessuna richiesta</p>
                </div>
              )}
              {leaveRequests.map(req => {
                const cfg = LEAVE_STATUS_CFG[req.status]
                return (
                  <div key={req.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{req.employee_name}</p>
                        <span className="text-xs text-slate-500">{LEAVE_TYPE_LABELS[req.type]}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(req.start_date).toLocaleDateString('it-IT')} – {new Date(req.end_date).toLocaleDateString('it-IT')} · {req.days} giorni
                        {req.notes && ` · ${req.notes}`}
                      </p>
                    </div>
                    {isAdmin && req.status === 'in_attesa' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'approvato', currentUserName)}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors">
                          <CheckCircle2 size={12} /> Approva
                        </button>
                        <button onClick={() => onUpdateLeaveStatus(req.id, 'rifiutato', currentUserName)}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors">
                          <XCircle size={12} /> Rifiuta
                        </button>
                      </div>
                    )}
                    <button onClick={() => { if (confirm('Eliminare questa richiesta?')) onDeleteLeave(req.id) }}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── FORM DIPENDENTE ── */}
      <AnimatePresence>
        {showEmpForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setShowEmpForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <h3 className="font-bold text-slate-800">{editingEmployee ? 'Modifica Dipendente' : 'Nuovo Dipendente'}</h3>
                <button onClick={() => setShowEmpForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto p-5 space-y-4">
                {/* Foto */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {empForm.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={empForm.photo_url} alt="foto" className="w-full h-full object-cover" />
                      : <ImageOff size={24} className="text-slate-300" />
                    }
                  </div>
                  <div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-medium transition-all disabled:opacity-50">
                      <Upload size={13} />{uploadingPhoto ? 'Caricamento...' : 'Foto profilo'}
                    </button>
                  </div>
                </div>
                {/* Dati base */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={labelCls}>Nome completo *</label><input value={empForm.full_name} onChange={e => setEmpForm(p => ({ ...p, full_name: e.target.value }))} className={inputCls} placeholder="Mario Rossi" /></div>
                  <div><label className={labelCls}>Ruolo</label><input value={empForm.role || ''} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} className={inputCls} placeholder="Es: Tecnico" /></div>
                  <div><label className={labelCls}>Reparto</label><input value={empForm.department || ''} onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} className={inputCls} placeholder="Es: Operativo" /></div>
                  <div><label className={labelCls}>Email</label><input type="email" value={empForm.email || ''} onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Telefono</label><input value={empForm.phone || ''} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Data nascita</label><input type="date" value={empForm.birth_date || ''} onChange={e => setEmpForm(p => ({ ...p, birth_date: e.target.value || null }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Data assunzione</label><input type="date" value={empForm.hire_date || ''} onChange={e => setEmpForm(p => ({ ...p, hire_date: e.target.value || null }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Contratto</label>
                    <select value={empForm.contract_type || 'indeterminato'} onChange={e => setEmpForm(p => ({ ...p, contract_type: e.target.value as ContractType }))} className={inputCls} title="Tipo contratto">
                      {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Fine contratto</label><input type="date" value={empForm.contract_end_date || ''} onChange={e => setEmpForm(p => ({ ...p, contract_end_date: e.target.value || null }))} className={inputCls} /></div>
                  <div><label className={labelCls}>RAL (€/anno)</label><input type="number" value={empForm.gross_salary || ''} onChange={e => setEmpForm(p => ({ ...p, gross_salary: e.target.value ? Number(e.target.value) : null }))} className={inputCls} placeholder="0" /></div>
                  <div><label className={labelCls}>Netto (€/mese)</label><input type="number" value={empForm.net_salary || ''} onChange={e => setEmpForm(p => ({ ...p, net_salary: e.target.value ? Number(e.target.value) : null }))} className={inputCls} placeholder="0" /></div>
                  <div><label className={labelCls}>Codice Fiscale</label><input value={empForm.tax_code || ''} onChange={e => setEmpForm(p => ({ ...p, tax_code: e.target.value.toUpperCase() }))} className={inputCls} placeholder="RSSMRA..." maxLength={16} /></div>
                  <div><label className={labelCls}>IBAN</label><input value={empForm.iban || ''} onChange={e => setEmpForm(p => ({ ...p, iban: e.target.value }))} className={inputCls} placeholder="IT..." /></div>
                  <div className="col-span-2"><label className={labelCls}>Indirizzo</label><input value={empForm.address || ''} onChange={e => setEmpForm(p => ({ ...p, address: e.target.value }))} className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Contatto emergenza</label><input value={empForm.emergency_contact || ''} onChange={e => setEmpForm(p => ({ ...p, emergency_contact: e.target.value }))} className={inputCls} placeholder="Nome - Telefono" /></div>
                  <div><label className={labelCls}>Giorni ferie/anno</label><input type="number" value={empForm.ferie_giorni_anno} onChange={e => setEmpForm(p => ({ ...p, ferie_giorni_anno: Number(e.target.value) }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Giorni residui</label><input type="number" value={empForm.ferie_giorni_residui} onChange={e => setEmpForm(p => ({ ...p, ferie_giorni_residui: Number(e.target.value) }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Stato</label>
                    <select value={empForm.status} onChange={e => setEmpForm(p => ({ ...p, status: e.target.value as EmployeeStatus }))} className={inputCls} title="Stato dipendente">
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><label className={labelCls}>Note</label><textarea value={empForm.notes || ''} onChange={e => setEmpForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
                </div>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
                <button onClick={() => setShowEmpForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium transition-colors">Annulla</button>
                <button onClick={handleSaveEmployee} disabled={saving || !empForm.full_name.trim()}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg shadow-rose-200 disabled:opacity-50 transition-all">
                  {saving ? 'Salvataggio...' : editingEmployee ? 'Aggiorna' : 'Aggiungi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FORM NUOVA RICHIESTA FERIE ── */}
      <AnimatePresence>
        {showLeaveForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setShowLeaveForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Nuova Richiesta</h3>
                <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div><label className={labelCls}>Dipendente *</label>
                  <select value={leaveForm.employee_id} onChange={e => setLeaveForm(p => ({ ...p, employee_id: e.target.value }))} className={inputCls} title="Dipendente">
                    <option value="">Seleziona...</option>
                    {employees.filter(e => e.status === 'attivo' || e.status === 'in_prova').map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Tipo *</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value as LeaveType }))} className={inputCls} title="Tipo richiesta">
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Dal *</label><input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Al *</label><input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} className={inputCls} /></div>
                </div>
                {leaveForm.start_date && leaveForm.end_date && (
                  <p className="text-xs text-rose-600 font-medium">{calcDays(leaveForm.start_date, leaveForm.end_date)} giorni</p>
                )}
                <div><label className={labelCls}>Note</label><textarea value={leaveForm.notes} onChange={e => setLeaveForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
                <button onClick={() => setShowLeaveForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium transition-colors">Annulla</button>
                <button onClick={handleSaveLeave} disabled={saving || !leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg shadow-rose-200 disabled:opacity-50 transition-all">
                  {saving ? 'Salvataggio...' : 'Invia Richiesta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
