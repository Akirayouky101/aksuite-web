'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, QrCode, ScanLine, Copy, Check } from 'lucide-react'
import { Product } from '../hooks/useWarehouse'

interface LabelPrinterModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
}

export default function LabelPrinterModal({ isOpen, onClose, product }: LabelPrinterModalProps) {
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showPrice, setShowPrice] = useState(true)
  const [showBarcode, setShowBarcode] = useState(true)
  const [showLocation, setShowLocation] = useState(true)
  const [copies, setCopies] = useState(1)
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !product) return null

  const labelSizes = { small: { w: '38mm', h: '25mm', fontSize: '7px' }, medium: { w: '60mm', h: '40mm', fontSize: '9px' }, large: { w: '80mm', h: '50mm', fontSize: '11px' } }
  const size = labelSizes[labelSize]

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=400,height=300')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Etichetta - ${product.name}</title>
      <style>
        @page { size: ${size.w} ${size.h}; margin: 0; }
        body { margin: 0; padding: 2mm; font-family: 'Arial', sans-serif; font-size: ${size.fontSize}; }
        .label { width: ${size.w}; box-sizing: border-box; }
        .name { font-weight: bold; font-size: 1.2em; margin-bottom: 1mm; }
        .sku { font-family: monospace; font-size: 0.9em; color: #666; }
        .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 2.5em; letter-spacing: 2px; margin: 1mm 0; }
        .barcode-text { font-family: monospace; font-size: 0.8em; text-align: center; }
        .price { font-weight: bold; font-size: 1.4em; margin-top: 1mm; }
        .location { font-size: 0.8em; color: #888; }
        .qr-placeholder { width: 15mm; height: 15mm; border: 1px solid #000; display: inline-block; text-align: center; line-height: 15mm; font-size: 0.6em; }
      </style></head><body>${Array(copies).fill(printContent).join('<div style="page-break-after: always;"></div>')}</body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const copyZPL = () => {
    // Generate ZPL code for Zebra/compatible thermal printers
    const zpl = `^XA
^CF0,25
^FO20,20^FD${product.name}^FS
${product.sku ? `^CF0,18\n^FO20,50^FDSKU: ${product.sku}^FS` : ''}
${showBarcode && product.barcode ? `^FO20,80^BY2^BCN,60,Y,N,N^FD${product.barcode}^FS` : ''}
${showPrice ? `^CF0,30\n^FO20,160^FD\\u20AC${product.sell_price.toFixed(2)}^FS` : ''}
${showLocation && product.location ? `^CF0,16\n^FO20,200^FD${product.location}${product.shelf ? '/' + product.shelf : ''}^FS` : ''}
^XZ`
    navigator.clipboard.writeText(zpl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[65] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-lg w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Stampa Etichetta</h2>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Preview */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Anteprima Etichetta</h3>
                <div className="flex justify-center">
                  <div ref={printRef} className={`bg-white border-2 border-dashed border-slate-300 rounded-lg p-3 inline-block ${labelSize === 'small' ? 'min-w-[150px]' : labelSize === 'medium' ? 'min-w-[240px]' : 'min-w-[320px]'}`}>
                    <div className="label">
                      <div className="name text-sm font-bold text-slate-800">{product.name}</div>
                      {product.sku && <div className="sku text-[10px] font-mono text-slate-400">SKU: {product.sku}</div>}
                      {product.brand && <div className="text-[10px] text-slate-500">{product.brand} {product.model || ''}</div>}
                      {showBarcode && product.barcode && (
                        <div className="my-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                            <ScanLine className="w-3 h-3" />
                            <span className="font-mono text-[11px] tracking-widest">{product.barcode}</span>
                          </div>
                        </div>
                      )}
                      {showBarcode && product.qr_code && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <QrCode className="w-3 h-3" />
                          <span className="font-mono text-[10px]">{product.qr_code}</span>
                        </div>
                      )}
                      {showPrice && (
                        <div className="price text-base font-bold text-slate-800 mt-1">{'\u20AC'}{product.sell_price.toFixed(2)}</div>
                      )}
                      {showLocation && product.location && (
                        <div className="location text-[9px] text-slate-400 mt-0.5">{product.location}{product.shelf ? `/${product.shelf}` : ''}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Impostazioni</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1">Formato</label>
                    <div className="flex gap-1">
                      {(['small', 'medium', 'large'] as const).map(s => (
                        <button key={s} onClick={() => setLabelSize(s)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${labelSize === s ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-50 text-slate-400 border border-slate-200/60'}`}>
                          {s === 'small' ? '38x25' : s === 'medium' ? '60x40' : '80x50'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1">Copie</label>
                    <input type="number" value={copies} onChange={e => setCopies(Math.max(1, Number(e.target.value)))} min="1" max="100" title="Numero copie"
                      className="w-full px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showBarcode} onChange={e => setShowBarcode(e.target.checked)} className="rounded text-orange-500" />
                    Mostra Barcode/QR
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} className="rounded text-orange-500" />
                    Mostra Prezzo
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showLocation} onChange={e => setShowLocation(e.target.checked)} className="rounded text-orange-500" />
                    Mostra Posizione
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={copyZPL} title="Copia codice ZPL per stampante termica"
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all flex items-center justify-center gap-2">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'ZPL Copiato!' : 'Copia ZPL'}
                </button>
                <button onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />Stampa ({copies} {copies > 1 ? 'copie' : 'copia'})
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
