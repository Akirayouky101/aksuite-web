'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, User, Building2, Mail, MessageSquare, Calendar, Clock } from 'lucide-react'
import SuccessModal from './SuccessModal'
import RelationsIntegration from './RelationsIntegration'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'

interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  call_date: string
}

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (call: any) => Promise<void>
  editCall?: Call | null
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
  const [callType, setCallType] = useState('informazioni')
  const [priority, setPriority] = useState('media')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load edit data
  useEffect(() => {
    if (editCall) {
      setCallerName(editCall.caller_name)
      setCompany(editCall.company)
      setPhone(editCall.phone)
      setEmail(editCall.email)
      setCallType(editCall.call_type)
      setPriority(editCall.priority)
      setNotes(editCall.notes)
      setFollowUp(editCall.follow_up)
      setFollowUpDate(editCall.follow_up_date || '')
    } else {
      // Reset form for new call
      setCallerName('')
      setCompany('')
      setPhone('')
      setEmail('')
      setCallType('informazioni')
      setPriority('media')
      setNotes('')
      setFollowUp(false)
      setFollowUpDate('')
    }
  }, [editCall, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      await onSave({
        caller_name: callerName,
        company,
        phone,
        email,
        call_type: callType,
        priority,
        notes,
        follow_up: followUp,
        follow_up_date: followUpDate || null,
        status: 'pending',
        call_date: new Date().toISOString()
      })
      
      // Reset form
      setCallerName('')
      setCompany('')
      setPhone('')
      setEmail('')
      setCallType('informazioni')
      setPriority('media')
      setNotes('')
      setFollowUp(false)
      setFollowUpDate('')
      
      // Show success modal instead of closing immediately
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2500)
    } catch (error) {
      console.error('Error saving call:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  flex items-center justify-center p-4 z-50 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full overflow-x-hidden"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-violet-500 rounded-3xl hidden" />
          
          {/* Main modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Nuova Chiamata</h2>
                  <p className="text-sm text-slate-400">Registra chiamata cliente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200/60 flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-88px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Caller Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nome Chiamante *
                    </label>
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="Mario Rossi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Azienda
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="Nome Azienda"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Telefono *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="+39 123 456 7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="email@esempio.it"
                    />
                  </div>
                </div>

                {/* Call Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Tipo Chiamata</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {callTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setCallType(type.value)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                          callType === type.value
                            ? `border-${type.color}-400 bg-${type.color}-50 text-${type.color}-700`
                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Priorità</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                          priority === p.value
                            ? `border-${p.color}-400 bg-${p.color}-50 text-${p.color}-700`
                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Note / Richiesta *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    placeholder="Descrivi la richiesta del cliente..."
                  />
                </div>

                {/* Follow Up */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followUp}
                      onChange={(e) => setFollowUp(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-200 bg-slate-50 text-blue-500 focus:ring-2 focus:ring-indigo-100"
                      aria-label="Richiede Follow-up"
                    />
                    <span className="text-slate-800 font-semibold">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Richiede Follow-up
                    </span>
                  </label>

                  {followUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Data Follow-up
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Collegamenti Multi-Entità */}
                {editCall?.id && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      🔗 Collegamenti
                    </h4>
                    <RelationsIntegration
                      entityType="call"
                      entityId={editCall.id}
                      entityTitle={callerName}
                      availableItems={availableItems || {}}
                      onAddRelation={(targetType, targetId, relationType, notes) => {
                        if (onAddRelation && editCall?.id) {
                          onAddRelation('call', editCall.id, targetType, targetId, relationType, notes)
                        }
                      }}
                      onRemoveRelation={onRemoveRelation || (async () => {})}
                      getRelatedItems={getRelatedItems || (async () => [])}
                      onNavigateToItem={onNavigateToItem}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '⏳ Salvataggio...' : editCall ? '✏️ Aggiorna Chiamata' : '💾 Salva Chiamata'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Chiamata Salvata!"
          message="La chiamata è stata registrata con successo nel sistema."
        />
      </div>
    </AnimatePresence>
  )
}
