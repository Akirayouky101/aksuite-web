'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, DollarSign, Trash2, Calendar, Filter, BarChart3 } from 'lucide-react'
import BudgetStats from './BudgetStats'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  emoji: string
}

interface BudgetViewModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: Transaction[]
  onDelete: (id: string) => Promise<void>
  stats: {
    totalIncome: number
    totalExpenses: number
    balance: number
  }
}

type DateFilter = 'all' | 'month' | 'quarter' | 'year' | 'custom'
type TypeFilter = 'all' | 'income' | 'expense'

export default function BudgetViewModal({ isOpen, onClose, transactions, onDelete, stats }: BudgetViewModalProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'transactions' | 'stats'>('transactions')
  
  // Filtra le transazioni in base ai filtri attivi
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    const now = new Date()
    
    // Filtro per data
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo)
    } else if (dateFilter === 'quarter') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      filtered = filtered.filter(t => new Date(t.date) >= threeMonthsAgo)
    } else if (dateFilter === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1)
      filtered = filtered.filter(t => new Date(t.date) >= yearStart)
    }
    
    // Filtro per tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter)
    }
    
    // Filtro per categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }
    
    return filtered
  }, [transactions, dateFilter, typeFilter, selectedCategory])
  
  // Calcola le statistiche filtrate
  const filteredStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    }
  }, [filteredTransactions])
  
  // Estrai categorie uniche
  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category))
    return Array.from(cats)
  }, [transactions])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-30" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-green-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Bilancio Completo</h2>
                <p className="text-sm text-slate-400">Tutte le tue transazioni</p>
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                💳 Transazioni
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                📊 Statistiche
              </button>
            </div>

            {activeTab === 'transactions' ? (
              <>
            {/* Filtri */}
            <div className="mb-6 space-y-4">
              {/* Filtro Data */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300 font-semibold">Periodo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '📅 Tutto' },
                    { value: 'month', label: '📆 Questo mese' },
                    { value: 'quarter', label: '📊 Ultimi 3 mesi' },
                    { value: 'year', label: '🗓️ Quest\'anno' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value as DateFilter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dateFilter === option.value
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Tipo */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300 font-semibold">Tipo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '💎 Tutte', color: 'purple' },
                    { value: 'income', label: '💚 Entrate', color: 'green' },
                    { value: 'expense', label: '❤️ Uscite', color: 'red' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTypeFilter(option.value as TypeFilter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === option.value
                          ? `bg-${option.color}-500 text-white shadow-lg shadow-${option.color}-500/50`
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Categoria */}
              {uniqueCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300 font-semibold">Categoria</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🌟 Tutte
                    </button>
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-sm text-green-300">Entrate</span>
                </div>
                <p className="text-3xl font-bold text-white">€{filteredStats.totalIncome.toFixed(2)}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-xl p-6 border border-red-500/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                  <span className="text-sm text-red-300">Uscite</span>
                </div>
                <p className="text-3xl font-bold text-white">€{filteredStats.totalExpenses.toFixed(2)}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br ${
                  filteredStats.balance >= 0
                    ? 'from-blue-500/20 to-cyan-600/20 border-blue-500/30'
                    : 'from-orange-500/20 to-red-600/20 border-orange-500/30'
                } rounded-xl p-6 border`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className={`w-6 h-6 ${filteredStats.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                  <span className={`text-sm ${filteredStats.balance >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>Bilancio</span>
                </div>
                <p className="text-3xl font-bold text-white">€{filteredStats.balance.toFixed(2)}</p>
              </motion.div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-slate-400 text-lg">
                  {transactions.length === 0 
                    ? 'Nessuna transazione salvata'
                    : 'Nessuna transazione con questi filtri'
                  }
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  {transactions.length === 0
                    ? 'Aggiungi un movimento per iniziare!'
                    : 'Prova a cambiare i filtri sopra'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Transazioni ({filteredTransactions.length})
                  </h3>
                  {(dateFilter !== 'all' || typeFilter !== 'all' || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setDateFilter('all')
                        setTypeFilter('all')
                        setSelectedCategory('all')
                      }}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      ✨ Cancella filtri
                    </button>
                  )}
                </div>
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gradient-to-br ${
                      transaction.type === 'income'
                        ? 'from-green-500/10 to-emerald-600/10 border-green-500/30'
                        : 'from-red-500/10 to-rose-600/10 border-red-500/30'
                    } rounded-xl p-4 border flex items-center justify-between group hover:scale-[1.01] transition-transform`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{transaction.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{transaction.description}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">
                            {transaction.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {new Date(transaction.date).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className={`text-2xl font-bold ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                      </p>

                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Elimina transazione"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            </>
            ) : (
              <BudgetStats transactions={transactions} />
            )}
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
