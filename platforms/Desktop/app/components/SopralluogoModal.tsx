'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ClipboardList, Save, CheckCircle } from 'lucide-react'
import type { Sopralluogo } from '../hooks/useSopralluoghi'
import type { Client } from '../hooks/useClients'
import type { Lavorazione } from '../hooks/useLavorazioni'

interface SopralluogoModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  lavorazioni: Lavorazione[]
  editSopralluogo?: Sopralluogo | null
  preselectedClientId?: string | null
  preselectedLavorazioneId?: string | null
  onSave: (data: Omit<Sopralluogo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Sopralluogo>
  onUpdate: (id: string, data: Partial<Sopralluogo>) => Promise<void>
}

export default function SopralluogoModal({
  isOpen, onClose, clients, lavorazioni, editSopralluogo, preselectedClientId, preselectedLavorazioneId, onSave, onUpdate
}: SopralluogoModalProps) {
  const [titolo, setTitolo] = useState('')
  const [clientId, setClientId] = useState('')
  const [lavorazioneId, setLavorazioneId] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [citta, setCitta] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [oraPrevista, setOraPrevista] = useState('')
  const [stato, setStato] = useState<Sopralluogo['stato']>('da_fare')
  const [note, setNote] = useState('')
  const [risultato, setRisultato] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editSopralluogo) {
      setTitolo(editSopralluogo.titolo)
      setClientId(editSopralluogo.client_id || '')
      setLavorazioneId(editSopralluogo.lavorazione_id || '')
      setIndirizzo(editSopralluogo.indirizzo || '')
      setCitta(editSopralluogo.citta || '')
      setDataPrevista(editSopralluogo.data_prevista || '')
      setOraPrevista(editSopralluogo.ora_prevista || '')
      setStato(editSopralluogo.stato)
      setNote(editSopralluogo.note || '')
      setRisultato(editSopralluogo.risultato || '')
    } else {
      setTitolo('')
      setClientId(preselectedClientId || '')
      setLavorazioneId(preselectedLavorazioneId || '')
      setIndirizzo('')
      setCitta('')
      setDataPrevista(new Date().toISOString().split('T')[0])
      setOraPrevista('')
      setStato('da_fare')
      setNote('')
      setRisultato('')
    }
    setSaveSuccess(false)
  }, [isOpen, editSopralluogo, preselectedClientId, preselectedLavorazioneId])

  // Auto-fill indirizzo dal cliente
  useEffect(() => {
    if (clientId && !editSopralluogo) {
      const c = clients.find(cl => cl.id === clientId)
      if (c) {
        if (c.address && !indirizzo) setIndirizzo(c.address)
        if (c.city && !citta) setCitta(c.city)
      }
    }
  }, [clientId])

  const handleSave = async () => {
    if (!titolo.trim()) return
    setIsSaving(true)
    try {
      const payload = {
        titolo: titolo.trim(),
        client_id: clientId || null,
        lavorazione_id: lavorazioneId || null,
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        data_prevista: dataPrevista || null,
        ora_prevista: oraPrevista || null,
        stato,
        note: note.trim(),
        risultato: risultato.trim(),
      }
      if (editSopralluogo) {
        await onUpdate(editSopralluogo.id, payload)
      } else {
        await onSave(payload)
      }
      setSaveSuccess(true)
      setTimeout(() => { setSaveSuccess(false); onClose() }, 800)
    } catch (err) {
      console.error('Error saving sopralluogo:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-lg w-full my-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editSopralluogo ? 'Modifica Sopralluogo' : 'Nuovo Sopralluogo'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Pianifica un sopralluogo sul cantiere</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!titolo.trim() || isSaving}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm shadow-lg ${
                    saveSuccess
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-500/25 disabled:opacity-50'
                  }`}
                >
                  {saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saveSuccess ? 'Salvato!' : isSaving ? 'Salvo...' : 'Salva'}
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">

              {/* Titolo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={titolo}
                  onChange={e => setTitolo(e.target.value)}
                  placeholder="Es: Sopralluogo infissi piano terra"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                />
              </div>

              {/* Cliente + Lavorazione */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    title="Seleziona cliente"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  >
                    <option value="">-- Nessuno --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Lavorazione (opz.)</label>
                  <select
                    value={lavorazioneId}
                    onChange={e => setLavorazioneId(e.target.value)}
                    title="Seleziona lavorazione"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  >
                    <option value="">-- Nessuna --</option>
                    {lavorazioni.filter(l => l.status !== 'annullata').map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indirizzo + Città */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Indirizzo</label>
                  <input
                    type="text"
                    value={indirizzo}
                    onChange={e => setIndirizzo(e.target.value)}
                    placeholder="Via Roma 1"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Città</label>
                  <input
                    type="text"
                    value={citta}
                    onChange={e => setCitta(e.target.value)}
                    placeholder="Milano"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Data + Ora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data prevista</label>
                  <input
                    type="date"
                    value={dataPrevista}
                    onChange={e => setDataPrevista(e.target.value)}
                    title="Data sopralluogo"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ora prevista</label>
                  <input
                    type="time"
                    value={oraPrevista}
                    onChange={e => setOraPrevista(e.target.value)}
                    title="Ora sopralluogo"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Stato */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Stato</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['da_fare', 'in_corso', 'completato', 'annullato'] as Sopralluogo['stato'][]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStato(s)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                        stato === s
                          ? s === 'da_fare' ? 'bg-indigo-500 text-white border-indigo-500'
                          : s === 'in_corso' ? 'bg-amber-500 text-white border-amber-500'
                          : s === 'completato' ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-red-500 text-white border-red-500'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'da_fare' ? '📅 Da Fare' : s === 'in_corso' ? '⏳ In Corso' : s === 'completato' ? '✅ Completato' : '❌ Annullato'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Accesso, chiavi, riferimenti, cosa controllare..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-sky-400 focus:outline-none text-sm resize-none"
                />
              </div>

              {/* Risultato (solo se completato) */}
              {stato === 'completato' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Risultato / Esito</label>
                  <textarea
                    value={risultato}
                    onChange={e => setRisultato(e.target.value)}
                    placeholder="Cosa è stato verificato, misure prese, accordi con il cliente..."
                    rows={3}
                    className="w-full px-3 py-2 bg-emerald-50 text-slate-800 rounded-lg border border-emerald-200 focus:border-emerald-400 focus:outline-none text-sm resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
