'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Repeat, Calendar } from 'lucide-react'

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
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Transazione Ricorrente</h2>
                  <p className="text-sm text-slate-400">Automatica ogni mese/settimana</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-100 flex items-center justify-center transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-88px)]">
              {/* Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-3">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('income')
                      setCategory('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === 'income'
                        ? 'bg-green-500/20 border-green-500 shadow-lg shadow-indigo-500/25'
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
                        ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/50'
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
                <label className="block text-sm font-semibold text-slate-800 mb-3">Frequenza</label>
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
                <label className="block text-sm font-semibold text-slate-800 mb-3">Categoria</label>
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
                            ? 'bg-green-500/20 border-green-500 shadow-lg'
                            : 'bg-red-500/20 border-red-500 shadow-lg'
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
              <button
                type="submit"
                disabled={isSaving || !amount || !category || !description}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600 text-slate-800 font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvataggio...' : '🔄 Crea Ricorrente'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
