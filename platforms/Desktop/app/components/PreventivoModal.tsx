'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Plus, Trash2, Printer, Users, Calculator } from 'lucide-react'
import { Client } from '../hooks/useClients'
import { Lavorazione } from '../hooks/useLavorazioni'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
}

interface PreventivoModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  lavorazioni: Lavorazione[]
  preselectedClientId?: string | null
  preselectedLavorazioneId?: string | null
}

export default function PreventivoModal({ isOpen, onClose, clients, lavorazioni, preselectedClientId, preselectedLavorazioneId }: PreventivoModalProps) {
  const [clientId, setClientId] = useState<string>('')
  const [lavorazioneId, setLavorazioneId] = useState<string>('')
  const [numero, setNumero] = useState('')
  const [dataPreventivo, setDataPreventivo] = useState(new Date().toISOString().split('T')[0])
  const [validita, setValidita] = useState('30')
  const [oggetto, setOggetto] = useState('')
  const [note, setNote] = useState('')
  const [ivaPercent, setIvaPercent] = useState(22)
  const [sconto, setSconto] = useState(0)
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }
  ])
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setClientId(preselectedClientId || '')
      setLavorazioneId(preselectedLavorazioneId || '')
      setNumero(`PRV-${Date.now().toString().slice(-6)}`)
      setDataPreventivo(new Date().toISOString().split('T')[0])
      setOggetto('')
      setNote('')
      setSconto(0)
      setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }])
    }
  }, [isOpen, preselectedClientId, preselectedLavorazioneId])

  // Auto-fill from lavorazione
  useEffect(() => {
    if (lavorazioneId) {
      const lav = lavorazioni.find(l => l.id === lavorazioneId)
      if (lav) {
        if (!oggetto) setOggetto(lav.title)
        if (lav.client_id && !clientId) setClientId(lav.client_id)
      }
    }
  }, [lavorazioneId])

  if (!isOpen) return null

  const selectedClient = clients.find(c => c.id === clientId) || null
  const selectedLav = lavorazioni.find(l => l.id === lavorazioneId) || null

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
  const scontoAmount = subtotal * (sconto / 100)
  const imponibile = subtotal - scontoAmount
  const ivaAmount = imponibile * (ivaPercent / 100)
  const totale = imponibile + ivaAmount

  const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePrint = () => {
    const content = reportRef.current
    if (!content) return
    const printWin = window.open('', '_blank', 'width=800,height=600')
    if (!printWin) return
    printWin.document.write(`
      <!DOCTYPE html><html><head><title>Preventivo ${numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; font-size: 13px; line-height: 1.6; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .header h1 { font-size: 24px; color: #1e293b; font-weight: 700; }
        .header .numero { color: #4f46e5; font-size: 14px; font-weight: 600; }
        .header .date { color: #64748b; font-size: 12px; margin-top: 4px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .party { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .party-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
        .party-name { font-size: 15px; font-weight: 700; color: #1e293b; }
        .party-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
        .oggetto { margin-bottom: 20px; padding: 12px; background: #f0f0ff; border-radius: 8px; border: 1px solid #e0e0ff; }
        .oggetto-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
        .oggetto-text { font-size: 14px; color: #1e293b; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        td.right, th.right { text-align: right; }
        .totals { margin-left: auto; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .total-row.main { border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 6px; font-weight: 700; font-size: 16px; color: #4f46e5; }
        .total-label { color: #64748b; }
        .total-value { font-weight: 600; color: #1e293b; }
        .notes { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .notes-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
        .notes-text { font-size: 12px; color: #64748b; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .validity { margin-top: 16px; text-align: center; padding: 8px; background: #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e; font-weight: 500; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `)
    printWin.document.close()
    setTimeout(() => { printWin.print(); }, 500)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full my-8"
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Preventivo Rapido</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Genera un preventivo professionale in PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all hover:shadow-emerald-500/40">
                  <Printer className="w-4 h-4" /> Stampa PDF
                </button>
                <button onClick={onClose} title="Chiudi"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
              {/* Top row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">N. Preventivo</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
                  <input type="date" value={dataPreventivo} onChange={(e) => setDataPreventivo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Validita (gg)</label>
                  <input type="number" value={validita} onChange={(e) => setValidita(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">IVA %</label>
                  <input type="number" value={ivaPercent} onChange={(e) => setIvaPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
              </div>

              {/* Client + Lavorazione */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm">
                    <option value="">-- Seleziona cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Lavorazione (opzionale)</label>
                  <select value={lavorazioneId} onChange={(e) => setLavorazioneId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm">
                    <option value="">-- Nessuna --</option>
                    {lavorazioni.filter(l => l.status !== 'annullata').map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Oggetto */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Oggetto</label>
                <input type="text" value={oggetto} onChange={(e) => setOggetto(e.target.value)}
                  placeholder="Es: Fornitura e posa infissi in PVC"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500">Voci del preventivo</label>
                  <button onClick={addItem} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700">
                    <Plus className="w-3 h-3" /> Aggiungi voce
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                    <div className="col-span-5">Descrizione</div>
                    <div className="col-span-2">Quantita</div>
                    <div className="col-span-1">Unita</div>
                    <div className="col-span-2">Prezzo Unit.</div>
                    <div className="col-span-1 text-right">Totale</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center bg-slate-50/50 rounded-lg p-2 border border-slate-200/40">
                      <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descrizione voce"
                        className="col-span-2 md:col-span-5 px-2 py-1.5 bg-white text-slate-800 rounded border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} min={0} step={0.1}
                        className="md:col-span-2 px-2 py-1.5 bg-white text-slate-800 rounded border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                      <select value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="md:col-span-1 px-1 py-1.5 bg-white text-slate-800 rounded border border-slate-200 focus:border-emerald-400 focus:outline-none text-xs">
                        <option value="pz">pz</option>
                        <option value="mq">mq</option>
                        <option value="ml">ml</option>
                        <option value="h">h</option>
                        <option value="kg">kg</option>
                        <option value="corpo">corpo</option>
                      </select>
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))} min={0} step={0.01}
                        placeholder="0.00"
                        className="md:col-span-2 px-2 py-1.5 bg-white text-slate-800 rounded border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                      <div className="md:col-span-1 text-right text-sm font-bold text-slate-700">
                        {fmt(item.quantity * item.unit_price)}
                      </div>
                      <button onClick={() => removeItem(item.id)} title="Rimuovi voce"
                        className="md:col-span-1 p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-400 transition-all flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sconto + Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sconto %</label>
                  <input type="number" value={sconto} onChange={(e) => setSconto(Number(e.target.value))} min={0} max={100}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Note / Condizioni</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    placeholder="Condizioni di pagamento, tempi di consegna..."
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm resize-none" />
                </div>
              </div>

              {/* Totals summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 uppercase">Riepilogo</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotale</span><span className="font-medium text-slate-700">{'\u20AC'} {fmt(subtotal)}</span></div>
                  {sconto > 0 && <div className="flex justify-between"><span className="text-red-500">Sconto ({sconto}%)</span><span className="font-medium text-red-500">- {'\u20AC'} {fmt(scontoAmount)}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500">Imponibile</span><span className="font-medium text-slate-700">{'\u20AC'} {fmt(imponibile)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">IVA ({ivaPercent}%)</span><span className="font-medium text-slate-700">{'\u20AC'} {fmt(ivaAmount)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200/60">
                    <span className="font-bold text-emerald-700 text-lg">TOTALE</span>
                    <span className="font-bold text-emerald-700 text-lg">{'\u20AC'} {fmt(totale)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden print content */}
            <div className="hidden">
              <div ref={reportRef}>
                <div className="header">
                  <div>
                    <h1>PREVENTIVO</h1>
                    <div className="numero">N. {numero}</div>
                    <div className="date">Data: {new Date(dataPreventivo).toLocaleDateString('it-IT')} | Validita: {validita} giorni</div>
                  </div>
                </div>
                <div className="parties">
                  <div className="party">
                    <div className="party-label">Cliente</div>
                    {selectedClient ? (
                      <>
                        <div className="party-name">{selectedClient.name}</div>
                        {selectedClient.company && <div className="party-detail">{selectedClient.company}</div>}
                        {selectedClient.address && <div className="party-detail">{selectedClient.address}{selectedClient.city ? `, ${selectedClient.city}` : ''}{selectedClient.province ? ` (${selectedClient.province})` : ''}{selectedClient.zip_code ? ` - ${selectedClient.zip_code}` : ''}</div>}
                        {selectedClient.phone && <div className="party-detail">Tel: {selectedClient.phone}</div>}
                        {selectedClient.email && <div className="party-detail">Email: {selectedClient.email}</div>}
                        {selectedClient.fiscal_code && <div className="party-detail">C.F.: {selectedClient.fiscal_code}</div>}
                        {selectedClient.vat_number && <div className="party-detail">P.IVA: {selectedClient.vat_number}</div>}
                      </>
                    ) : (
                      <div className="party-detail">Non specificato</div>
                    )}
                  </div>
                  {selectedLav && (
                    <div className="party">
                      <div className="party-label">Rif. Lavorazione</div>
                      <div className="party-name">{selectedLav.title}</div>
                      {selectedLav.address && <div className="party-detail">{selectedLav.address}{selectedLav.city ? `, ${selectedLav.city}` : ''}</div>}
                    </div>
                  )}
                </div>
                {oggetto && (
                  <div className="oggetto">
                    <div className="oggetto-label">Oggetto</div>
                    <div className="oggetto-text">{oggetto}</div>
                  </div>
                )}
                <table>
                  <thead>
                    <tr>
                      <th style={{width: '5%'}}>#</th>
                      <th style={{width: '45%'}}>Descrizione</th>
                      <th className="right" style={{width: '10%'}}>Qta</th>
                      <th style={{width: '8%'}}>UM</th>
                      <th className="right" style={{width: '16%'}}>Prezzo Unit.</th>
                      <th className="right" style={{width: '16%'}}>Totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.description).map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.description}</td>
                        <td className="right">{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td className="right">{'\u20AC'} {fmt(item.unit_price)}</td>
                        <td className="right">{'\u20AC'} {fmt(item.quantity * item.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="totals">
                  <div className="total-row"><span className="total-label">Subtotale</span><span className="total-value">{'\u20AC'} {fmt(subtotal)}</span></div>
                  {sconto > 0 && <div className="total-row"><span className="total-label">Sconto ({sconto}%)</span><span className="total-value" style={{color: '#ef4444'}}>- {'\u20AC'} {fmt(scontoAmount)}</span></div>}
                  <div className="total-row"><span className="total-label">Imponibile</span><span className="total-value">{'\u20AC'} {fmt(imponibile)}</span></div>
                  <div className="total-row"><span className="total-label">IVA ({ivaPercent}%)</span><span className="total-value">{'\u20AC'} {fmt(ivaAmount)}</span></div>
                  <div className="total-row main"><span>TOTALE</span><span>{'\u20AC'} {fmt(totale)}</span></div>
                </div>
                {note && (
                  <div className="notes">
                    <div className="notes-label">Note e Condizioni</div>
                    <div className="notes-text">{note}</div>
                  </div>
                )}
                <div className="validity">
                  Preventivo valido {validita} giorni dalla data di emissione
                </div>
                <div className="footer">
                  Preventivo generato il {new Date().toLocaleDateString('it-IT')} | AK Suite
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
