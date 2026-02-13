'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wrench, User, Calendar, Clock, MapPin, FileText, AlertTriangle, Building2, StickyNote, Hash } from 'lucide-react'
import type { Lavorazione } from '../hooks/useLavorazioni'

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
}

export default function LavorazioneModal({
  isOpen,
  onClose,
  onSave,
  editLavorazione,
  teamMembers = []
}: LavorazioneModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priority, setPriority] = useState('media')
  const [status, setStatus] = useState<'da_fare' | 'in_corso' | 'completata' | 'annullata'>('da_fare')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [province, setProvince] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editLavorazione) {
      setTitle(editLavorazione.title || '')
      setDescription(editLavorazione.description || '')
      setAssignedTo(editLavorazione.assigned_to || '')
      setScheduledDate(editLavorazione.scheduled_date || '')
      setScheduledTime(editLavorazione.scheduled_time ? editLavorazione.scheduled_time.substring(0, 5) : '')
      setPriority(editLavorazione.priority || 'media')
      setStatus(editLavorazione.status || 'da_fare')
      setAddress(editLavorazione.address || '')
      setCity(editLavorazione.city || '')
      setZipCode(editLavorazione.zip_code || '')
      setProvince(editLavorazione.province || '')
      setNotes(editLavorazione.notes || '')
    } else {
      resetForm()
    }
  }, [editLavorazione, isOpen])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setAssignedTo('')
    setScheduledDate('')
    setScheduledTime('')
    setPriority('media')
    setStatus('da_fare')
    setAddress('')
    setCity('')
    setZipCode('')
    setProvince('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        title,
        description,
        assigned_to: assignedTo,
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
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
                  <User className="w-4 h-4 inline mr-2" />
                  Assegnatario
                </label>
                {teamMembers.length > 0 ? (
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  >
                    <option value="">Nessun assegnatario</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name} — {m.role}</option>
                    ))}
                  </select>
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
