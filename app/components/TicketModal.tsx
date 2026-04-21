'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Ticket, UserCheck, ChevronDown, Users, Search, Check,
  ShoppingCart, FileText, Headphones, BookOpen, Phone,
  PhoneIncoming, PhoneOutgoing, Paperclip, Upload, Trash2, ExternalLink,
} from 'lucide-react'
import { Ticket as TicketType, TicketCategory, TicketAttachment } from '../hooks/useTickets'
import { Preventivo } from '../hooks/usePreventivi'

interface UserProfile { id: string; full_name: string; email?: string }

export const CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  ordine:         { label: 'Ordine',         icon: <ShoppingCart size={15} />, color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  preventivo:     { label: 'Preventivo',     icon: <FileText size={15} />,     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  assistenza:     { label: 'Assistenza',     icon: <Headphones size={15} />,   color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  documentazione: { label: 'Documentazione', icon: <BookOpen size={15} />,     color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  chiamata:       { label: 'Chiamata',       icon: <Phone size={15} />,        color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
}

const CATEGORIES: TicketCategory[] = ['ordine', 'preventivo', 'assistenza', 'documentazione', 'chiamata']
const PRIORITIES: { value: TicketType['priority']; label: string }[] = [
  { value: 'bassa', label: '🟢 Bassa' },
  { value: 'normale', label: '🔵 Normale' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'urgente', label: '🔴 Urgente' },
]
const HAS_ATTACHMENTS: TicketCategory[] = ['ordine', 'assistenza', 'documentazione']

const inputClass = "w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all text-sm"
const labelClass = "block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string; description?: string; priority: TicketType['priority']
    category: TicketCategory; call_direction?: TicketType['call_direction']
    preventivo_id?: string | null; preventivo_numero?: string | null
    due_date?: string | null; assignees: { user_id: string; user_name: string }[]
  }) => Promise<string | null>
  onUploadAttachment?: (ticketId: string, file: File) => Promise<TicketAttachment | null>
  onDeleteAttachment?: (attachment: TicketAttachment) => Promise<void>
  editTicket?: TicketType | null
  teamProfiles: UserProfile[]
  preventivi?: Preventivo[]
  currentUserName?: string
  fixedAssignees?: { user_id: string; user_name: string }[]
}

export default function TicketModal({
  isOpen, onClose, onSave, editTicket, teamProfiles, preventivi = [],
  onUploadAttachment, onDeleteAttachment, fixedAssignees,
}: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketType['priority']>('normale')
  const [category, setCategory] = useState<TicketCategory>('assistenza')
  const [callDirection, setCallDirection] = useState<'in' | 'out'>('in')
  const [preventivoId, setPreventivoId] = useState<string>('')
  const [preventivoSearch, setPreventivoSearch] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<{ user_id: string; user_name: string }[]>([])
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editTicket) {
      setTitle(editTicket.title)
      setDescription(editTicket.description || '')
      setPriority(editTicket.priority)
      setCategory((editTicket.category as TicketCategory) || 'assistenza')
      setCallDirection((editTicket.call_direction as 'in' | 'out') || 'in')
      setPreventivoId(editTicket.preventivo_id || '')
      setDueDate(editTicket.due_date || '')
      setSelectedAssignees(editTicket.assignees.map(a => ({ user_id: a.user_id, user_name: a.user_name })))
    } else {
      setTitle(''); setDescription(''); setPriority('normale'); setCategory('assistenza')
      setCallDirection('in'); setPreventivoId(''); setPreventivoSearch(''); setDueDate('')
      setSelectedAssignees(fixedAssignees ?? [])
    }
    setPendingFiles([])
    setError('')
  }, [editTicket, isOpen])

  const handleSave = async () => {
    if (!title.trim()) { setError('Il titolo \u00e8 obbligatorio'); return }
    if (selectedAssignees.length === 0) { setError('Assegna il ticket ad almeno una persona'); return }
    const selectedPrev = preventivi.find(p => p.id === preventivoId)
    setSaving(true)
    try {
      const ticketId = await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority, category,
        call_direction: category === 'chiamata' ? callDirection : null,
        preventivo_id: category === 'preventivo' ? (preventivoId || null) : null,
        preventivo_numero: category === 'preventivo' ? (selectedPrev?.numero || null) : null,
        due_date: dueDate || null,
        assignees: selectedAssignees,
      })
      // Upload file in coda per ticket appena creato
      if (!editTicket && ticketId && pendingFiles.length > 0 && onUploadAttachment) {
        for (let i = 0; i < pendingFiles.length; i++) {
          setUploadProgress({ current: i + 1, total: pendingFiles.length })
          await onUploadAttachment(ticketId, pendingFiles[i])
        }
        setUploadProgress(null)
      }
      onClose()
    } catch {
      setError('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !editTicket || !onUploadAttachment) return
    const fileArr = Array.from(files)
    for (let i = 0; i < fileArr.length; i++) {
      setUploadProgress({ current: i + 1, total: fileArr.length })
      await onUploadAttachment(editTicket.id, fileArr[i])
    }
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePendingFilesChange = (files: FileList | null) => {
    if (!files) return
    setPendingFiles(prev => [...prev, ...Array.from(files)])
    if (newFileInputRef.current) newFileInputRef.current.value = ''
  }

  const filteredPreventivi = preventivi.filter(p => {
    const q = preventivoSearch.toLowerCase()
    return !q || p.numero.toLowerCase().includes(q) || (p.oggetto || '').toLowerCase().includes(q)
  })

  if (!isOpen) return null
  const attachments = editTicket?.attachments || []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                  <Ticket size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-slate-800 font-bold text-lg">{editTicket ? 'Modifica Ticket' : 'Nuovo Ticket'}</h2>
                  <p className="text-slate-400 text-xs">Commessa interna</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Categoria */}
              <div>
                <label className={labelClass}>Categoria</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat]
                    const active = category === cat
                    return (
                      <button key={cat} type="button" onClick={() => setCategory(cat)}
                        className={`flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                          active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}>
                        {cfg.icon}
                        <span className="text-center leading-tight text-[10px]">{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Direzione chiamata */}
              {category === 'chiamata' && (
                <div>
                  <label className={labelClass}>Direzione chiamata</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['in', 'out'] as const).map(dir => (
                      <button key={dir} type="button" onClick={() => setCallDirection(dir)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          callDirection === dir ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}>
                        {dir === 'in' ? <PhoneIncoming size={16} /> : <PhoneOutgoing size={16} />}
                        {dir === 'in' ? 'In entrata' : 'In uscita'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventivo collegato */}
              {category === 'preventivo' && (
                <div>
                  <label className={labelClass}>Collega preventivo</label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={preventivoSearch} onChange={e => setPreventivoSearch(e.target.value)}
                      placeholder="Cerca per numero o oggetto..."
                      className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl pl-8 pr-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all" />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200/60 rounded-xl p-1.5 bg-slate-50/40">
                    {filteredPreventivi.length === 0 && <p className="text-slate-400 text-xs text-center py-4">Nessun preventivo trovato</p>}
                    {filteredPreventivi.map(p => {
                      const sel = preventivoId === p.id
                      return (
                        <button key={p.id} type="button" onClick={() => setPreventivoId(sel ? '' : p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${sel ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-white border border-slate-100 text-slate-700 hover:border-slate-200'}`}>
                          <span className="font-semibold shrink-0 text-xs">{p.numero}</span>
                          <span className="flex-1 truncate text-xs text-slate-500">{p.oggetto}</span>
                          <span className="text-xs font-semibold text-slate-600">\u20ac{p.totale.toFixed(0)}</span>
                          {sel && <Check size={13} className="text-emerald-600 shrink-0" strokeWidth={3} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Titolo */}
              <div>
                <label className={labelClass}>Titolo *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={
                    category === 'chiamata' ? 'Es. Chiamata cliente Rossi...' :
                    category === 'ordine' ? 'Es. Ordine materiale via Roma 12...' :
                    category === 'preventivo' ? 'Es. Richiesta preventivo impianto...' :
                    'Titolo...'
                  }
                  className={inputClass} autoFocus />
              </div>

              {/* Descrizione */}
              <div>
                <label className={labelClass}>Descrizione / Note</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Dettagli, istruzioni, riferimenti..." rows={3}
                  className={`${inputClass} resize-none`} />
              </div>

              {/* Priorit\u00e0 + Scadenza */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Priorit\u00e0</label>
                  <div className="relative">
                    <select value={priority} onChange={e => setPriority(e.target.value as TicketType['priority'])}
                      className={`${inputClass} appearance-none pr-8`}>
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Scadenza</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Assegnatari */}
              <div>
                <label className={labelClass}>
                  {fixedAssignees ? 'Inviato a' : <>Assegna a *{selectedAssignees.length > 0 && <span className="text-violet-500 ml-1 normal-case">({selectedAssignees.length} selezionati)</span>}</>}
                </label>
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAssignees.map(a => (
                      <span key={a.user_id} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs rounded-lg px-2.5 py-1.5">
                        <UserCheck size={12} /> {a.user_name}
                        {!fixedAssignees && <button onClick={() => setSelectedAssignees(prev => prev.filter(x => x.user_id !== a.user_id))} className="text-violet-400 hover:text-violet-700 ml-0.5"><X size={11} /></button>}
                      </span>
                    ))}
                  </div>
                )}
                {!fixedAssignees && (
                  <button type="button" onClick={() => { setAssigneeSearch(''); setShowAssigneePicker(true) }}
                    className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-3 text-left text-slate-400 hover:border-violet-300 transition-colors flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Users size={14} /> {selectedAssignees.length === 0 ? 'Seleziona persone...' : 'Modifica selezione'}</span>
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>

              {/* Allegati (solo ticket esistenti) */}
              {editTicket && HAS_ATTACHMENTS.includes(category) && (
                <div>
                  <label className={labelClass}>
                    Allegati{attachments.length > 0 && <span className="text-violet-500 ml-1 normal-case">({attachments.length})</span>}
                  </label>
                  {attachments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <Paperclip size={13} className="text-slate-400 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 truncate">{att.file_name}</span>
                          {att.file_size && <span className="text-xs text-slate-400">{(att.file_size / 1024).toFixed(0)} KB</span>}
                          <a href={att.public_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-500 transition-colors p-0.5">
                            <ExternalLink size={13} />
                          </a>
                          {onDeleteAttachment && (
                            <button onClick={() => onDeleteAttachment(att)} className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept="*/*" className="hidden"
                    onChange={e => handleFileUpload(e.target.files)} />

                  {uploadProgress ? (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-violet-700 font-medium flex items-center gap-1.5">
                          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">
                            <Upload size={13} />
                          </motion.span>
                          Caricamento file {uploadProgress.current} di {uploadProgress.total}...
                        </span>
                        <span className="text-violet-500">{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 justify-center bg-slate-50/80 border border-dashed border-slate-300 hover:border-violet-300 hover:bg-violet-50/40 rounded-xl px-4 py-3 text-slate-400 hover:text-violet-500 text-sm transition-all">
                      <Upload size={15} /> Carica documenti
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-1 text-center">PDF, Word, immagini, ecc.</p>
                </div>
              )}

              {/* Allegati per ticket nuovo: file in coda */}
              {!editTicket && HAS_ATTACHMENTS.includes(category) && (
                <div>
                  <label className={labelClass}>Allegati (opzionale)</label>
                  {pendingFiles.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {pendingFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <Paperclip size={13} className="text-slate-400 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 truncate">{f.name}</span>
                          <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                          <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors p-0.5">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={newFileInputRef} type="file" multiple accept="*/*" className="hidden"
                    onChange={e => handlePendingFilesChange(e.target.files)} />
                  <button type="button" onClick={() => newFileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 justify-center bg-slate-50/80 border border-dashed border-slate-300 hover:border-violet-300 hover:bg-violet-50/40 rounded-xl px-4 py-3 text-slate-400 hover:text-violet-500 text-sm transition-all">
                    <Upload size={15} /> Allega documenti
                  </button>
                  <p className="text-xs text-slate-400 mt-1 text-center">I file verranno caricati insieme al ticket</p>
                </div>
              )}

              {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-3 font-medium transition-colors text-sm">Annulla</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-violet-200 text-sm">
                  {saving ? 'Salvataggio...' : editTicket ? 'Aggiorna' : 'Crea Ticket'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modale assegnatari */}
      <AnimatePresence>
        {showAssigneePicker && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAssigneePicker(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60">
                <div>
                  <h3 className="text-slate-800 font-semibold text-base">Seleziona persone</h3>
                  <p className="text-slate-400 text-xs">{selectedAssignees.length} selezionati</p>
                </div>
                <button onClick={() => setShowAssigneePicker(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)}
                    placeholder="Cerca..." autoFocus
                    className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl pl-8 pr-4 py-2 text-slate-800 text-sm placeholder-slate-400 focus:border-violet-300 outline-none transition-all" />
                </div>
              </div>
              <div className="px-2 pb-2 max-h-64 overflow-y-auto">
                {teamProfiles.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Nessun membro disponibile</p>}
                {teamProfiles.filter(p => {
                  const q = assigneeSearch.toLowerCase()
                  return !q || (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)
                }).map(profile => {
                  const isSelected = selectedAssignees.some(a => a.user_id === profile.id)
                  const displayName = profile.full_name || profile.email || '?'
                  return (
                    <button key={profile.id} type="button"
                      onClick={() => isSelected
                        ? setSelectedAssignees(prev => prev.filter(a => a.user_id !== profile.id))
                        : setSelectedAssignees(prev => [...prev, { user_id: profile.id, user_name: displayName }])
                      }
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-0.5 ${isSelected ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                        {displayName[0].toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-medium">{displayName}</span>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-300'}`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <button type="button" onClick={() => setSelectedAssignees([])}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-medium transition-colors">Deseleziona tutti</button>
                <button type="button" onClick={() => setShowAssigneePicker(false)}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl py-2 text-sm font-medium shadow-md shadow-violet-200">
                  Conferma {selectedAssignees.length > 0 ? `(${selectedAssignees.length})` : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
