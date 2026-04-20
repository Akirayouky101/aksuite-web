'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, ScanLine, QrCode, Camera, Upload, Trash2, ImageOff } from 'lucide-react'
import { Product } from '../hooks/useWarehouse'
import { Supplier } from '../hooks/useSuppliers'
import { supabase } from '@/lib/supabase'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Partial<Product>) => void
  editingProduct?: Product | null
  suppliers: Supplier[]
}

export default function ProductModal({ isOpen, onClose, onSave, editingProduct, suppliers }: ProductModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', qr_code: '', category: '', brand: '', model: '',
    description: '', unit: 'pz', quantity: 0, min_quantity: 0, max_quantity: 0,
    purchase_price: 0, sell_price: 0, location: '', shelf: '', supplier_id: '', image_url: '', notes: ''
  })
  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget, setScanTarget] = useState<'barcode' | 'qr_code'>('barcode')
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        barcode: editingProduct.barcode || '',
        qr_code: editingProduct.qr_code || '',
        category: editingProduct.category || '',
        brand: editingProduct.brand || '',
        model: editingProduct.model || '',
        description: editingProduct.description || '',
        unit: editingProduct.unit || 'pz',
        quantity: editingProduct.quantity || 0,
        min_quantity: editingProduct.min_quantity || 0,
        max_quantity: editingProduct.max_quantity || 0,
        purchase_price: editingProduct.purchase_price || 0,
        sell_price: editingProduct.sell_price || 0,
        location: editingProduct.location || '',
        shelf: editingProduct.shelf || '',
        supplier_id: editingProduct.supplier_id || '',
        image_url: editingProduct.image_url || '',
        notes: editingProduct.notes || ''
      })
    } else {
      setForm({ name: '', sku: '', barcode: '', qr_code: '', category: '', brand: '', model: '', description: '', unit: 'pz', quantity: 0, min_quantity: 0, max_quantity: 0, purchase_price: 0, sell_price: 0, location: '', shelf: '', supplier_id: '', image_url: '', notes: '' })
    }
  }, [editingProduct, isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!form.name.trim() || isSaving) return
    setIsSaving(true)
    try {
      await onSave({ ...form, purchase_price: Number(form.purchase_price), sell_price: Number(form.sell_price), quantity: Number(form.quantity), min_quantity: Number(form.min_quantity), max_quantity: Number(form.max_quantity) })
    } finally {
      setIsSaving(false)
    }
    onClose()
  }

  const startScan = (target: 'barcode' | 'qr_code') => {
    setScanTarget(target)
    setShowScanner(true)
  }

  // Simple barcode scanner via BarcodeDetector API
  const handleScanResult = (value: string) => {
    setForm(prev => ({ ...prev, [scanTarget]: value }))
    setShowScanner(false)
  }

  const labelCls = "text-xs font-bold text-slate-500 mb-1"
  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"

  const handleImageUpload = async (file: File) => {
    if (!file) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) { console.error('Image upload error:', error); return }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }))
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const productCategories = ['Materiale Elettrico', 'Cavi', 'Quadri Elettrici', 'Interruttori', 'Illuminazione', 'Networking', 'Server/Storage', 'PC/Notebook', 'Periferiche', 'Accessori', 'Consumabili', 'Software', 'Sicurezza', 'Domotica', 'Automazione', 'Altro']

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full my-8">
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Basic info */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Info Prodotto</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nome Prodotto *</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome prodotto..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>SKU</label>
                    <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SKU..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Categoria</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} title="Categoria prodotto" className={inputCls}>
                      <option value="">Seleziona...</option>
                      {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Marca</label>
                    <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Marca..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Modello</label>
                    <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Modello..." className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Descrizione</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrizione..." rows={2} className={inputCls + ' resize-none'} />
                  </div>
                </div>
              </div>

              {/* Barcode / QR */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ScanLine className="w-3.5 h-3.5" /> Codici Identificativi
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Codice a Barre</label>
                    <div className="relative">
                      <input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="EAN/UPC..." className={inputCls + ' pr-10'} />
                      <button onClick={() => startScan('barcode')} title="Scansiona codice a barre"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-all">
                        <Camera className="w-3.5 h-3.5 text-violet-500" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Codice QR</label>
                    <div className="relative">
                      <input value={form.qr_code} onChange={e => setForm({...form, qr_code: e.target.value})} placeholder="QR Code..." className={inputCls + ' pr-10'} />
                      <button onClick={() => startScan('qr_code')} title="Scansiona QR code"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-all">
                        <QrCode className="w-3.5 h-3.5 text-violet-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scanner overlay */}
              {showScanner && (
                <div className="bg-slate-900/10 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-600 mb-2">
                    {'\u{1F4F7}'} Scansiona {scanTarget === 'barcode' ? 'codice a barre' : 'QR code'}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">Usa il lettore USB o inserisci manualmente il codice</p>
                  <input autoFocus placeholder="Il codice apparir\u00E0 qui..." onKeyDown={e => { if (e.key === 'Enter') handleScanResult((e.target as HTMLInputElement).value) }}
                    className={inputCls + ' text-center font-mono text-lg'} />
                  <button onClick={() => setShowScanner(false)} className="mt-2 text-xs text-slate-400 hover:text-slate-600">Annulla</button>
                </div>
              )}

              {/* Quantities */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quantit\u00E0 e Scorte</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Unit\u00E0</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} title="Unit\u00E0 di misura" className={inputCls}>
                      <option value="pz">Pezzi</option>
                      <option value="mt">Metri</option>
                      <option value="kg">Kg</option>
                      <option value="lt">Litri</option>
                      <option value="conf">Confezione</option>
                      <option value="rotolo">Rotolo</option>
                      <option value="bobina">Bobina</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Quantit\u00E0</label>
                    <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} min="0" title="Quantit\u00E0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Scorta Min</label>
                    <input type="number" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: Number(e.target.value)})} min="0" title="Scorta minima" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Scorta Max</label>
                    <input type="number" value={form.max_quantity} onChange={e => setForm({...form, max_quantity: Number(e.target.value)})} min="0" title="Scorta massima" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Prezzi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Prezzo Acquisto (\u20AC)</label>
                    <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: Number(e.target.value)})} min="0" title="Prezzo acquisto" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Prezzo Vendita (\u20AC)</label>
                    <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({...form, sell_price: Number(e.target.value)})} min="0" title="Prezzo vendita" className={inputCls} />
                  </div>
                </div>
                {form.purchase_price > 0 && form.sell_price > 0 && (
                  <p className="text-xs text-emerald-500 mt-1 font-bold">
                    Margine: {((form.sell_price - form.purchase_price) / form.purchase_price * 100).toFixed(1)}% ({'\u20AC'}{(form.sell_price - form.purchase_price).toFixed(2)})
                  </p>
                )}
              </div>

              {/* Location + Supplier */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Posizione e Fornitore</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Posizione</label>
                    <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Magazzino A..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Scaffale</label>
                    <input value={form.shelf} onChange={e => setForm({...form, shelf: e.target.value})} placeholder="A1-03..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fornitore</label>
                    <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} title="Fornitore principale" className={inputCls}>
                      <option value="">Nessuno</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Foto prodotto */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Foto Prodotto</h3>
                <div className="flex items-start gap-4">
                  {/* Fixed-size frame 80x80 */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image_url} alt="Foto prodotto" className="w-full h-full object-contain" />
                    ) : (
                      <ImageOff className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-600 text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingImage ? 'Caricamento...' : form.image_url ? 'Cambia foto' : 'Carica foto'}
                    </button>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 text-xs font-medium transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Rimuovi foto
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400">JPG, PNG, WebP — max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Note</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Note prodotto..." rows={2} className={inputCls + ' resize-none'} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-all disabled:opacity-40">Annulla</button>
                <button onClick={handleSave} disabled={!form.name.trim() || isSaving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all disabled:opacity-40">
                  {isSaving ? 'Salvataggio...' : editingProduct ? 'Salva Modifiche' : 'Aggiungi Prodotto'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
