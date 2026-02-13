'use client'

import { motion } from 'framer-motion'
import { Phone, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react'

interface Call {
  id: string
  caller_name: string
  company: string
  phone: string
  email: string
  call_type: string
  priority: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  call_date: string
}

interface CallsDashboardProps {
  calls: Call[]
}

export default function CallsDashboard({ calls }: CallsDashboardProps) {
  // Statistiche generali
  const totalCalls = calls.length
  const pendingCalls = calls.filter(c => c.status === 'pending').length
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const urgentCalls = calls.filter(c => c.priority === 'urgente' && c.status === 'pending').length

  // Follow-up oggi o scaduti
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followUpToday = calls.filter(c => {
    if (!c.follow_up || !c.follow_up_date || c.status !== 'pending') return false
    const followUpDate = new Date(c.follow_up_date)
    followUpDate.setHours(0, 0, 0, 0)
    return followUpDate <= today
  }).length

  // Statistiche per tipo
  const callsByType = {
    informazioni: calls.filter(c => c.call_type === 'informazioni').length,
    assistenza: calls.filter(c => c.call_type === 'assistenza').length,
    vendita: calls.filter(c => c.call_type === 'vendita').length,
    reclamo: calls.filter(c => c.call_type === 'reclamo').length,
    altro: calls.filter(c => c.call_type === 'altro').length,
  }

  // Statistiche per priorità
  const callsByPriority = {
    bassa: calls.filter(c => c.priority === 'bassa').length,
    media: calls.filter(c => c.priority === 'media').length,
    alta: calls.filter(c => c.priority === 'alta').length,
    urgente: calls.filter(c => c.priority === 'urgente').length,
  }

  const maxType = Math.max(...Object.values(callsByType))
  const maxPriority = Math.max(...Object.values(callsByPriority))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-indigo-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Phone className="w-8 h-8 text-indigo-400" />
            <span className="text-lg font-bold text-slate-800">{totalCalls}</span>
          </div>
          <div className="text-sm text-blue-200 font-bold">Totale Chiamate</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-400" />
            <span className="text-lg font-bold text-slate-800">{pendingCalls}</span>
          </div>
          <div className="text-sm text-yellow-200 font-bold">In Attesa</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-lg font-bold text-slate-800">{completedCalls}</span>
          </div>
          <div className="text-sm text-green-200 font-bold">Completate</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-red-900/50 to-pink-50 border-2 border-red-500/50 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <span className="text-lg font-bold text-slate-800">{urgentCalls}</span>
          </div>
          <div className="text-sm text-red-200 font-bold">Urgenti</div>
        </motion.div>
      </div>

      {/* Follow-up Alert */}
      {followUpToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-orange-300" />
            <div>
              <div className="text-lg font-bold text-slate-800">⏰ Follow-up da fare oggi!</div>
              <div className="text-orange-200">{followUpToday} chiamate da richiamare</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chiamate per Tipo */}
        <div className="bg-gradient-to-br from-white to-slate-900/90 border-2 border-purple-500/50 rounded-xl p-5">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Chiamate per Tipo
          </h3>
          <div className="space-y-3">
            {Object.entries(callsByType).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 capitalize">{type}</span>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${maxType > 0 ? (count / maxType) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${
                      type === 'informazioni' ? 'bg-blue-500' :
                      type === 'assistenza' ? 'bg-orange-500' :
                      type === 'vendita' ? 'bg-green-500' :
                      type === 'reclamo' ? 'bg-red-500' :
                      'bg-purple-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chiamate per Priorità */}
        <div className="bg-gradient-to-br from-white to-slate-900/90 border-2 border-indigo-300 rounded-xl p-5">
          <h3 className="text-xl font-bold text-indigo-500 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Chiamate per Priorità
          </h3>
          <div className="space-y-3">
            {Object.entries(callsByPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400 capitalize">{priority}</span>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${maxPriority > 0 ? (count / maxPriority) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${
                      priority === 'bassa' ? 'bg-green-500' :
                      priority === 'media' ? 'bg-yellow-500' :
                      priority === 'alta' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
