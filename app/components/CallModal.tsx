'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, User, Building2, Mail, MessageSquare, Calendar, Clock, MapPin, UserPlus, Trash2, ChevronDown, Wrench, Users } from 'lucide-react'
import SuccessModal from './SuccessModal'
import RelationsIntegration from './RelationsIntegration'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'

interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  address: string
  city: string
  zip_code: string
  province: string
  assigned_to: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  call_date: string
}

interface TeamMember {
  id: string
  name: string
  role: string
}

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (call: any) => Promise<void>
  editCall?: Call | null
  teamMembers?: TeamMember[]
  onAddTeamMember?: (name: string, role: string) => Promise<any>
  onDeleteTeamMember?: (id: string) => Promise<void>
  // Rubrica clienti
  clients?: Array<{ id: string; name: string; company: string; phone: string; email: string; address: string; city: string; zip_code: string; province: string }>
  onAddClient?: (data: any) => Promise<any>
  // Relazioni
  availableItems?: {
    passwords?: any[]
    calls?: any[]
    tasks?: any[]
    notes?: any[]
    events?: any[]
    transactions?: any[]
  }
  onAddRelation?: (sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string, relationType: RelationType, notes?: string) => Promise<void>
  onRemoveRelation?: (relationId: string) => Promise<void>
  getRelatedItems?: (type: EntityType, id: string, items: any) => Promise<RelatedItem[]>
  onNavigateToItem?: (type: EntityType, id: string) => void
}

const callTypes = [
  { value: 'informazioni', label: '📞 Informazioni', color: 'blue' },
  { value: 'assistenza', label: '🛠️ Assistenza', color: 'orange' },
  { value: 'vendita', label: '💼 Vendita', color: 'green' },
  { value: 'reclamo', label: '⚠️ Reclamo', color: 'red' },
  { value: 'altro', label: '📋 Altro', color: 'purple' }
]

const priorities = [
  { value: 'bassa', label: '🟢 Bassa', color: 'green' },
  { value: 'media', label: '🟡 Media', color: 'yellow' },
  { value: 'alta', label: '🔴 Alta', color: 'red' },
  { value: 'urgente', label: '🚨 Urgente', color: 'rose' }
]

export default function CallModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editCall,
  teamMembers = [],
  onAddTeamMember,
  onDeleteTeamMember,
  clients = [],
  onAddClient,
  availableItems,
  onAddRelation,
  onRemoveRelation,
  getRelatedItems,
  onNavigateToItem
}: CallModalProps) {
  const [callerName, setCallerName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [province, setProvince] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [callType, setCallType] = useState('informazioni')
  const [priority, setPriority] = useState('media')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [hasLavorazione, setHasLavorazione] = useState(false)
  const [lavorazioneDate, setLavorazioneDate] = useState('')
  const [lavorazioneTime, setLavorazioneTime] = useState('')
  const [lavorazioneDesc, setLavorazioneDesc] = useState('')
  const [lavorazioneAssignee, setLavorazioneAssignee] = useState('')
  const [showAddToRubrica, setShowAddToRubrica] = useState(false)
  const [pendingClientData, setPendingClientData] = useState<any>(null)
  const [addingToRubrica, setAddingToRubrica] = useState(false)

  useEffect(() => {
    if (editCall) {
      setCallerName(editCall.caller_name)
      setCompany(editCall.company)
      setPhone(editCall.phone)
      setEmail(editCall.email)
      setAddress(editCall.address || '')
      setCity(editCall.city || '')
      setZipCode(editCall.zip_code || '')
      setProvince(editCall.province || '')
      setAssignedTo(editCall.assigned_to || '')
      setCallType(editCall.call_type)
      setPriority(editCall.priority)
      setNotes(editCall.notes)
      setFollowUp(editCall.follow_up)
      setFollowUpDate(editCall.follow_up_date || '')
    } else {
      setCallerName(''); setCompany(''); setPhone(''); setEmail('')
      setAddress(''); setCity(''); setZipCode(''); setProvince('')
      setAssignedTo('')
      setCallType('informazioni'); setPriority('media')
      setNotes(''); setFollowUp(false); setFollowUpDate('')
      setHasLavorazione(false); setLavorazioneDate(''); setLavorazioneTime('')
      setLavorazioneDesc(''); setLavorazioneAssignee('')
    }
  }, [editCall, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        caller_name: callerName,
        company, phone, email,
        address, city, zip_code: zipCode, province,
        assigned_to: assignedTo,
        call_type: callType, priority, notes,
        follow_up: followUp,
        follow_up_date: followUpDate || null,
        status: editCall?.status || 'pending',
        call_date: editCall?.call_date || new Date().toISOString(),
        // Lavorazione
        has_lavorazione: hasLavorazione,
        lavorazione_date: hasLavorazione ? lavorazioneDate || null : null,
        lavorazione_time: hasLavorazione ? lavorazioneTime || null : null,
        lavorazione_description: hasLavorazione ? lavorazioneDesc : '',
        lavorazione_assignee: hasLavorazione ? lavorazioneAssignee : ''
      })
      setCallerName(''); setCompany(''); setPhone(''); setEmail('')
      setAddress(''); setCity(''); setZipCode(''); setProvince('')
      setAssignedTo('')
      setCallType('informazioni'); setPriority('media')
      setNotes(''); setFollowUp(false); setFollowUpDate('')
      setHasLavorazione(false); setLavorazioneDate(''); setLavorazioneTime('')
      setLavorazioneDesc(''); setLavorazioneAssignee('')

      // Check if caller exists in rubrica (only for new calls)
      if (!editCall && onAddClient && clients.length >= 0) {
        const nameToCheck = callerName.trim().toLowerCase()
        const phoneToCheck = phone.trim()
        const alreadyInRubrica = clients.some(c => 
          c.name.toLowerCase() === nameToCheck || 
          (phoneToCheck && c.phone && c.phone === phoneToCheck)
        )
        if (!alreadyInRubrica && nameToCheck) {
          setPendingClientData({
            name: callerName.trim(),
            company: company.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            city: city.trim(),
            zip_code: zipCode.trim(),
            province: province.trim(),
            phone2: '', fiscal_code: '', vat_number: '',
            category: company.trim() ? 'azienda' : 'privato',
            notes: '', is_favorite: false
          })
          setShowAddToRubrica(true)
          return // Don't show success yet, wait for rubrica decision
        }
      }

      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose() }, 2500)
    } catch (error) {
      console.error('Error saving call:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !onAddTeamMember) return
    try {
      await onAddTeamMember(newMemberName.trim(), newMemberRole.trim())
      setNewMemberName('')
      setNewMemberRole('')
      setShowAddMember(false)
    } catch (error) {
      console.error('Error adding team member:', error)
    }
  }

  const handleAddToRubrica = async () => {
    if (!pendingClientData || !onAddClient) return
    setAddingToRubrica(true)
    try {
      await onAddClient(pendingClientData)
    } catch (error) {
      console.error('Error adding client from call:', error)
    } finally {
      setAddingToRubrica(false)
      setShowAddToRubrica(false)
      setPendingClientData(null)
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose() }, 2500)
    }
  }

  const handleSkipRubrica = () => {
    setShowAddToRubrica(false)
    setPendingClientData(null)
    setShowSuccess(true)
    setTimeout(() => { setShowSuccess(false); onClose() }, 2500)
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
  const labelClass = "block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editCall ? 'Modifica Chiamata' : 'Nuova Chiamata'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {editCall
                      ? `Registrata il ${new Date(editCall.call_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      : `Oggi ${new Date().toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                    }
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* ── Dati Chiamante ── */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Dati Chiamante
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Nome *</label>
                      <input type="text" value={callerName} onChange={(e) => setCallerName(e.target.value)} required className={inputClass} placeholder="Mario Rossi" />
                    </div>
                    <div>
                      <label className={labelClass}>Azienda</label>
                      <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="Nome Azienda" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefono *</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} placeholder="+39 123 456 7890" />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="email@esempio.it" />
                    </div>
                  </div>
                </div>

                {/* ── Indirizzo Cliente ── */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Indirizzo Cliente
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Indirizzo</label>
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Via Roma 1" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className={labelClass}>CAP</label>
                        <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputClass} placeholder="00100" maxLength={5} />
                      </div>
                      <div className="col-span-1">
                        <label className={labelClass}>Città</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Roma" />
                      </div>
                      <div className="col-span-1">
                        <label className={labelClass}>Provincia</label>
                        <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass} placeholder="RM" maxLength={2} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Assegna A ── */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Assegna A
                  </h3>
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className={inputClass + ' appearance-none pr-10'}
                      >
                        <option value="">— Nessuno —</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}{m.role ? ` (${m.role})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {/* Add new member inline */}
                    {!showAddMember ? (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(true)}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        Aggiungi membro al team
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-200/40 space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            className={inputClass}
                            placeholder="Nome"
                          />
                          <input
                            type="text"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className={inputClass}
                            placeholder="Ruolo (opzionale)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddMember}
                            disabled={!newMemberName.trim()}
                            className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-all disabled:opacity-50"
                          >
                            Aggiungi
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddMember(false); setNewMemberName(''); setNewMemberRole('') }}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all"
                          >
                            Annulla
                          </button>
                        </div>
                        {/* Members list for deletion */}
                        {teamMembers.length > 0 && (
                          <div className="pt-2 border-t border-indigo-200/40 space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Membri esistenti:</span>
                            {teamMembers.map(m => (
                              <div key={m.id} className="flex items-center justify-between py-1">
                                <span className="text-xs text-slate-600">{m.name}{m.role ? ` — ${m.role}` : ''}</span>
                                {onDeleteTeamMember && (
                                  <button type="button" onClick={() => onDeleteTeamMember(m.id)} className="p-1 hover:bg-red-50 rounded transition-colors">
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* ── Tipo Chiamata ── */}
                <div>
                  <label className={labelClass}>Tipo Chiamata</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {callTypes.map((type) => (
                      <button key={type.value} type="button" onClick={() => setCallType(type.value)}
                        className={`px-3 py-2.5 rounded-xl border transition-all font-medium text-xs ${
                          callType === type.value
                            ? 'bg-indigo-50 border-indigo-200/60 text-indigo-600'
                            : 'border-slate-200/60 bg-white/50 text-slate-400 hover:bg-slate-50'
                        }`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Priorità ── */}
                <div>
                  <label className={labelClass}>Priorità</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {priorities.map((p) => (
                      <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                        className={`px-3 py-2.5 rounded-xl border transition-all font-medium text-xs ${
                          priority === p.value
                            ? 'bg-indigo-50 border-indigo-200/60 text-indigo-600'
                            : 'border-slate-200/60 bg-white/50 text-slate-400 hover:bg-slate-50'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Note ── */}
                <div>
                  <label className={labelClass}>
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                    Note / Richiesta *
                  </label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} required rows={3}
                    className={inputClass + ' resize-none'} placeholder="Descrivi la richiesta del cliente..." />
                </div>

                {/* ── Follow Up ── */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                    <span className="text-sm text-slate-700 font-medium">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" /> Richiede Follow-up
                    </span>
                  </label>
                  {followUp && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className={labelClass}>Data Follow-up</label>
                      <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputClass} />
                    </motion.div>
                  )}
                </div>

                {/* ── Lavorazione / Intervento ── */}
                <div className="space-y-2 pt-3 border-t border-slate-100/80">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={hasLavorazione} onChange={(e) => setHasLavorazione(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                    <span className="text-sm text-slate-700 font-medium">
                      <Wrench className="w-3.5 h-3.5 inline mr-1" /> Programma Lavorazione / Intervento
                    </span>
                  </label>
                  {hasLavorazione && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="bg-violet-50/50 rounded-xl p-4 border border-violet-200/40 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Data Intervento</label>
                          <input type="date" value={lavorazioneDate} onChange={(e) => setLavorazioneDate(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Orario</label>
                          <input type="time" value={lavorazioneTime} onChange={(e) => setLavorazioneTime(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Descrizione Intervento</label>
                        <input type="text" value={lavorazioneDesc} onChange={(e) => setLavorazioneDesc(e.target.value)} className={inputClass}
                          placeholder="Es. Andare dalla Sig.ra Taldeitali per riparazione" />
                      </div>
                      <div>
                        <label className={labelClass}>Assegnato A</label>
                        <div className="relative">
                          <select value={lavorazioneAssignee} onChange={(e) => setLavorazioneAssignee(e.target.value)}
                            className={inputClass + ' appearance-none pr-10'}>
                            <option value="">— Seleziona —</option>
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.name}>{m.name}{m.role ? ` (${m.role})` : ''}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ── Relazioni ── */}
                {editCall?.id && (
                  <div className="space-y-3 pt-4 border-t border-slate-100/80">
                    <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      🔗 Collegamenti
                    </h4>
                    <RelationsIntegration
                      entityType="call"
                      entityId={editCall.id}
                      entityTitle={callerName}
                      availableItems={availableItems || {}}
                      onAddRelation={(targetType, targetId, relationType, relNotes) => {
                        if (onAddRelation && editCall?.id) onAddRelation('call', editCall.id, targetType, targetId, relationType, relNotes)
                      }}
                      onRemoveRelation={onRemoveRelation || (async () => {})}
                      getRelatedItems={getRelatedItems || (async () => [])}
                      onNavigateToItem={onNavigateToItem}
                    />
                  </div>
                )}

                {/* ── Submit ── */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSaving ? '⏳ Salvataggio...' : editCall ? '✏️ Aggiorna Chiamata' : '💾 Salva Chiamata'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

        <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Chiamata Salvata!" message="La chiamata è stata registrata con successo." />

        {/* Add to Rubrica Prompt */}
        <AnimatePresence>
          {showAddToRubrica && pendingClientData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
              onClick={handleSkipRubrica}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-sm p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Aggiungere alla Rubrica?</h3>
                <p className="text-sm text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">{pendingClientData.name}</span>
                  {pendingClientData.company ? ` (${pendingClientData.company})` : ''}
                </p>
                <p className="text-xs text-slate-400 mb-6">
                  Questo contatto non è presente nella rubrica clienti. Vuoi aggiungerlo?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipRubrica}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all"
                  >
                    No, grazie
                  </button>
                  <button
                    onClick={handleAddToRubrica}
                    disabled={addingToRubrica}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {addingToRubrica ? 'Salvataggio...' : 'Sì, aggiungi'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  )
}
