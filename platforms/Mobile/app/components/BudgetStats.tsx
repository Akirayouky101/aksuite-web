'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, PieChart, BarChart3 } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  emoji: string
}

interface BudgetStatsProps {
  transactions: Transaction[]
}

export default function BudgetStats({ transactions }: BudgetStatsProps) {
  // Calcola statistiche mensili
  const monthlyStats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const incomeTrend = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
    const expensesTrend = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0

    return {
      currentIncome,
      currentExpenses,
      currentBalance: currentIncome - currentExpenses,
      incomeTrend,
      expensesTrend,
      transactionCount: currentMonthTransactions.length,
      avgDaily: currentMonthTransactions.length > 0 
        ? currentExpenses / now.getDate()
        : 0
    }
  }, [transactions])

  // Calcola breakdown per categoria
  const categoryBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { total: number; count: number; type: 'income' | 'expense' } } = {}
    
    transactions.forEach(t => {
      if (!breakdown[t.category]) {
        breakdown[t.category] = { total: 0, count: 0, type: t.type }
      }
      breakdown[t.category].total += Number(t.amount)
      breakdown[t.category].count++
    })

    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: (data.total / transactions.reduce((sum, t) => sum + Number(t.amount), 0)) * 100
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) // Top 5 categorie
  }, [transactions])

  return (
    <div className="space-y-6">
      {/* Statistiche mensili */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Statistiche Questo Mese</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Entrate</p>
            <p className="text-2xl font-bold text-green-400">€{monthlyStats.currentIncome.toFixed(0)}</p>
            {monthlyStats.incomeTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${monthlyStats.incomeTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {monthlyStats.incomeTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(monthlyStats.incomeTrend).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Uscite</p>
            <p className="text-2xl font-bold text-red-400">€{monthlyStats.currentExpenses.toFixed(0)}</p>
            {monthlyStats.expensesTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${monthlyStats.expensesTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {monthlyStats.expensesTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(monthlyStats.expensesTrend).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Bilancio</p>
            <p className={`text-2xl font-bold ${monthlyStats.currentBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              €{monthlyStats.currentBalance.toFixed(0)}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs mb-1">Media giornaliera</p>
            <p className="text-2xl font-bold text-cyan-400">€{monthlyStats.avgDaily.toFixed(0)}</p>
            <p className="text-slate-500 text-xs mt-1">{monthlyStats.transactionCount} transazioni</p>
          </div>
        </div>
      </div>

      {/* Top 5 Categorie */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Top 5 Categorie</h3>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((cat, index) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      cat.type === 'income' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{cat.category}</p>
                      <p className="text-slate-500 text-xs">{cat.count} transazioni</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">€{cat.total.toFixed(0)}</p>
                    <p className="text-slate-400 text-xs">{cat.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                
                {/* Barra di progresso */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className={`h-2 rounded-full ${
                      cat.type === 'income'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-400'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Insight rapidi */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-xl p-6 border border-indigo-500/30">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Insight Rapidi</h3>
        </div>

        <div className="space-y-3">
          {monthlyStats.currentExpenses > monthlyStats.currentIncome && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-orange-400 font-medium">⚠️ Attenzione</p>
              <p className="text-slate-300 text-sm mt-1">
                Le tue uscite superano le entrate di €{(monthlyStats.currentExpenses - monthlyStats.currentIncome).toFixed(0)} questo mese
              </p>
            </div>
          )}

          {monthlyStats.incomeTrend > 10 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-medium">✨ Ottimo!</p>
              <p className="text-slate-300 text-sm mt-1">
                Le tue entrate sono aumentate del {monthlyStats.incomeTrend.toFixed(1)}% rispetto al mese scorso
              </p>
            </div>
          )}

          {monthlyStats.expensesTrend < -10 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 font-medium">👏 Bravissimo!</p>
              <p className="text-slate-300 text-sm mt-1">
                Hai ridotto le spese del {Math.abs(monthlyStats.expensesTrend).toFixed(1)}% rispetto al mese scorso
              </p>
            </div>
          )}

          {monthlyStats.currentBalance > 0 && monthlyStats.transactionCount > 5 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-400 font-medium">💪 Continua così!</p>
              <p className="text-slate-300 text-sm mt-1">
                Hai un bilancio positivo di €{monthlyStats.currentBalance.toFixed(0)} questo mese
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
