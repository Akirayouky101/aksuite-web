'use client'

import { motion } from 'framer-motion'
import { 
  Lock, Phone, CheckCircle2, Calendar, TrendingUp, AlertTriangle, 
  Clock, Star, Zap, DollarSign, Target, Activity, ArrowRight, Plus
} from 'lucide-react'

interface Password {
  id: string
  isFavorite?: boolean
}

interface Call {
  id: string
  status: string
  priority: string
  follow_up: boolean
  follow_up_date: string | null
}

interface Task {
  id: string
  status: string
  priority: string
  due_date: string | null
  is_completed: boolean
}

interface Transaction {
  id: string
  type: string
  amount: number
  date: string
}

interface UnifiedDashboardProps {
  passwords: Password[]
  calls: Call[]
  tasks: Task[]
  transactions: Transaction[]
  onOpenPasswords: () => void
  onOpenCalls: () => void
  onOpenTasks: () => void
  onOpenBudget: () => void
  onNewPassword: () => void
  onNewCall: () => void
  onNewTask: () => void
  onNewTransaction: () => void
}

export default function UnifiedDashboard({
  passwords,
  calls,
  tasks,
  transactions,
  onOpenPasswords,
  onOpenCalls,
  onOpenTasks,
  onOpenBudget,
  onNewPassword,
  onNewCall,
  onNewTask,
  onNewTransaction
}: UnifiedDashboardProps) {
  
  // Statistiche Password
  const totalPasswords = passwords.length
  const favoritePasswords = passwords.filter(p => p.isFavorite).length

  // Statistiche Chiamate
  const totalCalls = calls.length
  const pendingCalls = calls.filter(c => c.status === 'pending').length
  const urgentCalls = calls.filter(c => c.priority === 'urgente' && c.status === 'pending').length
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followUpToday = calls.filter(c => {
    if (!c.follow_up || !c.follow_up_date || c.status !== 'pending') return false
    const followUpDate = new Date(c.follow_up_date)
    followUpDate.setHours(0, 0, 0, 0)
    return followUpDate <= today
  }).length

  // Statistiche Task
  const totalTasks = tasks.length
  const activeTasks = tasks.filter(t => !t.is_completed).length
  const completedTasks = tasks.filter(t => t.is_completed).length
  const urgentTasks = tasks.filter(t => t.priority === 'urgente' && !t.is_completed).length
  
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.is_completed) return false
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  }).length

  const tasksTodayDue = tasks.filter(t => {
    if (!t.due_date || t.is_completed) return false
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  }).length

  // Statistiche Budget
  const totalTransactions = transactions.length
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear
  })
  
  const income = monthlyTransactions.filter(t => t.type === 'entrata').reduce((sum, t) => sum + t.amount, 0)
  const expenses = monthlyTransactions.filter(t => t.type === 'uscita').reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expenses

  // Completamento task
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Attività urgenti totali
  const totalUrgent = urgentCalls + urgentTasks + overdueTasks + followUpToday

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-violet-500">
            Dashboard Unificata
          </h1>
          <p className="text-slate-400 mt-1">Panoramica completa di tutte le tue attività</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Oggi</div>
          <div className="text-lg font-bold text-slate-800">
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Alert Urgenti */}
      {totalUrgent > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-rose-200/60 rounded-xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">⚠️ Attenzione Richiesta!</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {urgentCalls > 0 && (
                  <div className="bg-rose-50 border border-red-500/30 rounded-lg px-3 py-2">
                    <div className="text-red-300 font-semibold">{urgentCalls} Chiamate Urgenti</div>
                  </div>
                )}
                {followUpToday > 0 && (
                  <div className="bg-orange-50 border border-orange-500/30 rounded-lg px-3 py-2">
                    <div className="text-orange-300 font-semibold">{followUpToday} Follow-up Oggi</div>
                  </div>
                )}
                {urgentTasks > 0 && (
                  <div className="bg-rose-50 border border-red-500/30 rounded-lg px-3 py-2">
                    <div className="text-red-300 font-semibold">{urgentTasks} Task Urgenti</div>
                  </div>
                )}
                {overdueTasks > 0 && (
                  <div className="bg-rose-50 border border-red-500/30 rounded-lg px-3 py-2">
                    <div className="text-red-300 font-semibold">{overdueTasks} Task Scaduti</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Passwords */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={onOpenPasswords}
          className="bg-gradient-to-br from-rose-50 to-orange-50 border border-orange-200/60 rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-slate-800">{totalPasswords}</span>
          </div>
          <div className="text-sm text-orange-200 font-bold mb-1">Password Salvate</div>
          {favoritePasswords > 0 && (
            <div className="text-xs text-orange-300 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {favoritePasswords} preferite
            </div>
          )}
        </motion.div>

        {/* Calls */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={onOpenCalls}
          className="bg-gradient-to-br from-indigo-50 to-indigo-50 border border-indigo-200/60 rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <Phone className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-slate-800">{totalCalls}</span>
          </div>
          <div className="text-sm text-indigo-500 font-bold mb-1">Chiamate Totali</div>
          <div className="text-xs text-indigo-500">
            {pendingCalls} in attesa
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={onOpenTasks}
          className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200/60 rounded-xl p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-slate-800">{totalTasks}</span>
          </div>
          <div className="text-sm text-purple-200 font-bold mb-1">Task Totali</div>
          <div className="text-xs text-purple-300">
            {activeTasks} attivi
          </div>
        </motion.div>

        {/* Budget */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={onOpenBudget}
          className={`bg-gradient-to-br ${balance >= 0 ? 'from-emerald-50 to-teal-50 border-emerald-200/60' : 'from-rose-50 to-pink-50 border-rose-200/60'} border-2 rounded-xl p-4 cursor-pointer group`}
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className={`w-8 h-8 ${balance >= 0 ? 'text-green-400' : 'text-rose-500'} group-hover:scale-110 transition-transform`} />
            <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}€
            </span>
          </div>
          <div className="text-sm text-slate-600 font-bold mb-1">Bilancio Mensile</div>
          <div className="text-xs text-slate-400">
            {totalTransactions} transazioni
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Azioni Rapide
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewPassword}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg p-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuova Password
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewCall}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg p-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuova Chiamata
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewTask}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg p-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuovo Task
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewTransaction}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg p-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuova Transazione
          </motion.button>
        </div>
      </div>

      {/* Progress & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Progress */}
        <div className="bg-gradient-to-br from-white/70 to-slate-50 border border-violet-200/60 rounded-xl p-5">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Completamento Task
          </h3>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progresso Totale</span>
              <span className="text-base font-bold text-slate-800">{completionRate}%</span>
            </div>
            <div className="h-4 bg-slate-50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="text-purple-300 text-xs mb-1">Attivi</div>
              <div className="text-slate-800 font-bold text-xl">{activeTasks}</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="text-green-300 text-xs mb-1">Completati</div>
              <div className="text-slate-800 font-bold text-xl">{completedTasks}</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-white/70 to-slate-50 border border-indigo-200/60 rounded-xl p-5">
          <h3 className="text-xl font-bold text-indigo-500 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Attività Recenti
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-slate-800 font-semibold">{totalPasswords} Password</div>
                <div className="text-slate-400 text-xs">nel vault</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex-1">
                <div className="text-slate-800 font-semibold">{pendingCalls} Chiamate</div>
                <div className="text-slate-400 text-xs">in attesa di gestione</div>
              </div>
            </div>
            
            {tasksTodayDue > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-800 font-semibold">{tasksTodayDue} Task</div>
                  <div className="text-slate-400 text-xs">in scadenza oggi</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-8 h-8 ${balance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-4 h-4 ${balance >= 0 ? 'text-green-400' : 'text-rose-500'}`} />
              </div>
              <div className="flex-1">
                <div className="text-slate-800 font-semibold">{balance >= 0 ? '+' : ''}{balance.toLocaleString()}€</div>
                <div className="text-slate-400 text-xs">bilancio questo mese</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Focus */}
      {(tasksTodayDue > 0 || followUpToday > 0) && (
        <div className="bg-gradient-to-br from-white/70 to-slate-50 border border-amber-200/60 rounded-xl p-5">
          <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Focus di Oggi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasksTodayDue > 0 && (
              <div className="bg-yellow-50 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-300 font-semibold mb-1">{tasksTodayDue} Task in Scadenza</div>
                <button
                  onClick={onOpenTasks}
                  className="text-sm text-yellow-200 hover:text-yellow-100 flex items-center gap-1 transition-colors"
                >
                  Vai ai task <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {followUpToday > 0 && (
              <div className="bg-orange-50 border border-orange-500/30 rounded-lg p-4">
                <div className="text-orange-300 font-semibold mb-1">{followUpToday} Follow-up da Fare</div>
                <button
                  onClick={onOpenCalls}
                  className="text-sm text-orange-200 hover:text-orange-100 flex items-center gap-1 transition-colors"
                >
                  Vai alle chiamate <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
