'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Check, AlertTriangle, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { Product } from '../hooks/useWarehouse'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (products: Partial<Product>[]) => Promise<number>
  existingSkus: string[]
}

interface ParsedRow {
  raw: Record<string, string>
  product: Partial<Product>
  status: 'new' | 'duplicate' | 'error'
  error?: string
  selected: boolean
}

// Mappa colonne CSV -> campi Product
const COLUMN_MAP: Record<string, keyof Product> = {
  'nome prodotto': 'name',
  'nome': 'name',
  'name': 'name',
  'sku': 'sku',
  'codice': 'sku',
  'categoria': 'category',
  'category': 'category',
  'marca': 'brand',
  'brand': 'brand',
  'modello': 'model',
  'model': 'model',
  'descrizione': 'description',
  'description': 'description',
  'codice a barre': 'barcode',
  'barcode': 'barcode',
  'codice qr': 'qr_code',
  'qr code': 'qr_code',
  'qr_code': 'qr_code',
  'unit\u00E0': 'unit',
  'unita': 'unit',
  'unit': 'unit',
  'quantit\u00E0': 'quantity',
  'quantita': 'quantity',
  'quantity': 'quantity',
  'scorta min': 'min_quantity',
  'min_quantity': 'min_quantity',
  'scorta max': 'max_quantity',
  'max_quantity': 'max_quantity',
  'prezzo acquisto': 'purchase_price',
  'purchase_price': 'purchase_price',
  'prezzo vendita': 'sell_price',
  'sell_price': 'sell_price',
  'posizione': 'location',
  'location': 'location',
  'scaffale': 'shelf',
  'shelf': 'shelf',
  'note': 'notes',
  'notes': 'notes',
}

function parsePrice(val: string): number {
  if (!val || val.trim() === '') return 0
  // Gestisci formato italiano: 1.234,56 -> 1234.56
  let cleaned = val.trim()
  // Se contiene virgola come decimale (es: 2.592,00 o 507)
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseNumber(val: string): number {
  if (!val || val.trim() === '') return 0
  const num = parseInt(val.trim(), 10)
  return isNaN(num) ? 0 : num
}

export default function CsvImportModal({ isOpen, onClose, onImport, existingSkus }: CsvImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importResult, setImportResult] = useState<{ success: number, errors: number }>({ success: 0, errors: 0 })
  const [showDetails, setShowDetails] = useState(false)
  const [separator, setSeparator] = useState(';')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const detectSeparator = (firstLine: string): string => {
    const semicolons = (firstLine.match(/;/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length
    const tabs = (firstLine.match(/\t/g) || []).length
    if (tabs > semicolons && tabs > commas) return '\t'
    if (semicolons > commas) return ';'
    return ','
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return

      const detectedSep = detectSeparator(lines[0])
      setSeparator(detectedSep)

      const headers = lines[0].split(detectedSep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

      // Mappa indici header -> campo Product
      const fieldMap: { index: number; field: keyof Product }[] = []
      headers.forEach((h, i) => {
        const mapped = COLUMN_MAP[h]
        if (mapped) fieldMap.push({ index: i, field: mapped })
      })

      const parsed: ParsedRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(detectedSep).map(c => c.trim().replace(/^"|"$/g, ''))
        if (cols.length < 2) continue

        const raw: Record<string, string> = {}
        headers.forEach((h, idx) => { raw[h] = cols[idx] || '' })

        const product: Partial<Product> = {
          unit: 'Pezzi',
          quantity: 0,
          min_quantity: 0,
          max_quantity: null,
          purchase_price: 0,
          sell_price: 0,
          is_active: true,
        }

        for (const { index, field } of fieldMap) {
          const val = cols[index] || ''
          if (!val) continue

          switch (field) {
            case 'quantity':
            case 'min_quantity':
              (product as any)[field] = parseNumber(val)
              break
            case 'max_quantity':
              const maxVal = parseNumber(val)
              product.max_quantity = maxVal > 0 ? maxVal : null
              break
            case 'purchase_price':
            case 'sell_price':
              (product as any)[field] = parsePrice(val)
              break
            default:
              (product as any)[field] = val
          }
        }

        // Cerca fornitore nel CSV (colonna "fornitore" / "supplier")
        const supplierCol = headers.findIndex(h => h === 'fornitore' || h === 'supplier')
        if (supplierCol >= 0 && cols[supplierCol]) {
          // Non mappiamo supplier_id direttamente, lo mettiamo nelle note
          const existingNotes = product.notes || ''
          const supplierName = cols[supplierCol]
          product.notes = existingNotes ? `${existingNotes} | Fornitore: ${supplierName}` : `Fornitore: ${supplierName}`
        }

        let status: 'new' | 'duplicate' | 'error' = 'new'
        let error: string | undefined

        if (!product.name) {
          status = 'error'
          error = 'Nome prodotto mancante'
        } else if (product.sku && existingSkus.includes(product.sku)) {
          status = 'duplicate'
        }

        parsed.push({ raw, product, status, error, selected: status === 'new' })
      }

      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      handleFile(file)
    }
  }

  const toggleAll = (selected: boolean) => {
    setRows(prev => prev.map(r => r.status !== 'error' ? { ...r, selected } : r))
  }

  const toggleRow = (index: number) => {
    setRows(prev => prev.map((r, i) => i === index && r.status !== 'error' ? { ...r, selected: !r.selected } : r))
  }

  const handleImport = async () => {
    setStep('importing')
    const toImport = rows.filter(r => r.selected).map(r => r.product)
    try {
      const count = await onImport(toImport)
      setImportResult({ success: count, errors: toImport.length - count })
    } catch {
      setImportResult({ success: 0, errors: toImport.length })
    }
    setStep('done')
  }

  const selectedCount = rows.filter(r => r.selected).length
  const newCount = rows.filter(r => r.status === 'new').length
  const dupCount = rows.filter(r => r.status === 'duplicate').length
  const errCount = rows.filter(r => r.status === 'error').length

  const handleReset = () => {
    setStep('upload')
    setRows([])
    setImportResult({ success: 0, errors: 0 })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Importa Listino CSV</h2>
                  <p className="text-xs text-slate-400">
                    {step === 'upload' && 'Carica un file CSV per importare prodotti nel magazzino'}
                    {step === 'preview' && `${rows.length} righe trovate \u2022 ${selectedCount} selezionate`}
                    {step === 'importing' && 'Importazione in corso...'}
                    {step === 'done' && `Completato: ${importResult.success} importati`}
                  </p>
                </div>
              </div>
              <button onClick={() => { handleReset(); onClose() }} title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* STEP 1: Upload */}
              {step === 'upload' && (
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
                >
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-1">Trascina il file CSV qui</p>
                  <p className="text-slate-400 text-sm mb-4">oppure clicca per selezionare</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-xs font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    Seleziona file CSV
                  </div>
                  <p className="text-slate-300 text-[10px] mt-4">Separatore supportato: ; (punto e virgola), , (virgola) o TAB</p>
                </div>
              )}

              {/* STEP 2: Preview */}
              {step === 'preview' && (
                <>
                  {/* Stats bar */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-xs font-bold">
                      <Check className="w-3 h-3" /> {newCount} nuovi
                    </div>
                    {dupCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-600 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3" /> {dupCount} duplicati (SKU esistente)
                      </div>
                    )}
                    {errCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 text-red-600 text-xs font-bold">
                        <X className="w-3 h-3" /> {errCount} errori
                      </div>
                    )}
                  </div>

                  {/* Select all */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={selectedCount === rows.filter(r => r.status !== 'error').length}
                        onChange={e => toggleAll(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                      Seleziona tutti ({rows.filter(r => r.status !== 'error').length})
                    </label>
                    <button onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                      {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showDetails ? 'Compatta' : 'Dettagli'}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200/60 rounded-xl overflow-hidden">
                    <div className="max-h-[45vh] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/80 sticky top-0">
                          <tr className="text-left text-slate-500 font-semibold">
                            <th className="px-3 py-2 w-8"></th>
                            <th className="px-3 py-2">Nome Prodotto</th>
                            <th className="px-3 py-2 w-24">SKU</th>
                            <th className="px-3 py-2 w-16 text-right">Prezzo</th>
                            <th className="px-3 py-2 w-20">Stato</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i} className={`border-t border-slate-100 ${row.status === 'error' ? 'bg-red-50/30 opacity-60' : row.status === 'duplicate' ? 'bg-amber-50/30' : ''} ${row.selected ? 'bg-emerald-50/20' : ''}`}>
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={row.selected} disabled={row.status === 'error'}
                                  onChange={() => toggleRow(i)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-700 truncate max-w-[300px]">{row.product.name || '-'}</div>
                                {showDetails && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {row.product.brand} {row.product.model && `\u2022 ${row.product.model}`} {row.product.category && `\u2022 ${row.product.category}`}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-500">{row.product.sku || '-'}</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">
                                {row.product.purchase_price ? `\u20AC${row.product.purchase_price.toFixed(2)}` : '-'}
                              </td>
                              <td className="px-3 py-2">
                                {row.status === 'new' && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">Nuovo</span>}
                                {row.status === 'duplicate' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">Duplicato</span>}
                                {row.status === 'error' && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold" title={row.error}>Errore</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3: Importing */}
              {step === 'importing' && (
                <div className="text-center py-16">
                  <Loader2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-600 font-medium">Importazione di {selectedCount} prodotti...</p>
                  <p className="text-slate-400 text-sm mt-1">Non chiudere questa finestra</p>
                </div>
              )}

              {/* STEP 4: Done */}
              {step === 'done' && (
                <div className="text-center py-16">
                  {importResult.success > 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
                        <Check className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-slate-800 font-bold text-lg">{importResult.success} prodotti importati!</p>
                      {importResult.errors > 0 && (
                        <p className="text-amber-500 text-sm mt-1">{importResult.errors} non importati (errori)</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-red-100 mx-auto mb-4 flex items-center justify-center">
                        <X className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-slate-800 font-bold text-lg">Importazione fallita</p>
                      <p className="text-red-500 text-sm mt-1">Controlla i dati e riprova</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200/60 bg-white/60 flex items-center justify-between flex-shrink-0">
              {step === 'preview' && (
                <>
                  <button onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
                    Indietro
                  </button>
                  <button onClick={handleImport} disabled={selectedCount === 0}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Importa {selectedCount} prodotti
                  </button>
                </>
              )}
              {step === 'done' && (
                <>
                  <button onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all">
                    Importa altro
                  </button>
                  <button onClick={() => { handleReset(); onClose() }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all">
                    Chiudi
                  </button>
                </>
              )}
              {(step === 'upload' || step === 'importing') && <div />}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
