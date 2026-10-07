'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Phone, User, Mail, MessageSquare, Clock, MapPin, UserPlus, Users } from 'lucide-react'
import SuccessModal from './SuccessModal'
import DateTimePicker from './DateTimePicker'

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
  notes: string
  status: 'pending' | 'in_corso' | 'completed' | 'cancelled'
  call_date: string
  follow_up: boolean
  follow_up_date: string | null
  follow_up_time?: string | null
}

interface ClientLite { id: string; name: string; company: string; phone: string; email: string; address: string; city: string; zip_code: string; province: string }

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (call: any) => Promise<void>
  editCall?: Call | null
  clients?: ClientLite[]
  initialClient?: ClientLite | null
  defaultFollowUpDate?: string | null
  initialFollowUpNote?: string
  onAddClient?: (data: any) => Promise<any>
  [key: string]: any
}

const emptyForm = { callerName: '', phone: '', email: '', address: '', notes: '', followUp: false, followUpDate: '' }

export default function CallModal({ isOpen, onClose, onSave, editCall, clients = [], initialClient = null, defaultFollowUpDate = null, initialFollowUpNote = '', onAddClient }: CallModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [matchedClient, setMatchedClient] = useState<ClientLite | null>(null)
  const [pendingClient, setPendingClient] = useState<any>(null)
  const [addingToRubrica, setAddingToRubrica] = useState(false)

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const joinAddress = (c: { address?: string; zip_code?: string; city?: string; province?: string }) => [c.address, [c.zip_code, c.city].filter(Boolean).join(' '), c.province ? `(${c.province})` : ''].filter(Boolean).join(', ')

  useEffect(() => {
    if (editCall) {
      const followUpTime = editCall.follow_up_time?.slice(0, 5) || '09:00'
      setForm({ callerName: editCall.caller_name, phone: editCall.phone, email: editCall.email || '', address: joinAddress(editCall), notes: editCall.notes || '', followUp: editCall.follow_up, followUpDate: editCall.follow_up_date ? `${editCall.follow_up_date}T${followUpTime}` : '' })
      setMatchedClient(null)
    } else if (initialClient) {
      setForm({ callerName: initialClient.name, phone: initialClient.phone || '', email: initialClient.email || '', address: joinAddress(initialClient), notes: initialFollowUpNote, followUp: true, followUpDate: defaultFollowUpDate || '' })
      setMatchedClient(initialClient)
    } else {
      setForm(emptyForm)
      setMatchedClient(null)
    }
  }, [editCall, isOpen, initialClient, defaultFollowUpDate, initialFollowUpNote])

  const nameL = form.callerName.trim().toLowerCase()
  const phoneClean = form.phone.replace(/\s/g, '')
  const suggestions = (!editCall && !matchedClient) ? clients.filter((c) => (nameL.length >= 2 && c.name.toLowerCase().includes(nameL)) || (phoneClean.length >= 3 && (c.phone || '').replace(/\s/g, '').includes(phoneClean))).slice(0, 5) : []

  const fillFromClient = (c: ClientLite) => {
    setForm((f) => ({ ...f, callerName: c.name || f.callerName, phone: c.phone || f.phone, email: c.email || '', address: joinAddress(c) }))
    setMatchedClient(c)
  }

  const finish = () => { setShowSuccess(true); setTimeout(() => { setShowSuccess(false); onClose() }, 2000) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const [followUpDate, followUpTime] = form.followUpDate.split('T')
      await onSave({
        caller_name: form.callerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        company: editCall?.company || '',
        city: '', zip_code: '', province: '',
        call_type: 'altro', priority: 'media', call_direction: 'inbound',
        follow_up: form.followUp, follow_up_date: form.followUp ? followUpDate || null : null, follow_up_time: form.followUp ? followUpTime || '09:00' : null,
        status: editCall?.status || 'pending',
        call_date: editCall?.call_date || new Date().toISOString(),
      })
      const inRubrica = clients.some((c) => c.name.toLowerCase() === nameL || (phoneClean && (c.phone || '').replace(/\s/g, '') === phoneClean))
      if (!editCall && onAddClient && nameL && !inRubrica) {
        setPendingClient({ name: form.callerName.trim(), company: '', phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), city: '', zip_code: '', province: '', phone2: '', fiscal_code: '', vat_number: '', category: 'privato', notes: '', is_favorite: false })
        return
      }
      finish()
    } catch (error) {
      console.error('Error saving call:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddToRubrica = async () => {
    if (!pendingClient || !onAddClient) return
    setAddingToRubrica(true)
    try { await onAddClient(pendingClient) } catch (error) { console.error('Error adding client from call:', error) } finally { setAddingToRubrica(false); setPendingClient(null); finish() }
  }

  const inputClass = 'w-full px-4 py-3 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text placeholder-ak-subtle focus:border-ak-line focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm'
  const labelClass = 'block text-xs font-medium text-ak-subtle uppercase tracking-wider mb-1.5'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative max-w-lg w-full">
          <div className="bg-ak-panel/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-ak-line/60 shadow-2xl shadow-black/50 flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-ak-line/60 bg-ak-panel/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ak-accent to-ak-accent flex items-center justify-center shadow-lg shadow-indigo-500/25"><Phone className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-bold text-ak-text">{editCall ? 'Modifica Chiamata' : 'Nuova Chiamata'}</h2>
                  <p className="text-xs text-ak-subtle mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(editCall?.call_date || Date.now()).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-ak-inset hover:bg-ak-danger-bg border border-ak-line/60 hover:border-ak-danger flex items-center justify-center transition-all"><X className="w-4 h-4 text-ak-subtle hover:text-ak-danger" /></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className={labelClass}><User className="w-3.5 h-3.5 inline mr-1" />Nome e Cognome *</label>
                  <input type="text" value={form.callerName} onChange={(e) => { set('callerName')(e); setMatchedClient(null) }} required className={inputClass} placeholder="Mario Rossi" />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-ak-panel rounded-xl border border-ak-line/60 shadow-xl z-30 py-1 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] text-ak-subtle font-semibold uppercase tracking-wider">Dalla rubrica</div>
                      {suggestions.map((c) => (
                        <button key={c.id} type="button" onClick={() => fillFromClient(c)} className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-ak-hover transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0"><Users className="w-3 h-3 text-white" /></div>
                          <div className="min-w-0"><p className="text-xs font-medium text-ak-text truncate">{c.name}</p><p className="text-[10px] text-ak-subtle truncate">{c.phone}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedClient && (
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-ak-success-bg border border-ak-success/60 rounded-lg">
                      <span className="text-[10px] text-ak-success font-medium">Collegato: {matchedClient.name}</span>
                      <button type="button" onClick={() => setMatchedClient(null)} className="ml-auto text-ak-subtle hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}><MessageSquare className="w-3.5 h-3.5 inline mr-1" />Motivo della chiamata *</label>
                  <textarea value={form.notes} onChange={set('notes')} required rows={3} className={inputClass + ' resize-none'} placeholder="Descrivi la richiesta..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}><Phone className="w-3.5 h-3.5 inline mr-1" />Telefono *</label>
                    <input type="tel" value={form.phone} onChange={(e) => { set('phone')(e); setMatchedClient(null) }} required className={inputClass} placeholder="+39 123 456 7890" />
                  </div>
                  <div>
                    <label className={labelClass}><Mail className="w-3.5 h-3.5 inline mr-1" />Email</label>
                    <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="email@esempio.it" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}><MapPin className="w-3.5 h-3.5 inline mr-1" />Indirizzo</label>
                  <input type="text" value={form.address} onChange={set('address')} className={inputClass} placeholder="Via Roma 1, 00100 Roma (RM)" />
                </div>

                <div>
                  <label className={labelClass}><Bell className="w-3.5 h-3.5 inline mr-1" />Promemoria ricontatto</label>
                  <button type="button" onClick={() => setForm(current => ({ ...current, followUp: !current.followUp }))} className={`mb-2 rounded-lg px-3 py-2 text-sm font-semibold ${form.followUp ? 'bg-ak-hover text-ak-cyan' : 'bg-ak-inset text-ak-muted'}`}>{form.followUp ? 'Campanella attiva' : 'Attiva campanella'}</button>
                  {form.followUp && <DateTimePicker value={form.followUpDate} onChange={value => setForm(current => ({ ...current, followUpDate: value }))} placeholder="Seleziona data e ora" />}
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={isSaving} className="w-full py-3.5 bg-gradient-to-r from-ak-accent to-ak-accent hover:from-ak-accent hover:to-ak-accent-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isSaving ? 'Salvataggio...' : editCall ? 'Aggiorna chiamata' : 'Salva chiamata'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

        <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Chiamata salvata" message="La chiamata è stata registrata." />

        <AnimatePresence>
          {pendingClient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ak-modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setPendingClient(null); finish() }}>
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-ak-panel/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-ak-line/60 w-full max-w-sm p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25"><Users className="w-7 h-7 text-white" /></div>
                <h3 className="text-lg font-bold text-ak-text mb-2">Aggiungere alla Rubrica?</h3>
                <p className="text-sm text-ak-muted mb-1"><span className="font-semibold text-ak-text">{pendingClient.name}</span></p>
                <p className="text-xs text-ak-subtle mb-6">Questo contatto non è presente in rubrica.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setPendingClient(null); finish() }} className="flex-1 py-2.5 rounded-xl bg-ak-inset hover:bg-ak-inset text-ak-text text-sm font-medium transition-all">No, grazie</button>
                  <button onClick={handleAddToRubrica} disabled={addingToRubrica} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" />{addingToRubrica ? 'Salvataggio...' : 'Sì, aggiungi'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  )
}
