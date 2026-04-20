'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, QrCode, ScanLine, Copy, Check, Layers } from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { Kit } from '../hooks/useKits'

interface LabelPrinterModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  kit?: Kit | null
}

export default function LabelPrinterModal({ isOpen, onClose, product, kit }: LabelPrinterModalProps) {
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showPrice, setShowPrice] = useState(true)
  const [showBarcode, setShowBarcode] = useState(true)
  const [showLocation, setShowLocation] = useState(true)
  const [copies, setCopies] = useState(1)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Determine what we're printing (product or kit)
  const isKit = !!kit && !product
  const displayName = isKit ? kit!.name : product?.name || ''
  const displaySku = isKit ? (kit!.sku || kit!.qr_code?.replace('KIT:', 'K-') || '') : (product?.sku || '')
  const displayQr = isKit ? kit!.qr_code : product?.qr_code
  const displayBarcode = isKit ? null : product?.barcode

  // Generate real QR code using qrcode library
  const generateQr = useCallback(async (text: string) => {
    if (!text) { setQrDataUrl(null); return }
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(text, { width: 120, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
      setQrDataUrl(url)
    } catch (e) {
      console.warn('QR generation error:', e)
      setQrDataUrl(null)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const qrContent = displayQr || displaySku || displayName
    if (qrContent) generateQr(qrContent)
    else setQrDataUrl(null)
  }, [isOpen, displayQr, displaySku, displayName, generateQr])

  const labelSizes = { small: { w: '38mm', h: '25mm', fontSize: '7px' }, medium: { w: '60mm', h: '40mm', fontSize: '9px' }, large: { w: '80mm', h: '50mm', fontSize: '11px' } }
  const size = labelSizes[labelSize]

  if (!isOpen || (!product && !kit)) return null

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=400,height=300')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Etichetta - ${displayName}</title>
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
        img.qr { width: 15mm; height: 15mm; display: block; }
        .kit-badge { font-size: 0.7em; background: #7c3aed; color: white; padding: 0.5mm 2mm; border-radius: 2mm; display: inline-block; margin-bottom: 1mm; }
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
${isKit ? `^CF0,16\n^FO20,10^FDKIT^FS` : ''}
^CF0,25
^FO20,${isKit ? 30 : 20}^FD${displayName}^FS
${displaySku ? `^CF0,18\n^FO20,${isKit ? 55 : 50}^FDSKU: ${displaySku}^FS` : ''}
${showBarcode && displayBarcode ? `^FO20,80^BY2^BCN,60,Y,N,N^FD${displayBarcode}^FS` : ''}
${!isKit && showPrice && product ? `^CF0,30\n^FO20,160^FD\\u20AC${product.sell_price.toFixed(2)}^FS` : ''}
${showLocation && !isKit && product?.location ? `^CF0,16\n^FO20,200^FD${product.location}${product.shelf ? '/' + product.shelf : ''}^FS` : ''}
${displayQr ? `^FO120,10^BQN,2,4^FDQA,${displayQr}^FS` : ''}
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isKit ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25' : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/25'}`}>
                  {isKit ? <Layers className="w-5 h-5 text-white" /> : <Printer className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Stampa Etichetta</h2>
                  {isKit && <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">KIT</span>}
                </div>
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
                      {isKit && <div className="inline-block bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded mb-1">KIT</div>}
                      <div className="name text-sm font-bold text-slate-800">{displayName}</div>
                      {displaySku && <div className="sku text-[10px] font-mono text-slate-400">SKU: {displaySku}</div>}
                      {!isKit && product?.brand && <div className="text-[10px] text-slate-500">{product.brand} {product.model || ''}</div>}
                      {isKit && kit?.description && <div className="text-[10px] text-slate-400 mt-0.5">{kit.description}</div>}
                      {showBarcode && displayBarcode && (
                        <div className="my-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                            <ScanLine className="w-3 h-3" />
                            <span className="font-mono text-[11px] tracking-widest">{displayBarcode}</span>
                          </div>
                        </div>
                      )}
                      {showBarcode && (
                        <div className="flex items-center gap-2 mt-1">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="QR" className="w-14 h-14 flex-shrink-0" />
                          ) : (displayQr || displaySku) ? (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <QrCode className="w-3 h-3" />
                              <span className="font-mono text-[10px]">{displayQr || displaySku}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                      {!isKit && showPrice && product && (
                        <div className="price text-base font-bold text-slate-800 mt-1">{'\u20AC'}{product.sell_price.toFixed(2)}</div>
                      )}
                      {!isKit && showLocation && product?.location && (
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
                    Mostra QR/Barcode
                  </label>
                  {!isKit && (
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} className="rounded text-orange-500" />
                    Mostra Prezzo
                  </label>
                  )}
                  {!isKit && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showLocation} onChange={e => setShowLocation(e.target.checked)} className="rounded text-orange-500" />
                    Mostra Posizione
                  </label>
                  )}
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
                  className={`flex-1 py-3 rounded-xl text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${isKit ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-violet-500/25' : 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/25'}`}>
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
