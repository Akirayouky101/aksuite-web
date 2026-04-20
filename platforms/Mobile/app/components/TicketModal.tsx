'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Ticket, AlignLeft, Calendar, Flag, Users, UserCheck, ChevronDown, Trash2, Plus } from 'lucide-react'
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

const PRIORITIES: { value: TicketType['priority']; label: string; color: string }[] = [
  { value: 'bassa', label: '🟢 Bassa', color: 'green' },
  { value: 'normale', label: '🔵 Normale', color: 'blue' },
  { value: 'alta', label: '🟠 Alta', color: 'orange' },
  { value: 'urgente', label: '🔴 Urgente', color: 'red' },
]

export default function TicketModal({ isOpen, onClose, onSave, editTicket, teamProfiles, currentUserName }: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketType['priority']>('normale')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<{ user_id: string; user_name: string }[]>([])
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Popolamento in modifica
  useEffect(() => {
    if (editTicket) {
      setTitle(editTicket.title)
      setDescription(editTicket.description || '')
      setPriority(editTicket.priority)
      setDueDate(editTicket.due_date || '')
      setSelectedAssignees(editTicket.assignees.map(a => ({ user_id: a.user_id, user_name: a.user_name })))
    } else {
      setTitle('')
      setDescription('')
      setPriority('normale')
      setDueDate('')
      setSelectedAssignees([])
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
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || null,
        assignees: selectedAssignees,
      })
      onClose()
    } catch (e) {
      setError('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const priorityInfo = PRIORITIES.find(p => p.value === priority)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                  <Ticket size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{editTicket ? 'Modifica Ticket' : 'Nuovo Ticket'}</h2>
                  <p className="text-gray-400 text-sm">Commessa interna</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Titolo */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                  <Ticket size={14} /> Titolo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Es. Installazione impianto via Roma 12..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                  <AlignLeft size={14} /> Descrizione
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Dettagli del lavoro, istruzioni, note..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              {/* Priorità + Scadenza */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                    <Flag size={14} /> Priorità
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as TicketType['priority'])}
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none pr-8"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                    <Calendar size={14} /> Scadenza
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              {/* Assegnatari */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                  <Users size={14} /> Assegna a * {selectedAssignees.length > 0 && <span className="text-violet-400 text-xs">({selectedAssignees.length} selezionati)</span>}
                </label>

                {/* Chip selezionati */}
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAssignees.map(a => (
                      <span key={a.user_id} className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs rounded-lg px-2.5 py-1.5">
                        <UserCheck size={12} />
                        {a.user_name}
                        <button onClick={() => setSelectedAssignees(prev => prev.filter(x => x.user_id !== a.user_id))} className="text-violet-400 hover:text-white ml-0.5">
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
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-left text-gray-400 hover:border-violet-500 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 text-sm">
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
                        className="absolute z-10 top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-xl max-h-44 overflow-y-auto"
                      >
                        {teamProfiles.length === 0 && (
                          <div className="px-4 py-3 text-gray-500 text-sm">Nessun membro disponibile</div>
                        )}
                        {teamProfiles.map(profile => {
                          const isSelected = selectedAssignees.some(a => a.user_id === profile.id)
                          return (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() => toggleAssignee(profile)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-700 transition-colors text-sm ${isSelected ? 'text-violet-300' : 'text-white'}`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                              </div>
                              <span className="flex-1">{profile.full_name || profile.email}</span>
                              {isSelected && <UserCheck size={14} className="text-violet-400" />}
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
                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Pulsanti */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl py-3 font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
                >
                  {saving ? 'Salvataggio...' : editTicket ? 'Aggiorna' : 'Crea Ticket'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
