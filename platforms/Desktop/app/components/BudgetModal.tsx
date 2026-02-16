'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, TrendingUp, TrendingDown, Calendar, DollarSign, Tag } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  emoji: string
}

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: any) => Promise<void>
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
  { name: 'Spesa', emoji: '🛒' },
  { name: 'Affitto', emoji: '🏠' },
  { name: 'Bollette', emoji: '⚡' },
  { name: 'Trasporti', emoji: '🚗' },
  { name: 'Ristorazione', emoji: '🍽️' },
  { name: 'Salute', emoji: '💊' },
  { name: 'Intrattenimento', emoji: '🎬' },
  { name: 'Abbigliamento', emoji: '👕' },
  { name: 'Istruzione', emoji: '📚' },
  { name: 'Altro', emoji: '💸' }
]

export default function BudgetModal({ isOpen, onClose, onSave }: BudgetModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [emoji, setEmoji] = useState('💸')
  const [isSaving, setIsSaving] = useState(false)

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        category,
        description,
        date,
        emoji
      })
      
      // Reset form
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setEmoji(type === 'income' ? '💰' : '💸')
      
      onClose()
    } catch (error) {
      console.error('Error saving transaction:', error)
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
          {/* Main modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Bilancio Familiare</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Gestisci entrate e uscite</p>
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
          <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-88px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('income')
                    setCategory('')
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    type === 'income'
                      ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/60 bg-slate-50/80 hover:bg-slate-100/80'
                  }`}
                >
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${type === 'income' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${type === 'income' ? 'text-slate-800' : 'text-slate-500'}`}>Entrata</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('expense')
                    setCategory('')
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    type === 'expense'
                      ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/60 bg-slate-50/80 hover:bg-slate-100/80'
                  }`}
                >
                  <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${type === 'expense' ? 'text-red-500' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${type === 'expense' ? 'text-slate-800' : 'text-slate-500'}`}>Uscita</p>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Importo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div>
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
                      className={`p-3 rounded-xl border transition-all ${
                        category === cat.name
                          ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                          : 'border-slate-200/60 bg-slate-50/80 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="text-xl block mb-1">{cat.emoji}</span>
                      <span className="text-xs text-slate-600">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Descrizione</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  placeholder="Es: Spesa al supermercato"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Data transazione"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
              >
                Salva Movimento
              </motion.button>
            </form>
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
