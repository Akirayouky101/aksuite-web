'use client'

import { Phone, Wrench, CheckSquare, Calendar, MapPin, Clock, AlertTriangle, ArrowRight, Zap, Sun } from 'lucide-react'

interface TodayDashboardProps {
  calls: any[]
  lavorazioni: any[]
  tasks: any[]
  events: any[]
  visits: any[]
  onOpenCall?: (call: any) => void
  onOpenLavorazione?: (lav: any) => void
  onOpenTasksList?: () => void
  onOpenCalendar?: () => void
  onOpenVisitsList?: () => void
}

export default function TodayDashboard({ calls, lavorazioni, tasks, events, visits, onOpenCall, onOpenLavorazione, onOpenTasksList, onOpenCalendar, onOpenVisitsList }: TodayDashboardProps) {
  const today = new Date()
  const todayStr = today.toDateString()

  // Pending + in_corso calls (follow-ups for today)
  const todayCalls = calls.filter(c => {
    if (c.status === 'completed' || c.status === 'cancelled') return false
    if (c.follow_up_date) {
      const fDate = new Date(c.follow_up_date)
      return fDate.toDateString() === todayStr || fDate < today
    }
    return c.status === 'pending' || c.status === 'in_corso'
  }).slice(0, 5)

  // Today's events
  const todayEvents = events.filter(e => {
    const d = new Date(e.start_date)
    return d.toDateString() === todayStr
  })

  // Overdue tasks + today due
  const overdueTasks = tasks.filter(t => {
    if (t.is_completed) return false
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d.toDateString() === todayStr || d < today
  }).slice(0, 5)

  // Active lavorazioni (in_corso or da_fare)
  const activeLav = lavorazioni.filter(l => l.status === 'da_fare' || l.status === 'in_corso').slice(0, 4)

  // Today's visits
  const todayVisits = visits.filter(v => {
    if (!v.scheduled_date) return false
    const d = new Date(v.scheduled_date)
    return d.toDateString() === todayStr
  })

  const totalItems = todayCalls.length + todayEvents.length + overdueTasks.length + activeLav.length + todayVisits.length
  if (totalItems === 0) return null

  const formatTime = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  const isOverdue = (dateStr: string) => {
    const d = new Date(dateStr)
    return d < today && d.toDateString() !== todayStr
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 border border-indigo-200/40 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-indigo-100/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Sun className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-sm">Panoramica Oggi</h3>
            <p className="text-slate-400 text-[11px]">{today.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueTasks.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-semibold">
              <AlertTriangle className="w-3 h-3" />{overdueTasks.filter(t => isOverdue(t.due_date)).length} scaduti
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
            <Zap className="w-3 h-3" />{totalItems} elementi
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Follow-up Calls */}
        {todayCalls.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-blue-50/50 border-b border-blue-100/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1.5">
                <Phone className="w-3 h-3" />Chiamate ({todayCalls.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100/60">
              {todayCalls.map(c => (
                <button key={c.id} onClick={() => onOpenCall?.(c)} className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/30 transition-colors flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{c.caller_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{c.company || c.phone}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Today Events */}
        {todayEvents.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-rose-50/50 border-b border-rose-100/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />Eventi Oggi ({todayEvents.length})
              </span>
              <button onClick={onOpenCalendar} className="text-[10px] text-rose-500 hover:text-rose-700 font-medium">Vedi</button>
            </div>
            <div className="divide-y divide-slate-100/60">
              {todayEvents.slice(0, 4).map(e => (
                <div key={e.id} className="px-3.5 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{e.title}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{formatTime(e.start_date)}
                      {e.location && <span className="truncate"> - {e.location}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue / Today Tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-amber-50/50 border-b border-amber-100/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3" />Task da fare ({overdueTasks.length})
              </span>
              <button onClick={onOpenTasksList} className="text-[10px] text-amber-500 hover:text-amber-700 font-medium">Tutti</button>
            </div>
            <div className="divide-y divide-slate-100/60">
              {overdueTasks.map(t => (
                <div key={t.id} className="px-3.5 py-2.5 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue(t.due_date) ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                    {isOverdue(t.due_date) ? <AlertTriangle className="w-3 h-3 text-white" /> : <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{t.title}</p>
                    <p className={`text-[10px] flex items-center gap-1 ${isOverdue(t.due_date) ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {isOverdue(t.due_date) ? 'Scaduto' : 'Oggi'} - {new Date(t.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Lavorazioni */}
        {activeLav.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-violet-50/50 border-b border-violet-100/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-violet-600 flex items-center gap-1.5">
                <Wrench className="w-3 h-3" />Lavorazioni ({activeLav.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100/60">
              {activeLav.map(l => (
                <button key={l.id} onClick={() => onOpenLavorazione?.(l)} className="w-full px-3.5 py-2.5 text-left hover:bg-violet-50/30 transition-colors flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${l.status === 'in_corso' ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{l.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {l.status === 'in_corso' ? 'In corso' : 'Da fare'}{l.assigned_to ? ` - ${l.assigned_to}` : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Today Visits */}
        {todayVisits.length > 0 && (
          <div className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-indigo-50/50 border-b border-indigo-100/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />Visite Oggi ({todayVisits.length})
              </span>
              <button onClick={onOpenVisitsList} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">Tutte</button>
            </div>
            <div className="divide-y divide-slate-100/60">
              {todayVisits.slice(0, 3).map(v => (
                <div key={v.id} className="px-3.5 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{v.visitor_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{v.company || v.visit_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
