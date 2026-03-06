'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Plus, Trash2, Printer, Users, Calculator, Search, Package, AlertCircle, Save } from 'lucide-react'
import { Client } from '../hooks/useClients'
import { Lavorazione } from '../hooks/useLavorazioni'
import { Product } from '../hooks/useWarehouse'
import { Preventivo, PreventivoLineItem } from '../hooks/usePreventivi'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  product_id?: string
  sku?: string
}

interface PreventivoModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  lavorazioni: Lavorazione[]
  products?: Product[]
  preselectedClientId?: string | null
  preselectedLavorazioneId?: string | null
  onOpenProductModal?: (prefill: any) => void
  onSave?: (data: Omit<Preventivo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Preventivo | null>
  onUpdate?: (id: string, data: Partial<Preventivo>) => Promise<void>
  editPreventivo?: Preventivo | null
}

export default function PreventivoModal({ isOpen, onClose, clients, lavorazioni, products = [], preselectedClientId, preselectedLavorazioneId, onOpenProductModal, onSave, onUpdate, editPreventivo }: PreventivoModalProps) {
  const [clientId, setClientId] = useState<string>('')
  const [lavorazioneId, setLavorazioneId] = useState<string>('')
  const [numero, setNumero] = useState('')
  const [dataPreventivo, setDataPreventivo] = useState(new Date().toISOString().split('T')[0])
  const [validita, setValidita] = useState('30')
  const [oggetto, setOggetto] = useState('')
  const [note, setNote] = useState('')
  const [ivaPercent, setIvaPercent] = useState(22)
  const [sconto, setSconto] = useState(0)
  const [stato, setStato] = useState<Preventivo['stato']>('bozza')
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [productSearchId, setProductSearchId] = useState<string | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (editPreventivo) {
        // Modalità modifica: carica dati esistenti
        setClientId(editPreventivo.client_id || '')
        setLavorazioneId(editPreventivo.lavorazione_id || '')
        setNumero(editPreventivo.numero)
        setDataPreventivo(editPreventivo.data_preventivo)
        setValidita(String(editPreventivo.validita))
        setOggetto(editPreventivo.oggetto || '')
        setNote(editPreventivo.note || '')
        setIvaPercent(editPreventivo.iva_percent)
        setSconto(editPreventivo.sconto)
        setStato(editPreventivo.stato)
        setItems(editPreventivo.items?.length ? editPreventivo.items : [{ id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }])
      } else {
        // Modalità nuovo
        setClientId(preselectedClientId || '')
        setLavorazioneId(preselectedLavorazioneId || '')
        setNumero(`PRV-${Date.now().toString().slice(-6)}`)
        setDataPreventivo(new Date().toISOString().split('T')[0])
        setValidita('30')
        setOggetto('')
        setNote('')
        setSconto(0)
        setStato('bozza')
        setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }])
      }
      setProductSearchId(null)
      setProductSearchQuery('')
      setBarcodeInput('')
      setNotFoundCode(null)
      setSaveSuccess(false)
    }
  }, [isOpen, preselectedClientId, preselectedLavorazioneId, editPreventivo])

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim() || !products.length) return []
    const q = productSearchQuery.toLowerCase()
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [productSearchQuery, products])

  // Select product from search (or barcode scan)
  const selectProduct = (itemId: string, product: Product) => {
    // Check if product already exists in another row
    const existingItem = items.find(i => i.product_id === product.id && i.id !== itemId)
    if (existingItem) {
      // Product already in list — increment quantity
      setItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i))
      // If current row is empty (used just for scanning), remove it
      const currentItem = items.find(i => i.id === itemId)
      if (currentItem && !currentItem.description && !currentItem.product_id) {
        // keep it as the next empty row
      }
    } else {
      // Fill current row with product data + auto-add new empty row
      const newEmptyRow: LineItem = { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }
      setItems(prev => [
        ...prev.map(i => i.id === itemId ? {
          ...i,
          description: `${product.name}${product.model ? ` (${product.model})` : ''}`,
          unit_price: product.sell_price || product.purchase_price || 0,
          unit: product.unit === 'Pezzi' ? 'pz' : (product.unit || 'pz'),
          product_id: product.id,
          sku: product.sku || '',
          quantity: 1,
        } : i),
        newEmptyRow,
      ])
    }
    setProductSearchId(null)
    setProductSearchQuery('')
  }

  // Handle barcode scan — finds product by SKU/barcode and adds/sums
  const handleBarcodeScan = (code: string) => {
    if (!code.trim() || !products.length) return
    const q = code.trim().toLowerCase()
    const product = products.find(p =>
      p.sku?.toLowerCase() === q ||
      p.barcode?.toLowerCase() === q ||
      p.name?.toLowerCase() === q
    )
    if (!product) {
      // Product not found — show prompt to create
      setNotFoundCode(code.trim())
      setBarcodeInput('')
      return
    }
    // Check if product already exists in items
    const existingItem = items.find(i => i.product_id === product.id)
    if (existingItem) {
      // Increment quantity
      setItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      // Find last empty row or add new one
      const emptyRow = items.find(i => !i.description && !i.product_id)
      if (emptyRow) {
        // Fill empty row + add new empty row
        const newEmptyRow: LineItem = { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 }
        setItems(prev => [
          ...prev.map(i => i.id === emptyRow.id ? {
            ...i,
            description: `${product.name}${product.model ? ` (${product.model})` : ''}`,
            unit_price: product.sell_price || product.purchase_price || 0,
            unit: product.unit === 'Pezzi' ? 'pz' : (product.unit || 'pz'),
            product_id: product.id,
            sku: product.sku || '',
            quantity: 1,
          } : i),
          newEmptyRow,
        ])
      } else {
        // No empty row, add filled + empty
        setItems(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            description: `${product.name}${product.model ? ` (${product.model})` : ''}`,
            unit_price: product.sell_price || product.purchase_price || 0,
            unit: product.unit === 'Pezzi' ? 'pz' : (product.unit || 'pz'),
            product_id: product.id,
            sku: product.sku || '',
            quantity: 1,
          },
          { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pz', unit_price: 0 },
        ])
      }
    }
    setBarcodeInput('')
    // Re-focus barcode field for rapid scanning
    setTimeout(() => barcodeRef.current?.focus(), 50)
  }

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

  const handleSave = async () => {
    if (!onSave && !onUpdate) return
    setIsSaving(true)
    const payload = {
      numero,
      client_id: clientId || null,
      lavorazione_id: lavorazioneId || null,
      oggetto: oggetto || null,
      items: items as PreventivoLineItem[],
      subtotal,
      sconto,
      imponibile,
      iva_percent: ivaPercent,
      iva_amount: ivaAmount,
      totale,
      stato,
      note: note || null,
      data_preventivo: dataPreventivo,
      validita: Number(validita),
    }
    if (editPreventivo && onUpdate) {
      await onUpdate(editPreventivo.id, payload)
    } else if (onSave) {
      await onSave(payload)
    }
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

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
                  <h2 className="text-lg font-bold text-slate-800">
                    {editPreventivo ? `Modifica ${editPreventivo.numero}` : 'Nuovo Preventivo'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Genera un preventivo professionale in PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(onSave || onUpdate) && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all ${saveSuccess ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'}`}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvataggio...' : saveSuccess ? '✓ Salvato!' : 'Salva'}
                  </button>
                )}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1 truncate">N. Preventivo</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm font-mono" />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1 truncate">Data</label>
                  <input type="date" value={dataPreventivo} onChange={(e) => setDataPreventivo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1 truncate">Validit{'\u00E0'} (gg)</label>
                  <input type="number" value={validita} onChange={(e) => setValidita(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1 truncate">IVA %</label>
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

              {/* Barcode scanner input */}
              {products.length > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200/60 p-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      ref={barcodeRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleBarcodeScan(barcodeInput)
                        }
                      }}
                      placeholder="Spara codice a barre o digita SKU e premi Invio..."
                      className="w-full px-3 py-2 bg-white text-slate-800 rounded-lg border border-indigo-200 focus:border-indigo-400 focus:outline-none text-sm placeholder:text-indigo-300"
                    />
                  </div>
                  <span className="text-[10px] text-indigo-400 font-medium flex-shrink-0 hidden sm:block">Scansione rapida</span>
                </div>
              )}

              {/* Product not found prompt */}
              {notFoundCode && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-amber-800">Prodotto non trovato</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Il codice <span className="font-mono font-bold">{notFoundCode}</span> non corrisponde a nessun prodotto in magazzino.
                      </p>
                      <p className="text-xs text-amber-500 mt-1">Vuoi creare un nuovo prodotto con questo codice?</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            if (onOpenProductModal) {
                              onOpenProductModal({ sku: notFoundCode, barcode: notFoundCode, name: '' })
                            }
                            setNotFoundCode(null)
                          }}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
                        >
                          {'\u2714'} S{'\u00EC'}, crea prodotto
                        </button>
                        <button
                          onClick={() => {
                            setNotFoundCode(null)
                            setTimeout(() => barcodeRef.current?.focus(), 50)
                          }}
                          className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition-all"
                        >
                          No, ignora
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

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
                    <div key={item.id} className="relative">
                      <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center bg-slate-50/50 rounded-lg p-2 border border-slate-200/40">
                        <div className="col-span-2 md:col-span-5 relative">
                          <div className="flex gap-1">
                            {products.length > 0 && (
                              <button onClick={() => { setProductSearchId(productSearchId === item.id ? null : item.id); setProductSearchQuery('') }}
                                title="Cerca prodotto da magazzino"
                                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-all ${productSearchId === item.id ? 'bg-indigo-100 text-indigo-600 border border-indigo-300' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:text-indigo-500 hover:border-indigo-200'}`}>
                                <Package className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Descrizione voce"
                              className="flex-1 px-2 py-1.5 bg-white text-slate-800 rounded border border-slate-200 focus:border-emerald-400 focus:outline-none text-sm" />
                          </div>
                          {item.sku && <span className="text-[10px] text-indigo-500 font-mono mt-0.5 block">{item.sku}</span>}
                        </div>
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
                      {/* Product search dropdown */}
                      {productSearchId === item.id && products.length > 0 && (
                        <div className="mt-1 bg-white rounded-lg border border-indigo-200 shadow-lg p-2 z-20">
                          <div className="flex items-center gap-2 mb-2">
                            <Search className="w-3.5 h-3.5 text-indigo-400" />
                            <input type="text" value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)}
                              placeholder="Cerca prodotto per nome, SKU, modello..."
                              autoFocus
                              className="flex-1 px-2 py-1.5 bg-slate-50 text-slate-800 rounded border border-slate-200 focus:border-indigo-400 focus:outline-none text-xs" />
                          </div>
                          {filteredProducts.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-0.5">
                              {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => selectProduct(item.id, p)}
                                  title={`Seleziona ${p.name}`}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-50 transition-all flex items-center gap-2">
                                  <Package className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-slate-700 truncate block">{p.name}</span>
                                    <span className="text-[10px] text-slate-400">{p.sku || p.model || ''} {p.brand ? `| ${p.brand}` : ''} {p.sell_price ? `| \u20AC${p.sell_price.toFixed(2)}` : ''}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : productSearchQuery.length > 0 ? (
                            <p className="text-[10px] text-slate-400 text-center py-2">Nessun prodotto trovato</p>
                          ) : (
                            <p className="text-[10px] text-slate-400 text-center py-2">Digita per cercare nel magazzino</p>
                          )}
                        </div>
                      )}
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
