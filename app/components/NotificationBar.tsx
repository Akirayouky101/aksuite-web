'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Phone, CheckSquare, Calendar, AlertTriangle, ChevronRight, Clock } from 'lucide-react'

interface NotificationBarProps {
  calls: any[]
  tasks: any[]
  events: any[]
  onOpenCalls?: () => void
  onOpenTasks?: () => void
  onOpenCalendar?: () => void
}

interface Notification {
  id: string
  type: 'call' | 'task' | 'event'
  title: string
  subtitle: string
  icon: any
  gradient: string
  onClick?: () => void
}

export default function NotificationBar({ calls, tasks, events, onOpenCalls, onOpenTasks, onOpenCalendar }: NotificationBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const today = new Date()
  const todayStr = today.toDateString()

  const notifications: Notification[] = []

  // Overdue follow-up calls
  const overdueCalls = calls.filter(c => {
    if (c.status === 'completed' || c.status === 'cancelled') return false
    if (c.follow_up_date) {
      const d = new Date(c.follow_up_date)
      return d < today && d.toDateString() !== todayStr
    }
    return false
  })
  if (overdueCalls.length > 0) {
    notifications.push({
      id: 'overdue-calls',
      type: 'call',
      title: `${overdueCalls.length} richiamat${overdueCalls.length === 1 ? 'a' : 'e'} scadut${overdueCalls.length === 1 ? 'a' : 'e'}`,
      subtitle: overdueCalls.slice(0, 2).map(c => c.caller_name).join(', '),
      icon: Phone,
      gradient: 'from-blue-500 to-indigo-600',
      onClick: onOpenCalls
    })
  }

  // Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (t.is_completed) return false
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d < today && d.toDateString() !== todayStr
  })
  if (overdueTasks.length > 0) {
    notifications.push({
      id: 'overdue-tasks',
      type: 'task',
      title: `${overdueTasks.length} task scadut${overdueTasks.length === 1 ? 'o' : 'i'}`,
      subtitle: overdueTasks.slice(0, 2).map(t => t.title).join(', '),
      icon: CheckSquare,
      gradient: 'from-amber-500 to-orange-600',
      onClick: onOpenTasks
    })
  }

  // Events happening now or in next 30 min
  const upcomingEvents = events.filter(e => {
    const d = new Date(e.start_date)
    const diff = d.getTime() - today.getTime()
    return diff > 0 && diff < 30 * 60 * 1000 // next 30 min
  })
  if (upcomingEvents.length > 0) {
    notifications.push({
      id: 'upcoming-events',
      type: 'event',
      title: `${upcomingEvents.length} event${upcomingEvents.length === 1 ? 'o' : 'i'} tra poco`,
      subtitle: upcomingEvents[0].title,
      icon: Calendar,
      gradient: 'from-rose-500 to-pink-600',
      onClick: onOpenCalendar
    })
  }

  // Pending calls (no follow-up set — forgotten)
  const forgottenCalls = calls.filter(c => c.status === 'pending' && !c.follow_up_date)
  if (forgottenCalls.length >= 3) {
    notifications.push({
      id: 'forgotten-calls',
      type: 'call',
      title: `${forgottenCalls.length} chiamate senza follow-up`,
      subtitle: 'Aggiungi una data di richiamata',
      icon: AlertTriangle,
      gradient: 'from-slate-400 to-slate-600',
      onClick: onOpenCalls
    })
  }

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id))

  if (visibleNotifications.length === 0) return null

  return (
    <div className="mb-4">
      {/* Compact bar */}
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 rounded-xl hover:shadow-md transition-all">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-slate-700">
            {visibleNotifications.length} notific{visibleNotifications.length === 1 ? 'a' : 'he'}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {visibleNotifications.map(n => n.title).join(' • ')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {visibleNotifications.map(n => {
            const Icon = n.icon
            return (
              <div key={n.id} className={`w-6 h-6 rounded-md bg-gradient-to-br ${n.gradient} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
            )
          })}
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded notifications */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 space-y-2">
            {visibleNotifications.map(n => {
              const Icon = n.icon
              return (
                <motion.div key={n.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-3 bg-white/80 border border-slate-200/50 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${n.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                    <p className="text-xs text-slate-400 truncate">{n.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {n.onClick && (
                      <button onClick={n.onClick} title="Vai"
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors">
                        Vai
                      </button>
                    )}
                    <button onClick={() => setDismissed(prev => new Set(prev).add(n.id))} title="Nascondi"
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
