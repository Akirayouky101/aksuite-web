'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Ticket, AlignLeft, Calendar, Flag, Users, UserCheck, ChevronDown, Plus } from 'lucide-react'
import { Ticket as TicketType } from '../hooks/useTickets'

interface UserProfile {
  id: string
  full_name: string
  email?: string
}

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description?: string
    priority: TicketType['priority']
    due_date?: string | null
    assignees: { user_id: string; user_name: string }[]
  }) => Promise<void>
  editTicket?: TicketType | null
  teamProfiles: UserProfile[]
  currentUserName?: string
}

const PRIORITIES: { value: TicketType['priority']; label: string }[] = [
  { value: 'bassa', label: '🟢 Bassa' },
  { value: 'normale', label: '🔵 Normale' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'urgente', label: '🔴 Urgente' },
]

const inputClass = "w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all text-sm"
const labelClass = "block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"

export default function TicketModal({ isOpen, onClose, onSave, editTicket, teamProfiles, currentUserName }: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketType['priority']>('normale')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<{ user_id: string; user_name: string }[]>([])
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editTicket) {
      setTitle(editTicket.title)
      setDescription(editTicket.description || '')
      setPriority(editTicket.priority)
      setDueDate(editTicket.due_date || '')
      setSelectedAssignees(editTicket.assignees.map(a => ({ user_id: a.user_id, user_name: a.user_name })))
    } else {
      setTitle(''); setDescription(''); setPriority('normale'); setDueDate(''); setSelectedAssignees([])
    }
    setError('')
  }, [editTicket, isOpen])

  const toggleAssignee = (profile: UserProfile) => {
    const existing = selectedAssignees.find(a => a.user_id === profile.id)
    if (existing) {
      setSelectedAssignees(prev => prev.filter(a => a.user_id !== profile.id))
    } else {
      setSelectedAssignees(prev => [...prev, { user_id: profile.id, user_name: profile.full_name || profile.email || '' }])
    }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Il titolo è obbligatorio'); return }
    if (selectedAssignees.length === 0) { setError('Assegna il ticket ad almeno una persona'); return }
    setSaving(true)
    try {
      await onSave({ title: title.trim(), description: description.trim() || undefined, priority, due_date: dueDate || null, assignees: selectedAssignees })
      onClose()
    } catch {
      setError('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

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
              {/* Titolo */}
              <div>
                <label className={labelClass}>Titolo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Es. Installazione impianto via Roma 12..."
                  className={inputClass}
                  autoFocus
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className={labelClass}>Descrizione</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Dettagli del lavoro, istruzioni, note..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Priorità + Scadenza */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Priorità</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as TicketType['priority'])}
                      className={`${inputClass} appearance-none pr-8`}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Scadenza</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Assegnatari */}
              <div>
                <label className={labelClass}>
                  Assegna a *{selectedAssignees.length > 0 && <span className="text-violet-500 ml-1 normal-case">({selectedAssignees.length} selezionati)</span>}
                </label>

                {/* Chip selezionati */}
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAssignees.map(a => (
                      <span key={a.user_id} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs rounded-lg px-2.5 py-1.5">
                        <UserCheck size={12} />
                        {a.user_name}
                        <button onClick={() => setSelectedAssignees(prev => prev.filter(x => x.user_id !== a.user_id))} className="text-violet-400 hover:text-violet-700 ml-0.5">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown team */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-3 text-left text-slate-400 hover:border-violet-300 transition-colors flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Plus size={14} /> Aggiungi persone...
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAssigneeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200/60 rounded-xl shadow-xl max-h-44 overflow-y-auto"
                      >
                        {teamProfiles.length === 0 && (
                          <div className="px-4 py-3 text-slate-400 text-sm">Nessun membro disponibile</div>
                        )}
                        {teamProfiles.map(profile => {
                          const isSelected = selectedAssignees.some(a => a.user_id === profile.id)
                          return (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() => toggleAssignee(profile)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-sm ${isSelected ? 'text-violet-600' : 'text-slate-700'}`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                                {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                              </div>
                              <span className="flex-1">{profile.full_name || profile.email}</span>
                              {isSelected && <UserCheck size={14} className="text-violet-500" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Errore */}
              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}

              {/* Pulsanti */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-3 font-medium transition-colors text-sm"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-violet-200 text-sm"
                >
                  {saving ? 'Salvataggio...' : editTicket ? 'Aggiorna' : 'Crea Ticket'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
