'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wrench, User, Calendar, Clock, MapPin, FileText, AlertTriangle, Building2, StickyNote, Hash, Users, Copy, Search, Check } from 'lucide-react'
import type { Lavorazione } from '../hooks/useLavorazioni'
import type { Client } from '../hooks/useClients'

interface TeamMember {
  id: string
  name: string
  role: string
}

interface LavorazioneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<any>
  editLavorazione?: Lavorazione | null
  teamMembers?: TeamMember[]
  clients?: Client[]
}

export default function LavorazioneModal({
  isOpen,
  onClose,
  onSave,
  editLavorazione,
  teamMembers = [],
  clients = []
}: LavorazioneModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [selectedTecnici, setSelectedTecnici] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priority, setPriority] = useState('media')
  const [status, setStatus] = useState<'da_fare' | 'in_corso' | 'completata' | 'annullata'>('da_fare')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [province, setProvince] = useState('')
  const [notes, setNotes] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (editLavorazione) {
      setTitle(editLavorazione.title || '')
      setDescription(editLavorazione.description || '')
      const currentAssigned = editLavorazione.assigned_to || ''
      setAssignedTo(currentAssigned)
      // Parse comma-separated names into selectedTecnici
      if (teamMembers.length > 0 && currentAssigned) {
        const names = currentAssigned.split(',').map(n => n.trim()).filter(Boolean)
        setSelectedTecnici(names)
      } else {
        setSelectedTecnici([])
      }
      setScheduledDate(editLavorazione.scheduled_date || '')
      setScheduledTime(editLavorazione.scheduled_time ? editLavorazione.scheduled_time.substring(0, 5) : '')
      setPriority(editLavorazione.priority || 'media')
      setStatus(editLavorazione.status || 'da_fare')
      setAddress(editLavorazione.address || '')
      setCity(editLavorazione.city || '')
      setZipCode(editLavorazione.zip_code || '')
      setProvince(editLavorazione.province || '')
      setNotes(editLavorazione.notes || '')
      setClientId(editLavorazione.client_id || null)
    } else {
      resetForm()
    }
  }, [editLavorazione, isOpen])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setAssignedTo('')
    setSelectedTecnici([])
    setScheduledDate('')
    setScheduledTime('')
    setPriority('media')
    setStatus('da_fare')
    setAddress('')
    setCity('')
    setZipCode('')
    setProvince('')
    setNotes('')
    setClientId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        title,
        description,
        assigned_to: teamMembers.length > 0 ? selectedTecnici.join(', ') : assignedTo,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        priority,
        status,
        address,
        city,
        zip_code: zipCode,
        province,
        notes,
        call_id: editLavorazione?.call_id || null,
        client_id: clientId || null,
        completed_at: status === 'completata' ? new Date().toISOString() : null,
      }

      await onSave(data)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving lavorazione:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editLavorazione ? 'Modifica Lavorazione' : 'Nuova Lavorazione'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Gestisci interventi e lavorazioni</p>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Chiudi"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Titolo */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <Wrench className="w-4 h-4 inline mr-2" />
                Titolo Lavorazione *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="Es: Riparazione impianto, Installazione..."
                required
              />
            </div>

            {/* Cliente */}
            {clients.length > 0 && (
              <div ref={clientRef} className="relative">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Cliente (dalla Rubrica)
                </label>
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(o => !o)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 outline-none transition-all text-left flex items-center justify-between"
                >
                  <span className={clientId ? 'text-slate-800' : 'text-slate-400'}>
                    {clientId
                      ? (() => { const c = clients.find(x => x.id === clientId); return c ? `${c.name}${c.company ? ` (${c.company})` : ''}${c.city ? ` - ${c.city}` : ''}` : '-- Nessun cliente --' })()
                      : '-- Nessun cliente --'}
                  </span>
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
                {clientDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        autoFocus
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        placeholder="Cerca cliente..."
                        className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-52">
                      <button
                        type="button"
                        onClick={() => { setClientId(null); setClientDropdownOpen(false); setClientSearch('') }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-50"
                      >
                        -- Nessun cliente --
                      </button>
                      {clients
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter(c => {
                          const q = clientSearch.toLowerCase()
                          return !q || c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
                        })
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setClientId(c.id)
                              setClientDropdownOpen(false)
                              setClientSearch('')
                              if (!address && c.address) setAddress(c.address)
                              if (!city && c.city) setCity(c.city)
                              if (!zipCode && c.zip_code) setZipCode(c.zip_code)
                              if (!province && c.province) setProvince(c.province)
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 transition-colors ${clientId === c.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}
                          >
                            {c.name}{c.company ? <span className="text-slate-400 ml-1">({c.company})</span> : null}{c.city ? <span className="text-slate-400 ml-1">- {c.city}</span> : null}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Descrizione */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Descrizione
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                placeholder="Dettagli sulla lavorazione..."
                rows={3}
              />
            </div>

            {/* Assegnatario e Priorità */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Tecnici Assegnati
                </label>
                {teamMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl min-h-[44px]">
                    {teamMembers.map(m => {
                      const sel = selectedTecnici.includes(m.name)
                      return (
                        <button key={m.id} type="button"
                          onClick={() => setSelectedTecnici(prev => sel ? prev.filter(n => n !== m.name) : [...prev, m.name])}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            sel ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}>
                          {sel && <Check className="w-3 h-3" />}
                          {m.name}
                          {m.role && <span className={`text-[10px] ${sel ? 'text-indigo-200' : 'text-slate-400'}`}>· {m.role}</span>}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="Nome operatore"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Priorità
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="urgente">🔴 Urgente</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="bassa">🟢 Bassa</option>
                </select>
              </div>
            </div>

            {/* Data e Ora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data Programmata
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Ora Programmata
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
            </div>

            {/* Stato (solo in modifica) */}
            {editLavorazione && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  📊 Stato
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="da_fare">📋 Da Fare</option>
                  <option value="in_corso">🔄 In Corso</option>
                  <option value="completata">✅ Completata</option>
                  <option value="annullata">❌ Annullata</option>
                </select>
              </div>
            )}

            {/* Sezione Indirizzo */}
            <div className="border-t border-slate-200/60 pt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Indirizzo Lavorazione
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="Via/Piazza..."
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="Città"
                  />
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="CAP"
                  />
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="Provincia"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <StickyNote className="w-4 h-4 inline mr-2" />
                Note Aggiuntive
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                placeholder="Note aggiuntive..."
                rows={2}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {saving ? 'Salvataggio...' : editLavorazione ? '💾 Aggiorna Lavorazione' : '✅ Crea Lavorazione'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
