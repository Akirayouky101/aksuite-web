'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, User, Mail, MessageSquare, Clock, MapPin, UserPlus, Users } from 'lucide-react'
import SuccessModal from './SuccessModal'

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
}

interface ClientLite { id: string; name: string; company: string; phone: string; email: string; address: string; city: string; zip_code: string; province: string }

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (call: any) => Promise<void>
  editCall?: Call | null
  clients?: ClientLite[]
  onAddClient?: (data: any) => Promise<any>
  [key: string]: any
}

const emptyForm = { callerName: '', phone: '', email: '', address: '', notes: '' }

export default function CallModal({ isOpen, onClose, onSave, editCall, clients = [], onAddClient }: CallModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [matchedClient, setMatchedClient] = useState<ClientLite | null>(null)
  const [pendingClient, setPendingClient] = useState<any>(null)
  const [addingToRubrica, setAddingToRubrica] = useState(false)

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const joinAddress = (c: { address?: string; zip_code?: string; city?: string; province?: string }) => [c.address, [c.zip_code, c.city].filter(Boolean).join(' '), c.province ? `(${c.province})` : ''].filter(Boolean).join(', ')

  useEffect(() => {
    if (editCall) setForm({ callerName: editCall.caller_name, phone: editCall.phone, email: editCall.email || '', address: joinAddress(editCall), notes: editCall.notes || '' })
    else setForm(emptyForm)
    setMatchedClient(null)
  }, [editCall, isOpen])

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
      await onSave({
        caller_name: form.callerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        company: editCall?.company || '',
        city: '', zip_code: '', province: '',
        call_type: 'altro', priority: 'media', call_direction: 'inbound',
        follow_up: false, follow_up_date: null,
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

  const inputClass = 'w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm'
  const labelClass = 'block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative max-w-lg w-full">
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"><Phone className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editCall ? 'Modifica Chiamata' : 'Nuova Chiamata'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(editCall?.call_date || Date.now()).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className={labelClass}><User className="w-3.5 h-3.5 inline mr-1" />Nome e Cognome *</label>
                  <input type="text" value={form.callerName} onChange={(e) => { set('callerName')(e); setMatchedClient(null) }} required className={inputClass} placeholder="Mario Rossi" />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200/60 shadow-xl z-30 py-1 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dalla rubrica</div>
                      {suggestions.map((c) => (
                        <button key={c.id} type="button" onClick={() => fillFromClient(c)} className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-indigo-50 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0"><Users className="w-3 h-3 text-white" /></div>
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-700 truncate">{c.name}</p><p className="text-[10px] text-slate-400 truncate">{c.phone}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedClient && (
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200/60 rounded-lg">
                      <span className="text-[10px] text-emerald-600 font-medium">Collegato: {matchedClient.name}</span>
                      <button type="button" onClick={() => setMatchedClient(null)} className="ml-auto text-slate-400 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
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

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={isSaving} className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isSaving ? 'Salvataggio...' : editCall ? 'Aggiorna chiamata' : 'Salva chiamata'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

        <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Chiamata salvata" message="La chiamata è stata registrata." />

        <AnimatePresence>
          {pendingClient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setPendingClient(null); finish() }}>
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-sm p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25"><Users className="w-7 h-7 text-white" /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Aggiungere alla Rubrica?</h3>
                <p className="text-sm text-slate-500 mb-1"><span className="font-semibold text-slate-700">{pendingClient.name}</span></p>
                <p className="text-xs text-slate-400 mb-6">Questo contatto non è presente in rubrica.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setPendingClient(null); finish() }} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">No, grazie</button>
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
