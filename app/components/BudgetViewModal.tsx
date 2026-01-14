'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react'

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
}

export default function BudgetViewModal({ isOpen, onClose }: BudgetViewModalProps) {
  // TODO: Caricare da Supabase
  const transactions: Transaction[] = []
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-green-900/50 to-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-green-500/20 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
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

            {/* Transactions List */}
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-slate-400 text-lg">Nessuna transazione salvata</p>
                <p className="text-slate-500 text-sm mt-2">Aggiungi un movimento per iniziare!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">Transazioni recenti</h3>
                {transactions.map((transaction, index) => (
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
                        onClick={() => {
                          // TODO: Implementare eliminazione
                          console.log('Delete', transaction.id)
                        }}
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
