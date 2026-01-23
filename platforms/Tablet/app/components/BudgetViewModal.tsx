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
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full max-w-6xl mx-auto flex items-stretch"
        >
          {/* Glow effect */}
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-20" />
          
          {/* Main modal */}
          <div className="relative bg-slate-900 rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:my-4 sm:max-h-[95vh] overflow-hidden border-0 sm:border-2 border-green-500/30 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-green-900/30 to-emerald-900/30 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg sm:text-xl md:text-2xl">
                📊
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white">Bilancio</h2>
                <p className="text-xs text-slate-400 hidden md:block">Tutte le tue transazioni</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-3 sm:p-4 md:p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                💳 Transazioni
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
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
            {/* Filtri - Versione ultra compatta */}
            <div className="mb-3 sm:mb-4 md:mb-6 space-y-2 sm:space-y-3">
              {/* Filtro Data */}
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-300 font-semibold">Periodo</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {[
                    { value: 'all', label: '📅 Tutto' },
                    { value: 'month', label: '📆 Mese' },
                    { value: 'quarter', label: '📊 3 mesi' },
                    { value: 'year', label: '🗓️ Anno' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value as DateFilter)}
                      className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
                <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-300 font-semibold">Tipo</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { value: 'all', label: '💎 Tutte', color: 'purple' },
                    { value: 'income', label: '💚 Entrate', color: 'green' },
                    { value: 'expense', label: '❤️ Uscite', color: 'red' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTypeFilter(option.value as TypeFilter)}
                      className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        typeFilter === option.value
                          ? `bg-${option.color}-500 text-white shadow-lg`
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="hidden sm:inline">{option.label}</span>
                      <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro Categoria - Collapsible */}
              {uniqueCategories.length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-1 sm:gap-2 cursor-pointer list-none">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-green-300 font-semibold">Categoria</span>
                    <span className="ml-auto text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Summary Cards - Ultra Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-green-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-1">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-300">Entrate</span>
                </div>
                <p className="text-lg sm:text-xl md:text-3xl font-bold text-white">€{filteredStats.totalIncome.toFixed(2)}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-red-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-1">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-400" />
                  <span className="text-xs sm:text-sm text-red-300">Uscite</span>
                </div>
                <p className="text-lg sm:text-xl md:text-3xl font-bold text-white">€{filteredStats.totalExpenses.toFixed(2)}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br ${
                  filteredStats.balance >= 0
                    ? 'from-blue-500/20 to-cyan-600/20 border-blue-500/30'
                    : 'from-orange-500/20 to-red-600/20 border-orange-500/30'
                } rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-1">
                  <DollarSign className={`w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 ${filteredStats.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                  <span className={`text-xs sm:text-sm ${filteredStats.balance >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>Bilancio</span>
                </div>
                <p className="text-lg sm:text-xl md:text-3xl font-bold text-white">€{filteredStats.balance.toFixed(2)}</p>
              </motion.div>
            </div>

            {/* Transactions List - Ultra Compact Cards */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="text-3xl sm:text-4xl md:text-6xl mb-3 sm:mb-4">💰</div>
                <p className="text-slate-400 text-sm sm:text-base md:text-lg">
                  {transactions.length === 0 
                    ? 'Nessuna transazione salvata'
                    : 'Nessuna transazione con questi filtri'
                  }
                </p>
                <p className="text-slate-500 text-xs sm:text-sm mt-2">
                  {transactions.length === 0
                    ? 'Aggiungi un movimento per iniziare!'
                    : 'Prova a cambiare i filtri sopra'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                  <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-white">
                    Transazioni ({filteredTransactions.length})
                  </h3>
                  {(dateFilter !== 'all' || typeFilter !== 'all' || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setDateFilter('all')
                        setTypeFilter('all')
                        setSelectedCategory('all')
                      }}
                      className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      ✨ Cancella
                    </button>
                  )}
                </div>
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`bg-gradient-to-br ${
                      transaction.type === 'income'
                        ? 'from-green-500/10 to-emerald-600/10 border-green-500/30'
                        : 'from-red-500/10 to-rose-600/10 border-red-500/30'
                    } rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border flex items-center justify-between group hover:scale-[1.01] transition-transform`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="text-xl sm:text-2xl md:text-3xl shrink-0">{transaction.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h4 className="font-semibold text-white text-xs sm:text-sm md:text-base truncate">{transaction.description}</h4>
                          <span className="hidden md:inline text-xs px-2 py-0.5 sm:py-1 rounded-full bg-white/10 text-slate-300 shrink-0">
                            {transaction.category}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 truncate">
                          {new Date(transaction.date).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
                      <p className={`text-base sm:text-lg md:text-2xl font-bold ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                      </p>

                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                        aria-label="Elimina transazione"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400" />
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
