'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, Building2, Phone, Mail, Calendar, FileText, AlertTriangle, Clock } from 'lucide-react'
import RelationsIntegration from './RelationsIntegration'
import type { Visit } from '../hooks/useVisits'

interface VisitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (visitData: any) => Promise<any>
  editVisit?: Visit | null
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
      status
    }

    await onSave(visitData)
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border-2 border-purple-500/30 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editVisit ? '✏️ Modifica Visita' : '➕ Nuova Visita'}
                </h2>
                <p className="text-sm text-slate-400">Registra visitatori in ufficio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Visitor Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <UserCheck className="w-4 h-4 inline mr-2" />
                Nome Visitatore *
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
                placeholder="Mario Rossi"
                required
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Azienda
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
                  placeholder="mario.rossi@example.com"
                />
              </div>
            </div>

            {/* Type and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  📋 Tipo Visita *
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
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
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Priorità
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data e Ora Visita *
              </label>
              <input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Status (only when editing) */}
            {editVisit && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  📊 Stato
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Motivo della visita, argomenti da discutere..."
              />
            </div>

            {/* Follow-up */}
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
              <input
                type="checkbox"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-orange-500 focus:ring-orange-500"
                id="followUp"
              />
              <label htmlFor="followUp" className="text-sm font-semibold text-orange-300 cursor-pointer flex-1">
                <Clock className="w-4 h-4 inline mr-2" />
                Richiede Follow-up
              </label>
              {followUp && (
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-orange-500/50 focus:border-orange-500 focus:outline-none text-sm"
                />
              )}
            </div>

            {/* Relations Integration */}
            {editVisit && editVisit.id && onAddRelation && onRemoveRelation && getRelatedItems && (
              <RelationsIntegration
                sourceType="visit"
                sourceId={editVisit.id}
                availableItems={availableRelationItems}
                onAddRelation={onAddRelation}
                onRemoveRelation={onRemoveRelation}
                getRelatedItems={getRelatedItems}
              />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              {editVisit ? '✏️ Aggiorna Visita' : '💾 Salva Visita'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
