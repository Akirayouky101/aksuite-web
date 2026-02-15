'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, User, Building2, Phone, Mail, MapPin, FileText, Star, Save } from 'lucide-react'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  editingClient?: any
}

const categories = [
  { value: 'privato', label: 'Privato', emoji: '👤' },
  { value: 'azienda', label: 'Azienda', emoji: '🏢' },
  { value: 'condominio', label: 'Condominio', emoji: '🏘️' },
  { value: 'ente_pubblico', label: 'Ente Pubblico', emoji: '🏛️' },
  { value: 'altro', label: 'Altro', emoji: '📋' },
]

export default function ClientModal({ isOpen, onClose, onSave, editingClient }: ClientModalProps) {
  const [form, setForm] = useState({
    name: '', company: '', phone: '', phone2: '', email: '',
    address: '', city: '', zip_code: '', province: '',
    fiscal_code: '', vat_number: '', category: 'privato', notes: '', is_favorite: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingClient) {
      setForm({
        name: editingClient.name || '', company: editingClient.company || '',
        phone: editingClient.phone || '', phone2: editingClient.phone2 || '',
        email: editingClient.email || '', address: editingClient.address || '',
        city: editingClient.city || '', zip_code: editingClient.zip_code || '',
        province: editingClient.province || '', fiscal_code: editingClient.fiscal_code || '',
        vat_number: editingClient.vat_number || '', category: editingClient.category || 'privato',
        notes: editingClient.notes || '', is_favorite: editingClient.is_favorite || false
      })
    } else {
      setForm({
        name: '', company: '', phone: '', phone2: '', email: '',
        address: '', city: '', zip_code: '', province: '',
        fiscal_code: '', vat_number: '', category: 'privato', notes: '', is_favorite: false
      })
    }
  }, [editingClient, isOpen])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-lg max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
                <p className="text-xs text-slate-400">Rubrica clienti</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Nome + Preferito */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nome *
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Nome e Cognome" className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <button onClick={() => setForm({...form, is_favorite: !form.is_favorite})}
                className={`mt-6 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${form.is_favorite ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-200/60 text-slate-300 hover:text-amber-400'}`}>
                <Star className={`w-4 h-4 ${form.is_favorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            {/* Azienda + Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Azienda
                </label>
                <input type="text" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})}
                  placeholder="Nome azienda" className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Categoria</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                  title="Categoria cliente"
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:outline-none transition-all">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Telefoni */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefono
                </label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                  placeholder="+39 333..." className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefono 2
                </label>
                <input type="tel" value={form.phone2} onChange={(e) => setForm({...form, phone2: e.target.value})}
                  placeholder="Fisso/altro" className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="email@esempio.com" className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
            </div>

            {/* Indirizzo */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Indirizzo
              </label>
              <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="Via/Piazza..." className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
            </div>

            {/* Città + CAP + Provincia */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Città</label>
                <input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})}
                  placeholder="Città" className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">CAP</label>
                <input type="text" value={form.zip_code} onChange={(e) => setForm({...form, zip_code: e.target.value})}
                  placeholder="00000" maxLength={5} className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Prov.</label>
                <input type="text" value={form.province} onChange={(e) => setForm({...form, province: e.target.value.toUpperCase()})}
                  placeholder="RM" maxLength={2} className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
            </div>

            {/* CF + P.IVA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Codice Fiscale
                </label>
                <input type="text" value={form.fiscal_code} onChange={(e) => setForm({...form, fiscal_code: e.target.value.toUpperCase()})}
                  placeholder="RSSMRA80A01H501U" maxLength={16} className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> P. IVA
                </label>
                <input type="text" value={form.vat_number} onChange={(e) => setForm({...form, vat_number: e.target.value})}
                  placeholder="01234567890" maxLength={11} className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Note</label>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="Note sul cliente..." rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-700 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 focus:outline-none transition-all resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100/80 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
              Annulla
            </button>
            <button onClick={handleSubmit} disabled={!form.name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : editingClient ? 'Aggiorna' : 'Salva Cliente'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
