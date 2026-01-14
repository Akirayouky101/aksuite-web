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

export default function BudgetModal({ isOpen, onClose }: BudgetModalProps) {
  const [view, setView] = useState<'overview' | 'add' | 'list'>('overview')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [emoji, setEmoji] = useState('💸')

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Salvare in Supabase
    console.log({ type, amount, category, description, date, emoji })
    setView('overview')
  }

  const totalIncome = 5420 // TODO: Calcolare da Supabase
  const totalExpenses = 3250 // TODO: Calcolare da Supabase
  const balance = totalIncome - totalExpenses

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/20 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
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
            {view === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                      <span className="text-sm text-green-300">Entrate</span>
                    </div>
                    <p className="text-3xl font-bold text-white">€{totalIncome.toFixed(2)}</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-xl p-6 border border-red-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingDown className="w-6 h-6 text-red-400" />
                      <span className="text-sm text-red-300">Uscite</span>
                    </div>
                    <p className="text-3xl font-bold text-white">€{totalExpenses.toFixed(2)}</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`bg-gradient-to-br ${
                      balance >= 0
                        ? 'from-blue-500/20 to-cyan-600/20 border-blue-500/30'
                        : 'from-orange-500/20 to-red-600/20 border-orange-500/30'
                    } rounded-xl p-6 border`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className={`w-6 h-6 ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                      <span className={`text-sm ${balance >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>Bilancio</span>
                    </div>
                    <p className="text-3xl font-bold text-white">€{balance.toFixed(2)}</p>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('add')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 font-semibold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    Nuova Transazione
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('list')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-6 font-semibold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    <Calendar className="w-6 h-6" />
                    Storico
                  </motion.button>
                </div>
              </div>
            )}

            {view === 'add' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  ← Indietro
                </button>

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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            ? 'border-purple-500 bg-purple-500/20'
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-4 font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  Salva Transazione
                </motion.button>
              </form>
            )}

            {view === 'list' && (
              <div>
                <button
                  onClick={() => setView('overview')}
                  className="text-purple-400 hover:text-purple-300 text-sm mb-4"
                >
                  ← Indietro
                </button>
                <p className="text-center text-slate-400 py-12">
                  Nessuna transazione salvata. Aggiungine una per iniziare!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
