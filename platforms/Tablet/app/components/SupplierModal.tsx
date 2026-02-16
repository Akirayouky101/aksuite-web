'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Truck, Star, Globe, Phone, Mail, MapPin, Building2, FileText, Save } from 'lucide-react'
import { Supplier } from '../hooks/useSuppliers'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Supplier>) => void
  editingSupplier?: Supplier | null
}

const categories = ['Distributore IT', 'Materiale Elettrico', 'E-commerce', 'Ferramenta', 'Componentistica', 'Software/Licenze', 'Consumabili', 'Networking', 'Altro']

export default function SupplierModal({ isOpen, onClose, onSave, editingSupplier }: SupplierModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('Distributore IT')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [province, setProvince] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [fiscalCode, setFiscalCode] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name || '')
      setCode(editingSupplier.code || '')
      setCategory(editingSupplier.category || 'Distributore IT')
      setContactName(editingSupplier.contact_name || '')
      setEmail(editingSupplier.email || '')
      setPhone(editingSupplier.phone || '')
      setPhone2(editingSupplier.phone2 || '')
      setWebsite(editingSupplier.website || '')
      setAddress(editingSupplier.address || '')
      setCity(editingSupplier.city || '')
      setZipCode(editingSupplier.zip_code || '')
      setProvince(editingSupplier.province || '')
      setVatNumber(editingSupplier.vat_number || '')
      setFiscalCode(editingSupplier.fiscal_code || '')
      setPaymentTerms(editingSupplier.payment_terms || '')
      setNotes(editingSupplier.notes || '')
    } else {
      setName(''); setCode(''); setCategory('Distributore IT'); setContactName('')
      setEmail(''); setPhone(''); setPhone2(''); setWebsite('')
      setAddress(''); setCity(''); setZipCode(''); setProvince('')
      setVatNumber(''); setFiscalCode(''); setPaymentTerms(''); setNotes('')
    }
  }, [editingSupplier, isOpen])

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(), code: code.trim() || null, category, contact_name: contactName.trim() || null,
      email: email.trim() || null, phone: phone.trim() || null, phone2: phone2.trim() || null,
      website: website.trim() || null, address: address.trim() || null, city: city.trim() || null,
      zip_code: zipCode.trim() || null, province: province.trim() || null,
      vat_number: vatNumber.trim() || null, fiscal_code: fiscalCode.trim() || null,
      payment_terms: paymentTerms.trim() || null, notes: notes.trim() || null,
    })
    onClose()
  }

  if (!isOpen) return null

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 mb-1 block"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</h2>
                  <p className="text-xs text-slate-400">Dati fornitore e contatti</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-4">
              {/* Nome + Codice + Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className={labelClass}>Nome Fornitore *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Es. Esprinet" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Codice</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="Codice interno" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} title="Categoria fornitore" className={inputClass}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Contatto + Email + Telefoni */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><Building2 className="w-3 h-3 inline mr-1" />Referente</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nome referente" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" />Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@fornitore.it" type="email" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Phone className="w-3 h-3 inline mr-1" />Telefono</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 ..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Phone className="w-3 h-3 inline mr-1" />Telefono 2</label>
                  <input value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="Altro numero" className={inputClass} />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className={labelClass}><Globe className="w-3 h-3 inline mr-1" />Sito Web</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://www.fornitore.it" className={inputClass} />
              </div>

              {/* Indirizzo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}><MapPin className="w-3 h-3 inline mr-1" />Indirizzo</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Via..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Citt\u00e0</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Citt\u00e0" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>CAP</label>
                    <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="CAP" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Prov.</label>
                    <input value={province} onChange={e => setProvince(e.target.value)} placeholder="MI" maxLength={2} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Dati fiscali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><FileText className="w-3 h-3 inline mr-1" />P.IVA</label>
                  <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="Partita IVA" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Codice Fiscale</label>
                  <input value={fiscalCode} onChange={e => setFiscalCode(e.target.value)} placeholder="Codice Fiscale" className={inputClass} />
                </div>
              </div>

              {/* Condizioni pagamento + Note */}
              <div>
                <label className={labelClass}>Condizioni di Pagamento</label>
                <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Es. 30gg DFFM, Bonifico anticipato..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Note</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note aggiuntive..." rows={3} className={`${inputClass} resize-none`} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200/60 bg-white/60 flex justify-end gap-2 flex-shrink-0">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-all">Annulla</button>
              <button onClick={handleSubmit} disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all disabled:opacity-40 flex items-center gap-2">
                <Save className="w-4 h-4" />{editingSupplier ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
