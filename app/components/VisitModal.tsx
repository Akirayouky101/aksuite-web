'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, Building2, Phone, Mail, Calendar, FileText, AlertTriangle, Clock, Wrench, ChevronDown } from 'lucide-react'
// import RelationsIntegration from './RelationsIntegration' // TODO: Fix prop types
import type { Visit } from '../hooks/useVisits'

interface VisitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (visitData: any) => Promise<any>
  editVisit?: Visit | null
  teamMembers?: Array<{ id: string; name: string; role: string }>
  availableRelationItems?: Array<{
    type: string
    id: string
    title: string
    subtitle?: string
  }>
  onAddRelation?: (targetType: string, targetId: string, relationType: string, notes?: string) => Promise<void>
  onRemoveRelation?: (targetType: string, targetId: string) => Promise<void>
  getRelatedItems?: (sourceType: string, sourceId: string) => Promise<any[]>
}

export default function VisitModal({
  isOpen,
  onClose,
  onSave,
  editVisit,
  teamMembers = [],
  availableRelationItems = [],
  onAddRelation,
  onRemoveRelation,
  getRelatedItems
}: VisitModalProps) {
  const [visitorName, setVisitorName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [visitType, setVisitType] = useState('riunione')
  const [priority, setPriority] = useState('media')
  const [visitDate, setVisitDate] = useState('')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled')
  const [hasLavorazione, setHasLavorazione] = useState(false)
  const [lavorazioneDate, setLavorazioneDate] = useState('')
  const [lavorazioneTime, setLavorazioneTime] = useState('')
  const [lavorazioneDesc, setLavorazioneDesc] = useState('')
  const [lavorazioneAssignee, setLavorazioneAssignee] = useState('')

  useEffect(() => {
    if (editVisit) {
      setVisitorName(editVisit.visitor_name)
      setCompany(editVisit.company || '')
      setPhone(editVisit.phone || '')
      setEmail(editVisit.email || '')
      setVisitType(editVisit.visit_type)
      setPriority(editVisit.priority)
      setVisitDate(editVisit.visit_date.slice(0, 16))
      setNotes(editVisit.notes || '')
      setFollowUp(editVisit.follow_up)
      setFollowUpDate(editVisit.follow_up_date ? editVisit.follow_up_date.slice(0, 16) : '')
      setStatus(editVisit.status)
    } else {
      resetForm()
    }
  }, [editVisit, isOpen])

  const resetForm = () => {
    setVisitorName('')
    setCompany('')
    setPhone('')
    setEmail('')
    setVisitType('riunione')
    setPriority('media')
    setVisitDate('')
    setNotes('')
    setFollowUp(false)
    setFollowUpDate('')
    setStatus('scheduled')
    setHasLavorazione(false)
    setLavorazioneDate('')
    setLavorazioneTime('')
    setLavorazioneDesc('')
    setLavorazioneAssignee('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const visitData = {
      visitor_name: visitorName,
      company,
      phone,
      email,
      visit_type: visitType,
      priority,
      visit_date: new Date(visitDate).toISOString(),
      notes,
      follow_up: followUp,
      follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
      status,
      // Lavorazione
      has_lavorazione: hasLavorazione,
      lavorazione_date: hasLavorazione ? lavorazioneDate || null : null,
      lavorazione_time: hasLavorazione ? lavorazioneTime || null : null,
      lavorazione_description: hasLavorazione ? lavorazioneDesc : '',
      lavorazione_assignee: hasLavorazione ? lavorazioneAssignee : ''
    }

    await onSave(visitData)
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/50"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editVisit ? 'Modifica Visita' : 'Nuova Visita'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Registra visitatori in ufficio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Visitor Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <UserCheck className="w-4 h-4 inline mr-2" />
                Nome Visitatore *
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                placeholder="Mario Rossi"
                required
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Azienda
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                  placeholder="mario.rossi@example.com"
                />
              </div>
            </div>

            {/* Type and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  📋 Tipo Visita *
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                  required
                >
                  <option value="riunione">🤝 Riunione</option>
                  <option value="colloquio">💼 Colloquio</option>
                  <option value="consegna">📦 Consegna</option>
                  <option value="assistenza">🛠️ Assistenza</option>
                  <option value="altro">📋 Altro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Priorità
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="urgente">🔴 Urgente</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="bassa">🟢 Bassa</option>
                </select>
              </div>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data e Ora Visita *
              </label>
              <input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                required
              />
            </div>

            {/* Status (only when editing) */}
            {editVisit && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  📊 Stato
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="scheduled">📅 Programmata</option>
                  <option value="in_progress">⏳ In Corso</option>
                  <option value="completed">✅ Completata</option>
                  <option value="cancelled">❌ Annullata</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none resize-none"
                rows={3}
                placeholder="Motivo della visita, argomenti da discutere..."
              />
            </div>

            {/* Follow-up */}
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200/60">
              <input
                type="checkbox"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-50 border-slate-200 text-orange-500 focus:ring-orange-500"
                id="followUp"
              />
              <label htmlFor="followUp" className="text-sm font-semibold text-orange-600 cursor-pointer flex-1">
                <Clock className="w-4 h-4 inline mr-2" />
                Richiede Follow-up
              </label>
              {followUp && (
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-orange-200/60 focus:border-orange-500 focus:outline-none text-sm"
                  title="Data follow-up"
                />
              )}
            </div>

            {/* Lavorazione / Intervento */}
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
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Data Intervento</label>
                      <input type="date" value={lavorazioneDate} onChange={(e) => setLavorazioneDate(e.target.value)}
                        title="Data intervento"
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Orario</label>
                      <input type="time" value={lavorazioneTime} onChange={(e) => setLavorazioneTime(e.target.value)}
                        title="Orario intervento"
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Descrizione Intervento</label>
                    <input type="text" value={lavorazioneDesc} onChange={(e) => setLavorazioneDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="Es. Intervento tecnico presso il cliente" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Assegnato A</label>
                    <div className="relative">
                      <select value={lavorazioneAssignee} onChange={(e) => setLavorazioneAssignee(e.target.value)}
                        title="Assegnatario lavorazione"
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all appearance-none pr-10">
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

            {/* Relations Integration - TODO: Fix prop types */}
            {/* {editVisit && editVisit.id && onAddRelation && onRemoveRelation && getRelatedItems && (
              <RelationsIntegration
                sourceType="visit"
                sourceId={editVisit.id}
                availableItems={availableRelationItems}
                onAddRelation={onAddRelation}
                onRemoveRelation={onRemoveRelation}
                getRelatedItems={getRelatedItems}
              />
            )} */}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
            >
              {editVisit ? '✏️ Aggiorna Visita' : '💾 Salva Visita'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
