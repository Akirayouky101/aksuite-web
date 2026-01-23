'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

interface BudgetLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (limit: any) => Promise<void>
  existingCategories?: string[]
}

const commonCategories = [
  { name: 'Spesa', emoji: '🛒', suggested: 400 },
  { name: 'Affitto', emoji: '🏠', suggested: 800 },
  { name: 'Bollette', emoji: '⚡', suggested: 150 },
  { name: 'Trasporti', emoji: '🚗', suggested: 200 },
  { name: 'Ristorazione', emoji: '🍕', suggested: 300 },
  { name: 'Salute', emoji: '💊', suggested: 100 },
  { name: 'Intrattenimento', emoji: '🎬', suggested: 150 },
  { name: 'Abbigliamento', emoji: '👔', suggested: 100 },
  { name: 'Istruzione', emoji: '📚', suggested: 200 },
  { name: 'Abbonamenti', emoji: '📱', suggested: 50 }
]

export default function BudgetLimitModal({ 
  isOpen, 
  onClose, 
  onSave,
  existingCategories = []
}: BudgetLimitModalProps) {
  const [category, setCategory] = useState('')
  const [limitAmount, setLimitAmount] = useState('')
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !limitAmount) return

    setIsSaving(true)
    try {
      await onSave({
        category,
        limit_amount: parseFloat(limitAmount),
        period,
        alert_threshold: alertThreshold,
        is_active: true
      })

      // Reset form
      setCategory('')
      setLimitAmount('')
      setPeriod('monthly')
      setAlertThreshold(80)
      onClose()
    } catch (error) {
      console.error('Error saving budget limit:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCategorySelect = (cat: typeof commonCategories[0]) => {
    setCategory(cat.name)
    if (!limitAmount) {
      setLimitAmount(cat.suggested.toString())
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-orange-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-900/30 to-red-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Limite Budget</h2>
                  <p className="text-sm text-slate-400">Imposta un tetto massimo di spesa</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">Categoria</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonCategories.map((cat) => {
                    const isDisabled = existingCategories.includes(cat.name)
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => !isDisabled && handleCategorySelect(cat)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          category === cat.name
                            ? 'bg-orange-500/20 border-orange-500 shadow-lg'
                            : isDisabled
                            ? 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{cat.emoji}</span>
                        <span className="text-white text-xs font-medium">{cat.name}</span>
                        {isDisabled && (
                          <span className="text-[10px] text-slate-500 block mt-1">✓ Già impostato</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Period */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">Periodo</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'daily', label: '📆 Giorno', desc: 'al giorno' },
                    { value: 'weekly', label: '📅 Settimana', desc: 'a settimana' },
                    { value: 'monthly', label: '🗓️ Mese', desc: 'al mese' },
                    { value: 'yearly', label: '📊 Anno', desc: "all'anno" }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPeriod(p.value as any)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        period === p.value
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[10px] opacity-70">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">Limite Massimo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-2xl font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <p className="text-slate-400 text-xs mt-2">
                  Massimo che puoi spendere in questa categoria {period === 'daily' ? 'al giorno' : period === 'weekly' ? 'a settimana' : period === 'monthly' ? 'al mese' : "all'anno"}
                </p>
              </div>

              {/* Alert Threshold */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-white">Soglia di Allerta</label>
                  <span className="text-orange-400 font-bold">{alertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50%</span>
                  <span>95%</span>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Ti avviseremo quando raggiungi il <span className="text-orange-400 font-bold">{alertThreshold}%</span> del limite
                </p>
              </div>

              {/* Preview */}
              {category && limitAmount && (
                <div className="mb-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-300 font-medium mb-1">Anteprima</p>
                      <p className="text-slate-300 text-sm">
                        Limite di <span className="text-white font-bold">€{parseFloat(limitAmount).toFixed(2)}</span> per{' '}
                        <span className="text-white font-bold">{category}</span>{' '}
                        {period === 'daily' ? 'al giorno' : period === 'weekly' ? 'a settimana' : period === 'monthly' ? 'al mese' : "all'anno"}.
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Alert a €{(parseFloat(limitAmount) * alertThreshold / 100).toFixed(2)} ({alertThreshold}%)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving || !category || !limitAmount}
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvataggio...' : '⚠️ Imposta Limite'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
