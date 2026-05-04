'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Plus, Edit, Trash2,
  Calendar as CalendarIcon, MapPin, Clock, Repeat,
  CheckCircle2, Users, User
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

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]
const MONTHS_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

const EV_PILL: Record<string, string> = {
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  pink:   'bg-pink-500',
  yellow: 'bg-amber-400',
  gray:   'bg-slate-400',
}

interface ColorSet { bg: string; border: string; text: string; badge: string }
const EV_CARD: Record<string, ColorSet> = {
  blue:   { bg: 'bg-blue-50',    border: 'border-blue-400',   text: 'text-blue-700',   badge: 'bg-blue-500' },
  green:  { bg: 'bg-emerald-50', border: 'border-emerald-400',text: 'text-emerald-700',badge: 'bg-emerald-500' },
  red:    { bg: 'bg-red-50',     border: 'border-red-400',    text: 'text-red-700',    badge: 'bg-red-500' },
  purple: { bg: 'bg-violet-50',  border: 'border-violet-400', text: 'text-violet-700', badge: 'bg-violet-500' },
  orange: { bg: 'bg-orange-50',  border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-500' },
  pink:   { bg: 'bg-pink-50',    border: 'border-pink-400',   text: 'text-pink-700',   badge: 'bg-pink-500' },
  yellow: { bg: 'bg-amber-50',   border: 'border-amber-400',  text: 'text-amber-700',  badge: 'bg-amber-400' },
  gray:   { bg: 'bg-slate-50',   border: 'border-slate-300',  text: 'text-slate-600',  badge: 'bg-slate-400' },
}
const FB = EV_CARD.blue
const USER_COLORS = ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'yellow', 'gray']

export default function CalendarView({
  isOpen, onClose, events, tasks = [], onDelete, onEdit, onAdd,
  isAdmin = false, currentUserId, managedUsers = []
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  useEffect(() => {
    if (!selectedEvent) return
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedEvent(null); setPopupPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectedEvent])

  const filteredEvents = useMemo(() => {
    if (!isAdmin || filterUserId === 'all') return events
    if (filterUserId === 'mine') return events.filter(e => e.user_id === currentUserId && !e.assigned_to)
    return events.filter(e => e.user_id === filterUserId || e.assigned_to === filterUserId)
  }, [events, filterUserId, isAdmin, currentUserId])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(currentYear, currentMonth, i))
    while (days.length < 42) days.push(null)
    return days
  }, [currentYear, currentMonth])

  const userColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    managedUsers.forEach((u, i) => { map[u.id] = USER_COLORS[i % USER_COLORS.length] })
    return map
  }, [managedUsers])

  const getEvColor = (ev: Event): string => {
    if (filterUserId === 'all' && managedUsers.length > 0 && ev.user_id) {
      return userColorMap[ev.user_id] || ev.color || 'blue'
    }
    return ev.color || 'blue'
  }

  const getEventsForDate = (date: Date) => filteredEvents.filter(ev => {
    const s = new Date(ev.start_date)
    const e = ev.end_date ? new Date(ev.end_date) : s
    const ds = new Date(date); ds.setHours(0,0,0,0)
    const de = new Date(date); de.setHours(23,59,59,999)
    return (s >= ds && s <= de) || (e >= ds && e <= de) || (s <= ds && e >= de)
  })

  const getTasksForDate = (date: Date) => tasks.filter(t => {
    if (!t.due_date) return false
    const td = new Date(t.due_date)
    const ds = new Date(date); ds.setHours(0,0,0,0)
    const de = new Date(date); de.setHours(23,59,59,999)
    return td >= ds && td <= de
  })

  const selectedDateEvents = getEventsForDate(selectedDate)
  const selectedDateTasks = getTasksForDate(selectedDate)

  const isToday = (d: Date | null) => {
    if (!d) return false
    const t = new Date()
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
  }
  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  const fmt = (s: string) => new Date(s).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const fmtEvDate = (ev: Event) => {
    if (ev.all_day) return 'Tutto il giorno'
    return ev.end_date ? `${fmt(ev.start_date)} \u2192 ${fmt(ev.end_date)}` : fmt(ev.start_date)
  }
  const fmtFullDate = (s: string) => {
    const d = new Date(s)
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  const getUserName = (uid?: string | null) => {
    if (!uid) return null
    const u = managedUsers.find(u => u.id === uid)
    return u ? (u.full_name || u.email) : null
  }

  const openPopup = (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cont = containerRef.current?.getBoundingClientRect()
    if (!cont) return
    setSelectedEvent(ev)
    setPopupPos({ x: rect.left - cont.left + rect.width / 2, y: rect.top - cont.top + rect.height + 8 })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-slate-950/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-white flex flex-col overflow-hidden w-full h-full"
        >

          {/* HEADER */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Calendario</h2>
                  <p className="text-xs text-slate-400">{filteredEvents.length} eventi · {tasks.length} task</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && managedUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
                      className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer">
                      <option value="all">Tutti gli utenti</option>
                      <option value="mine">Solo miei</option>
                      {managedUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-1">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 px-3 min-w-[130px] text-center select-none">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200/80">
                  Oggi
                </button>

                <button onClick={onAdd}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Nuovo Evento
                </button>

                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-hidden flex min-h-0">

            {/* GRIGLIA */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 flex-shrink-0">
                {DAYS_SHORT.map((d, i) => (
                  <div key={d} className={`py-3 text-center text-xs font-bold tracking-wider ${i === 0 || i === 6 ? 'text-rose-300' : 'text-slate-400'}`}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridTemplateRows: 'repeat(6, minmax(90px, 1fr))' }}>
                {calendarDays.map((date, i) => {
                  if (!date) return (
                    <div key={`e-${i}`} className={`border-r border-b border-slate-100/80 bg-slate-50/20 ${i % 7 === 6 ? 'border-r-0' : ''}`} />
                  )
                  const dayEvents = getEventsForDate(date)
                  const dayTasks = getTasksForDate(date)
                  const isSelected = isSameDay(date, selectedDate)
                  const today = isToday(date)
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6

                  return (
                    <div key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`relative border-r border-b border-slate-100/80 p-1.5 cursor-pointer transition-colors group overflow-hidden
                        ${i % 7 === 6 ? 'border-r-0' : ''}
                        ${isWeekend ? 'bg-slate-50/40' : 'bg-white'}
                        ${isSelected && !today ? 'ring-2 ring-inset ring-indigo-400' : ''}
                        ${!today && !isSelected ? 'hover:bg-indigo-50/30' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-0.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                          ${today ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-400/40' :
                            isSelected ? 'bg-indigo-100 text-indigo-700' :
                            isWeekend ? 'text-rose-400' : 'text-slate-700 group-hover:text-indigo-700'}
                        `}>
                          {date.getDate()}
                        </span>
                        {(dayEvents.length + dayTasks.length) > 0 && (
                          <span className="text-[9px] text-slate-300 font-medium mt-1.5 mr-0.5">{dayEvents.length + dayTasks.length}</span>
                        )}
                      </div>

                      <div className="space-y-[2px]">
                        {dayEvents.slice(0, 3).map(ev => (
                          <button key={ev.id}
                            onClick={e => openPopup(ev, e)}
                            className={`w-full text-left text-xs leading-snug font-semibold truncate rounded-lg px-2 py-1 text-white hover:opacity-90 active:scale-[0.97] transition-all ${EV_PILL[getEvColor(ev)]}`}
                          >
                            {!ev.all_day && <span className="opacity-80 mr-0.5">{fmt(ev.start_date)}</span>}
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-slate-400 font-medium px-1">+{dayEvents.length - 3}</div>
                        )}
                        {dayTasks.length > 0 && (
                          <div className="text-[9px] text-violet-500 font-semibold px-1 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />{dayTasks.length}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PANNELLO DESTRA */}
            <div className="w-80 xl:w-96 flex-shrink-0 border-l border-slate-100 flex flex-col overflow-hidden bg-slate-50/50">
              <div className="flex-shrink-0 px-4 py-4 border-b border-slate-100 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{DAYS_SHORT[selectedDate.getDay()]} · {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mt-0.5">{selectedDate.getDate()}</h3>
                  </div>
                  <button onClick={onAdd} title="Aggiungi evento"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/60 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3 mt-2.5">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />{selectedDateEvents.length} eventi
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded bg-violet-400" />{selectedDateTasks.length} task
                  </span>
                </div>
                {isAdmin && managedUsers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {managedUsers.map(u => (
                      <span key={u.id} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white ${EV_PILL[userColorMap[u.id] || 'gray']}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        {(u.full_name || u.email || '').split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                      <CalendarIcon className="w-6 h-6 text-slate-200" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400 mb-0.5">Nessun evento</p>
                    <p className="text-xs text-slate-300 mb-4">Giornata libera</p>
                    <button onClick={onAdd} className="text-xs font-semibold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 border border-indigo-200/60 transition-all">
                      + Aggiungi evento
                    </button>
                  </div>
                )}

                {selectedDateEvents.map((ev, idx) => {
                  const c = EV_CARD[getEvColor(ev)] || FB
                  return (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                      onClick={e => openPopup(ev, e)}
                      className={`rounded-2xl border-l-4 p-4 cursor-pointer hover:shadow-md transition-all ${c.bg} ${c.border}`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className={`text-sm font-bold leading-tight ${c.text}`}>{ev.title}</p>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${c.badge}`} />
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${c.text} opacity-70 mb-1`}>
                        <Clock className="w-3 h-3 flex-shrink-0" />{fmtEvDate(ev)}
                      </div>
                      {ev.location && (
                        <div className={`flex items-center gap-1.5 text-xs ${c.text} opacity-60`}>
                          <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{ev.location}</span>
                        </div>
                      )}
                      {(ev.assigned_to || ev.is_shared) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ev.assigned_to && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                              <User className="w-2.5 h-2.5" />{ev.assigned_to_name || getUserName(ev.assigned_to) || 'Utente'}
                            </span>
                          )}
                          {ev.is_shared && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 text-teal-700 px-2 py-0.5 rounded-full font-semibold border border-teal-200">
                              <Users className="w-2.5 h-2.5" />Condiviso
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {selectedDateTasks.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">Task</p>
                    {selectedDateTasks.map(task => (
                      <div key={task.id} className={`rounded-2xl p-3 flex items-start gap-2.5 ${
                        task.is_completed ? 'bg-emerald-50 border-l-4 border-emerald-400' :
                        task.priority === 'urgent' ? 'bg-red-50 border-l-4 border-red-400' :
                        task.priority === 'high' ? 'bg-orange-50 border-l-4 border-orange-400' :
                        'bg-violet-50 border-l-4 border-violet-400'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${task.is_completed ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {task.priority === 'urgent' ? '🔴 Urgente' : task.priority === 'high' ? '🟠 Alta' : task.priority === 'medium' ? '🟡 Media' : '🔵 Bassa'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* POPUP DETTAGLIO EVENTO */}
          <AnimatePresence>
            {selectedEvent && popupPos && (
              <motion.div
                ref={popupRef}
                initial={{ opacity: 0, scale: 0.88, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -8 }}
                transition={{ type: 'spring', damping: 22, stiffness: 360 }}
                style={{
                  position: 'absolute',
                  left: Math.max(8, Math.min(popupPos.x - 160, (containerRef.current?.offsetWidth ?? 900) - 336)),
                  top: Math.max(8, Math.min(popupPos.y, (containerRef.current?.offsetHeight ?? 650) - 400)),
                  zIndex: 200,
                  width: 320,
                }}
                className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden"
              >
                <div className={`h-1.5 ${EV_PILL[selectedEvent.color] || EV_PILL.blue}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${EV_PILL[selectedEvent.color] || EV_PILL.blue}`} />
                      <h4 className="text-base font-bold text-slate-900 leading-tight">{selectedEvent.title}</h4>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { const ev = selectedEvent; setSelectedEvent(null); setPopupPos(null); onEdit(ev) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Eliminare "${selectedEvent.title}"?`)) { onDelete(selectedEvent.id); setSelectedEvent(null); setPopupPos(null) } }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setSelectedEvent(null); setPopupPos(null) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
                      {selectedEvent.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{fmtEvDate(selectedEvent)}</p>
                        <p className="text-xs text-slate-400">{fmtFullDate(selectedEvent.start_date)}</p>
                      </div>
                    </div>

                    {selectedEvent.location && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="font-medium">{selectedEvent.location}</span>
                      </div>
                    )}

                    {selectedEvent.is_recurring && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                          <Repeat className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="font-medium">Evento ricorrente</span>
                      </div>
                    )}


                  </div>

                  {(selectedEvent.assigned_to || selectedEvent.is_shared) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {selectedEvent.assigned_to && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200">
                          <User className="w-3 h-3" />
                          {selectedEvent.assigned_to_name || getUserName(selectedEvent.assigned_to) || 'Utente'}
                        </span>
                      )}
                      {selectedEvent.is_shared && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-semibold border border-teal-200">
                          <Users className="w-3 h-3" />Visibile a tutti
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
