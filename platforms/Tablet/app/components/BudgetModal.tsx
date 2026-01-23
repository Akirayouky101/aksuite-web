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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-green-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bilancio Familiare</h2>
                <p className="text-sm text-slate-400">Gestisci entrate e uscite</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setType('income')
                    setCategory('')
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'income'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${type === 'income' ? 'text-green-400' : 'text-white'}`} />
                  <p className="text-white font-semibold">Entrata</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('expense')
                    setCategory('')
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'expense'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${type === 'expense' ? 'text-red-400' : 'text-white'}`} />
                  <p className="text-white font-semibold">Uscita</p>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Importo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setCategory(cat.name)
                        setEmoji(cat.emoji)
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        category === cat.name
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{cat.emoji}</span>
                      <span className="text-xs text-white">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descrizione</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Es: Spesa al supermercato"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Data transazione"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl py-4 font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
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
