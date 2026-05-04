'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronLeft, ChevronRight, Plus, Edit, Trash2, 
  Calendar as CalendarIcon, MapPin, Clock, Repeat, CheckCircle2, Users, User
} from 'lucide-react'
import { Event } from '../hooks/useEvents'
import { Task } from '../hooks/useTasks'

interface CalendarViewProps {
  isOpen: boolean
  onClose: () => void
  events: Event[]
  tasks?: Task[]
  onDelete: (id: string) => void
  onEdit: (event: Event) => void
  onAdd: () => void
  isAdmin?: boolean
  currentUserId?: string
  managedUsers?: { id: string; full_name: string; email: string }[]
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

const COLOR_DOTS: Record<string, string> = {
  blue: 'bg-blue-400', green: 'bg-green-400', red: 'bg-red-400',
  purple: 'bg-purple-400', orange: 'bg-orange-400', pink: 'bg-pink-400',
  yellow: 'bg-yellow-400', gray: 'bg-slate-400'
}

const COLOR_BORDER: Record<string, string> = {
  blue: 'border-blue-400 bg-blue-50 text-blue-700',
  green: 'border-green-400 bg-green-50 text-green-700',
  red: 'border-red-400 bg-red-50 text-red-700',
  purple: 'border-purple-400 bg-violet-50 text-violet-700',
  orange: 'border-orange-400 bg-orange-50 text-orange-700',
  pink: 'border-pink-400 bg-pink-50 text-pink-700',
  yellow: 'border-yellow-400 bg-amber-50 text-amber-700',
  gray: 'border-slate-300 bg-slate-50 text-slate-600'
}

export default function CalendarView({
  isOpen, onClose, events, tasks = [], onDelete, onEdit, onAdd,
  isAdmin = false, currentUserId, managedUsers = []
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [filterUserId, setFilterUserId] = useState<string>('all')

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Filter events by selected user (admin only)
  const filteredEvents = useMemo(() => {
    if (!isAdmin || filterUserId === 'all') return events
    if (filterUserId === 'mine') return events.filter(e => e.user_id === currentUserId && !e.assigned_to)
    return events.filter(e => e.user_id === filterUserId || e.assigned_to === filterUserId)
  }, [events, filterUserId, isAdmin, currentUserId])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(currentYear, currentMonth, i))
    return days
  }, [currentYear, currentMonth])

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      const dateStart = new Date(date); dateStart.setHours(0,0,0,0)
      const dateEnd = new Date(date); dateEnd.setHours(23,59,59,999)
      return (eventStart >= dateStart && eventStart <= dateEnd) ||
             (eventEnd >= dateStart && eventEnd <= dateEnd) ||
             (eventStart <= dateStart && eventEnd >= dateEnd)
    })
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      const ds = new Date(date); ds.setHours(0,0,0,0)
      const de = new Date(date); de.setHours(23,59,59,999)
      return taskDate >= ds && taskDate <= de
    })
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const isToday = (date: Date | null) => {
    if (!date) return false
    const t = new Date()
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
  }

  const formatTime = (s: string) => new Date(s).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const formatEventDate = (event: Event) => {
    if (event.all_day) return 'Tutto il giorno'
    return event.end_date
      ? `${formatTime(event.start_date)} - ${formatTime(event.end_date)}`
      : formatTime(event.start_date)
  }

  const getUserName = (uid: string | null | undefined) => {
    if (!uid) return null
    const u = managedUsers.find(u => u.id === uid)
    return u ? (u.full_name || u.email) : null
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col border border-white/60 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Calendario</h2>
                  <p className="text-xs text-slate-400">{filteredEvents.length} eventi</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Admin: filtro utente */}
                {isAdmin && managedUsers.length > 0 && (
                  <select
                    value={filterUserId}
                    onChange={e => setFilterUserId(e.target.value)}
                    className="text-sm px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="all">👥 Tutti gli utenti</option>
                    <option value="mine">🙋 Solo miei</option>
                    {managedUsers.map(u => (
                      <option key={u.id} value={u.id}>👤 {u.full_name || u.email}</option>
                    ))}
                  </select>
                )}

                {/* Navigazione mese */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 px-2 min-w-[120px] text-center">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}
                  className="text-sm px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200/60 rounded-xl font-medium hover:bg-indigo-100 transition-all">
                  Oggi
                </button>

                <button onClick={onAdd}
                  className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95 transition-all flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Nuovo Evento
                </button>

                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Griglia calendario */}
            <div className="flex-1 p-4 sm:p-6 overflow-auto">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`e-${i}`} />
                  const dayEvents = getEventsForDate(date)
                  const dayTasks = getTasksForDate(date)
                  const isSelected = selectedDate &&
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear()
                  const today = isToday(date)

                  return (
                    <button key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[60px] sm:min-h-[72px] rounded-xl p-1.5 text-left transition-all border ${
                        today
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent text-white shadow-lg shadow-indigo-500/30'
                          : isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white/60 border-slate-200/60 text-slate-700 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <span className={`text-xs font-bold block mb-1 ${today ? 'text-white' : ''}`}>{date.getDate()}</span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className={`text-[9px] truncate rounded px-1 font-medium ${
                            today ? 'bg-white/20 text-white' : (COLOR_DOTS[ev.color] || '').replace('bg-', 'bg-').replace('-400', '-100') + ' text-slate-600'
                          }`}>
                            {ev.assigned_to && !today && <span className="inline-block w-1 h-1 rounded-full bg-amber-500 mr-0.5 mb-0.5 align-middle" title={`Assegnato a ${ev.assigned_to_name}`} />}
                            {ev.is_shared && !today && <span className="inline-block w-1 h-1 rounded-full bg-teal-500 mr-0.5 mb-0.5 align-middle" title="Condiviso" />}
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className={`text-[9px] font-medium ${today ? 'text-white/70' : 'text-slate-400'}`}>+{dayEvents.length - 2}</div>
                        )}
                        {dayTasks.length > 0 && (
                          <div className={`text-[9px] ${today ? 'text-white/70' : 'text-violet-500'}`}>✓ {dayTasks.length} task</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Legenda */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Assegnato</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Condiviso</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-400 inline-block" /> Task</span>
              </div>
            </div>

            {/* Pannello dettaglio giorno */}
            <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col flex-shrink-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800">
                  {selectedDate
                    ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                    : 'Seleziona una data'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDateEvents.length} eventi · {selectedDateTasks.length} task
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedDate && selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && (
                  <div className="text-center py-10">
                    <CalendarIcon className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Nessun evento</p>
                    <button onClick={onAdd} className="mt-4 text-xs px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                      + Aggiungi evento
                    </button>
                  </div>
                )}

                {/* Events */}
                {selectedDateEvents.map(event => (
                  <div key={event.id} className={`border-l-4 rounded-xl p-3 ${COLOR_BORDER[event.color] || COLOR_BORDER.blue}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold leading-tight">{event.title}</p>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => onEdit(event)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 transition-all">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => { if (confirm('Eliminare questo evento?')) onDelete(event.id) }}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {event.description && <p className="text-xs opacity-70 mb-1.5 leading-relaxed">{event.description}</p>}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatEventDate(event)}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                      {event.is_recurring && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" />Ricorrente</span>}
                    </div>

                    {/* Assegnazione */}
                    {(event.assigned_to || event.is_shared) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {event.assigned_to && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            <User className="w-2.5 h-2.5" />
                            {event.assigned_to_name || getUserName(event.assigned_to) || 'Utente'}
                          </span>
                        )}
                        {event.is_shared && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            <Users className="w-2.5 h-2.5" />
                            Condiviso
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Tasks */}
                {selectedDateTasks.map(task => (
                  <div key={task.id} className={`border-l-4 rounded-xl p-3 ${
                    task.is_completed ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                    task.priority === 'urgent' || task.priority === 'high' ? 'border-red-400 bg-red-50 text-red-700' :
                    'border-violet-400 bg-violet-50 text-violet-700'
                  }`}>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${task.is_completed ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${task.is_completed ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                        {task.description && <p className="text-xs opacity-70 mt-0.5">{task.description}</p>}
                        <span className="inline-block text-[10px] mt-1 opacity-60 capitalize">{task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '🔵'} {task.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

