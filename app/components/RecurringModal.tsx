'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Repeat, Calendar, RefreshCw } from 'lucide-react'

interface RecurringModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recurring: any) => Promise<void>
}

const incomeCategories = [
  { name: 'Stipendio', emoji: '💼' },
  { name: 'Freelance', emoji: '💻' },
  { name: 'Investimenti', emoji: '📈' },
  { name: 'Regalo', emoji: '🎁' },
  { name: 'Bonus', emoji: '🎉' },
  { name: 'Altro', emoji: '💰' }
]

const expenseCategories = [
  { name: 'Affitto', emoji: '🏠' },
  { name: 'Bollette', emoji: '⚡' },
  { name: 'Abbonamenti', emoji: '📱' },
  { name: 'Assicurazione', emoji: '🛡️' },
  { name: 'Prestito', emoji: '🏦' },
  { name: 'Spesa', emoji: '🛒' },
  { name: 'Trasporti', emoji: '🚗' },
  { name: 'Palestra', emoji: '💪' },
  { name: 'Altro', emoji: '💸' }
]

export default function RecurringModal({ isOpen, onClose, onSave }: RecurringModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [emoji, setEmoji] = useState('💰')
  const [isSaving, setIsSaving] = useState(false)

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !description) return

    setIsSaving(true)
    try {
      const now = new Date()
      let nextDate = new Date()

      // Calculate first occurrence
      switch (frequency) {
        case 'daily':
          nextDate.setDate(now.getDate() + 1)
          break
        case 'weekly':
          const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7
          nextDate.setDate(now.getDate() + daysUntilNext)
          break
        case 'monthly':
          nextDate.setMonth(now.getMonth() + 1)
          nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()))
          break
        case 'yearly':
          nextDate.setFullYear(now.getFullYear() + 1)
          nextDate.setDate(dayOfMonth)
          break
      }

      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        description,
        emoji,
        frequency,
        day_of_month: frequency === 'monthly' || frequency === 'yearly' ? dayOfMonth : null,
        day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        next_date: nextDate.toISOString().split('T')[0],
        is_active: true
      })

      // Reset form
      setAmount('')
      setCategory('')
      setDescription('')
      setEmoji('💰')
      setDayOfMonth(1)
      setDayOfWeek(1)
      onClose()
    } catch (error) {
      console.error('Error saving recurring transaction:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  flex items-center justify-center p-4 z-50 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full overflow-x-hidden"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600 rounded-3xl hidden" />
          
          {/* Main modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Transazione Ricorrente</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automatica ogni mese/settimana</p>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-88px)]">
              {/* Type Selection */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('income')
                      setCategory('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === 'income'
                        ? 'bg-emerald-50 border-green-500 shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-100 border-slate-200 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">💚</span>
                    <span className="text-slate-800 font-medium">Entrata</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense')
                      setCategory('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === 'expense'
                        ? 'bg-red-50 border-red-500 shadow-lg shadow-red-200/50'
                        : 'bg-slate-100 border-slate-200 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">❤️</span>
                    <span className="text-slate-800 font-medium">Uscita</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Importo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>

              {/* Frequency */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Frequenza</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'daily', label: '📆 Giornaliera', icon: '📆' },
                    { value: 'weekly', label: '📅 Settimanale', icon: '📅' },
                    { value: 'monthly', label: '🗓️ Mensile', icon: '🗓️' },
                    { value: 'yearly', label: '📊 Annuale', icon: '📊' }
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequency(freq.value as any)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        frequency === freq.value
                          ? 'bg-purple-500 text-slate-800 shadow-lg shadow-indigo-500/25'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Selection */}
              {frequency === 'weekly' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Giorno della settimana</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value={1}>Lunedì</option>
                    <option value={2}>Martedì</option>
                    <option value={3}>Mercoledì</option>
                    <option value={4}>Giovedì</option>
                    <option value={5}>Venerdì</option>
                    <option value={6}>Sabato</option>
                    <option value={0}>Domenica</option>
                  </select>
                </div>
              )}

              {(frequency === 'monthly' || frequency === 'yearly') && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Giorno del mese (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* Category */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setCategory(cat.name)
                        setEmoji(cat.emoji)
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        category === cat.name
                          ? type === 'income'
                            ? 'bg-emerald-50 border-green-500 shadow-lg'
                            : 'bg-red-50 border-red-500 shadow-lg'
                          : 'bg-slate-100 border-slate-200 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{cat.emoji}</span>
                      <span className="text-slate-800 text-xs font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Descrizione</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Es: Stipendio mensile, Affitto, Netflix..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSaving || !amount || !category || !description}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvataggio...' : 'Crea Ricorrente'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
