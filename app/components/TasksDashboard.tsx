'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, Calendar, Clock } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: 'todo' | 'in-progress' | 'completed'
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  tags: string[]
  subtasks: Array<{ id: string; title: string; completed: boolean }>
}

interface TasksDashboardProps {
  tasks: Task[]
}

export default function TasksDashboard({ tasks }: TasksDashboardProps) {
  const totalTasks = tasks.length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const completedTasks = tasks.filter(t => t.is_completed).length
  
  // Tasks scaduti o in scadenza oggi
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.is_completed) return false
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  }).length
  
  const todayTasks = tasks.filter(t => {
    if (!t.due_date || t.is_completed) return false
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  }).length

  // Tasks per categoria
  const tasksByCategory = {
    lavoro: tasks.filter(t => t.category === 'lavoro').length,
    personale: tasks.filter(t => t.category === 'personale').length,
    urgente: tasks.filter(t => t.category === 'urgente').length,
    shopping: tasks.filter(t => t.category === 'shopping').length,
    altro: tasks.filter(t => t.category === 'altro').length,
  }

  // Tasks per priorità
  const tasksByPriority = {
    bassa: tasks.filter(t => t.priority === 'bassa' && !t.is_completed).length,
    media: tasks.filter(t => t.priority === 'media' && !t.is_completed).length,
    alta: tasks.filter(t => t.priority === 'alta' && !t.is_completed).length,
    urgente: tasks.filter(t => t.priority === 'urgente' && !t.is_completed).length,
  }

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const maxCategory = Math.max(...Object.values(tasksByCategory))
  const maxPriority = Math.max(...Object.values(tasksByPriority))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-2 border-teal-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Circle className="w-8 h-8 text-teal-400" />
            <span className="text-lg font-bold text-white">{totalTasks}</span>
          </div>
          <div className="text-sm text-blue-200 font-bold">Totale Task</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-400" />
            <span className="text-lg font-bold text-white">{todoTasks}</span>
          </div>
          <div className="text-sm text-yellow-200 font-bold">Da Fare</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <span className="text-lg font-bold text-white">{inProgressTasks}</span>
          </div>
          <div className="text-sm text-purple-200 font-bold">In Corso</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <span className="text-lg font-bold text-white">{completedTasks}</span>
          </div>
          <div className="text-sm text-green-200 font-bold">Completati</div>
        </motion.div>
      </div>

      {/* Alerts */}
      {(overdueTasks > 0 || todayTasks > 0) && (
        <div className="space-y-3">
          {overdueTasks > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-300" />
                <div>
                  <div className="text-lg font-bold text-white">⚠️ Task Scaduti!</div>
                  <div className="text-red-200">{overdueTasks} task in ritardo</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {todayTasks > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-orange-300" />
                <div>
                  <div className="text-lg font-bold text-white">📅 Task di Oggi</div>
                  <div className="text-orange-200">{todayTasks} task in scadenza oggi</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-cyan-500/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-cyan-300">Completamento Totale</h3>
          <span className="text-lg font-bold text-white">{completionRate}%</span>
        </div>
        <div className="h-6 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
          />
        </div>
        <div className="text-sm text-white/40 mt-2">
          {completedTasks} di {totalTasks} task completati
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks per Categoria */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-purple-500/50 rounded-xl p-5">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Task per Categoria
          </h3>
          <div className="space-y-3">
            {Object.entries(tasksByCategory).map(([category, count]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/50 capitalize">{category}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
                <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${maxCategory > 0 ? (count / maxCategory) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${
                      category === 'lavoro' ? 'bg-blue-500' :
                      category === 'personale' ? 'bg-green-500' :
                      category === 'urgente' ? 'bg-red-500' :
                      category === 'shopping' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks per Priorità */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-orange-500/50 rounded-xl p-5">
          <h3 className="text-xl font-bold text-orange-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Task Attivi per Priorità
          </h3>
          <div className="space-y-3">
            {Object.entries(tasksByPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/50 capitalize">{priority}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
                <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
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
