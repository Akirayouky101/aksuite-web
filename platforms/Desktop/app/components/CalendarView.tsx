'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Plus, BellOff,
  Calendar as CalendarIcon, Clock, MapPin,
  CheckCircle2, Users, User
} from 'lucide-react'
import { Event } from '../hooks/useEvents'
import { Client } from '../hooks/useClients'
import { WorkItem } from '../hooks/useWorkItems'
import EventDetailModal from './EventDetailModal'
import HistoryBrowser from './HistoryBrowser'
import WebPushSettings from './WebPushSettings'
import GoogleCalendarSettings from './GoogleCalendarSettings'

interface CalendarTask {
  id: string
  title: string
  is_completed: boolean
  priority: string
  due_date: string
}

interface CalendarViewProps {
  embedded?: boolean
  initialSettings?: boolean
  isOpen: boolean
  onClose: () => void
  events: Event[]
  clients?: Client[]
  workItems?: WorkItem[]
  tasks?: CalendarTask[]
  onDelete: (id: string) => void | Promise<void>
  onEdit: (event: Event) => void
  onAdd: () => void
  onScheduleFollowUp?: (event: Event) => void
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
  purple: 'bg-ak-accent',
  orange: 'bg-orange-500',
  pink:   'bg-pink-500',
  yellow: 'bg-amber-400',
  gray:   'bg-ak-inset',
}

interface ColorSet { bg: string; border: string; text: string; badge: string }
const EV_CARD: Record<string, ColorSet> = {
  blue:   { bg: 'bg-ak-hover',    border: 'border-blue-400',   text: 'text-ak-cyan',   badge: 'bg-blue-500' },
  green:  { bg: 'bg-ak-success-bg', border: 'border-emerald-400',text: 'text-ak-success',badge: 'bg-emerald-500' },
  red:    { bg: 'bg-ak-danger-bg',     border: 'border-red-400',    text: 'text-ak-danger',    badge: 'bg-red-500' },
  purple: { bg: 'bg-ak-purple-bg',  border: 'border-violet-400', text: 'text-ak-purple', badge: 'bg-ak-accent' },
  orange: { bg: 'bg-ak-orange-bg',  border: 'border-orange-400', text: 'text-ak-orange', badge: 'bg-orange-500' },
  pink:   { bg: 'bg-ak-pink-bg',    border: 'border-pink-400',   text: 'text-ak-pink',   badge: 'bg-pink-500' },
  yellow: { bg: 'bg-ak-warning-bg',   border: 'border-amber-400',  text: 'text-ak-warning',  badge: 'bg-amber-400' },
  gray:   { bg: 'bg-ak-panel',   border: 'border-ak-line',  text: 'text-ak-text',  badge: 'bg-ak-inset' },
}
const FB = EV_CARD.blue
const USER_COLORS = ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'yellow', 'gray']

export default function CalendarView({
  isOpen, onClose, events, clients = [], workItems = [], tasks = [], onDelete, onEdit, onAdd, onScheduleFollowUp,
  isAdmin = false, currentUserId, managedUsers = [], initialSettings = false, embedded = false
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [onlyWithoutReminder, setOnlyWithoutReminder] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [changedHistoryItem, setChangedHistoryItem] = useState<{ id: string } | null>(null)
  const [history, setHistory] = useState<'pending' | 'completed' | 'archived'>('pending')
  const [settings, setSettings] = useState(initialSettings)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const filteredEvents = useMemo(() => {
    if (!isAdmin || filterUserId === 'all') return events
    if (filterUserId === 'mine') return events.filter(e =>
      e.user_id === currentUserId || e.assigned_to === currentUserId
    )
    const selectedUser = managedUsers.find(u => u.id === filterUserId)
    const normalize = (s: string) => s.toLowerCase().trim()
    return events.filter(e => {
      if (e.user_id === filterUserId) return true
      if (e.assigned_to === filterUserId) return true
      if (selectedUser && e.assigned_to_name) {
        const evName = normalize(e.assigned_to_name)
        const uName = normalize(selectedUser.full_name || selectedUser.email || '')
        // match esatto case-insensitive
        if (evName === uName) return true
        // match parziale: il nome nel DB è un sottoinsieme (es. "Giuliano" vs "Giuliano Mottironi")
        if (uName.includes(evName) || evName.includes(uName)) return true
        // match su ogni token del nome (es. "Giuliano" matcha "Giuliano Mottironi")
        const tokens = uName.split(' ').filter(Boolean)
        if (tokens.some(t => evName.includes(t) && t.length > 2)) return true
      }
      return false
    })
  }, [events, filterUserId, isAdmin, currentUserId, managedUsers])

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
    if (managedUsers.length > 0) {
      // Prima priorità: colore del tecnico assegnato (assigned_to UUID)
      if (ev.assigned_to && userColorMap[ev.assigned_to]) return userColorMap[ev.assigned_to]
      // Fallback: cerca per nome (assigned_to_name) quando UUID non è settato
      if (ev.assigned_to_name) {
        const normalize = (s: string) => s.toLowerCase().trim()
        const evName = normalize(ev.assigned_to_name)
        const matched = managedUsers.find(u => {
          const uName = normalize(u.full_name || u.email || '')
          return uName === evName || uName.includes(evName) || evName.includes(uName)
        })
        if (matched && userColorMap[matched.id]) return userColorMap[matched.id]
      }
      // Ultima risorsa: colore del creatore
      if (ev.user_id && userColorMap[ev.user_id]) return userColorMap[ev.user_id]
    }
    return ev.color || 'blue'
  }

  const calendarEvents = onlyWithoutReminder ? filteredEvents.filter(event => event.reminder_minutes === 0) : filteredEvents

  const getEventsForDate = (date: Date) => calendarEvents.filter(ev => {
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
  const getUserName = (uid?: string | null) => {
    if (!uid) return null
    const user = managedUsers.find(user => user.id === uid)
    return user ? (user.full_name || user.email) : null
  }
  const openPopup = (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(ev)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={embedded ? 'ak-workspace ak-calendar-workspace !p-0 overflow-hidden' : 'ak-modal-backdrop fixed inset-0 z-50 flex bg-ak-inset/40 backdrop-blur-md'}
        onClick={embedded ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          className={`relative bg-ak-panel flex flex-col overflow-hidden w-full ${embedded ? 'min-h-[700px] lg:h-[calc(100dvh-220px)]' : 'h-full'}`}
        >

          {/* HEADER */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-ak-line bg-gradient-to-r from-ak-panel/60 to-ak-panel">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ak-accent via-ak-accent to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ak-text leading-tight">Calendario</h2>
                  <p className="text-xs text-ak-subtle">{filteredEvents.length} eventi · {tasks.length} task</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && managedUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-ak-panel border border-ak-line/80 rounded-xl px-3 py-1.5">
                    <Users className="w-3.5 h-3.5 text-ak-subtle flex-shrink-0" />
                    <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
                      className="text-xs bg-transparent text-ak-text font-medium focus:outline-none cursor-pointer">
                      <option value="all">Tutti gli utenti</option>
                      <option value="mine">Solo miei</option>
                      {managedUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                )}

                <button onClick={() => setOnlyWithoutReminder(value => !value)} aria-pressed={onlyWithoutReminder} title="Filtra eventi senza promemoria"
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${onlyWithoutReminder ? 'border-ak-warning bg-ak-warning-bg text-ak-warning' : 'border-ak-line/80 bg-ak-panel text-ak-muted hover:bg-ak-panel'}`}>
                  <BellOff className="h-3.5 w-3.5" />Senza promemoria
                </button>

                <div className="flex items-center gap-1 bg-ak-panel border border-ak-line/80 rounded-xl p-1">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                    aria-label="Mese precedente"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ak-panel hover:shadow-sm transition-all text-ak-muted hover:text-ak-text">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-ak-text px-3 min-w-[130px] text-center select-none">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                    aria-label="Mese successivo"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ak-panel hover:shadow-sm transition-all text-ak-muted hover:text-ak-text">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-ak-inset text-ak-text hover:bg-ak-inset transition-all border border-ak-line/80">
                  Oggi
                </button>

                <button onClick={onAdd}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-ak-accent to-ak-accent text-white shadow-lg shadow-indigo-500/25 hover:from-ak-accent hover:to-ak-accent-hover active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Nuovo Evento
                </button>

                <button onClick={onClose} aria-label={embedded ? 'Torna alla dashboard' : 'Chiudi calendario'} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ak-inset text-ak-subtle hover:text-ak-text transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-wrap gap-2 border-b p-3">
            <button onClick={() => setSettings(current => !current)} className="rounded-xl border px-3 py-2 text-sm font-bold">Impostazioni calendario</button>
            {(['pending', 'completed', 'archived'] as const).map(value => <button key={value} aria-pressed={history === value} onClick={() => setHistory(value)} className={`rounded-xl px-3 py-2 text-sm font-bold ${history === value ? 'bg-ak-success-bg' : 'bg-ak-inset'}`}>{value === 'pending' ? 'Da fare' : value === 'completed' ? 'Eseguite' : 'Archiviate'}</button>)}
          </div>
          {settings && <div className="max-h-[40vh] overflow-y-auto px-5"><WebPushSettings /><GoogleCalendarSettings /></div>}
          {history !== 'pending' && <div className="min-h-0 flex-1 overflow-y-auto p-5"><HistoryBrowser key={history} kind="event" state={history} changedItem={changedHistoryItem} onOpen={setSelectedEvent} /></div>}
          {history === 'pending' &&
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

            {/* GRIGLIA */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[390px]">
              <div className="grid grid-cols-7 border-b border-ak-line flex-shrink-0">
                {DAYS_SHORT.map((d, i) => (
                  <div key={d} className={`py-3 text-center text-xs font-bold tracking-wider ${i === 0 || i === 6 ? 'text-rose-300' : 'text-ak-subtle'}`}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridTemplateRows: 'repeat(6, minmax(90px, 1fr))' }}>
                {calendarDays.map((date, i) => {
                  if (!date) return (
                    <div key={`e-${i}`} className={`border-r border-b border-ak-line/80 bg-ak-panel/20 ${i % 7 === 6 ? 'border-r-0' : ''}`} />
                  )
                  const dayEvents = getEventsForDate(date)
                  const dayTasks = getTasksForDate(date)
                  const isSelected = isSameDay(date, selectedDate)
                  const today = isToday(date)
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6

                  return (
                    <div key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`relative border-r border-b border-ak-line/80 p-1.5 cursor-pointer transition-colors group overflow-hidden
                        ${i % 7 === 6 ? 'border-r-0' : ''}
                        ${isWeekend ? 'bg-ak-panel/40' : 'bg-ak-panel'}
                        ${isSelected && !today ? 'ring-2 ring-inset ring-indigo-400' : ''}
                        ${!today && !isSelected ? 'hover:bg-ak-hover/30' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-0.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                          ${today ? 'bg-gradient-to-br from-ak-accent to-ak-accent text-white shadow-md shadow-indigo-400/40' :
                            isSelected ? 'bg-ak-hover text-ak-cyan' :
                            isWeekend ? 'text-rose-400' : 'text-ak-text group-hover:text-ak-cyan'}
                        `}>
                          {date.getDate()}
                        </span>
                        {(dayEvents.length + dayTasks.length) > 0 && (
                          <span className="text-[9px] text-ak-subtle font-medium mt-1.5 mr-0.5">{dayEvents.length + dayTasks.length}</span>
                        )}
                      </div>

                      <div className="space-y-[2px]">
                        {dayEvents.slice(0, 3).map(ev => (
                          <button key={ev.id}
                            onClick={e => openPopup(ev, e)}
                            className={`w-full text-left text-xs leading-snug font-semibold truncate rounded-lg px-2 py-1 text-white hover:opacity-90 active:scale-[0.97] transition-all ${EV_PILL[getEvColor(ev)]}`}
                          >
                            {!ev.all_day && <span className="opacity-80 mr-0.5">{fmt(ev.start_date)}</span>}
                            {filterUserId === 'all' && managedUsers.length > 0 && ev.assigned_to_name && (
                              <span className="opacity-70 mr-0.5">[{ev.assigned_to_name.split(' ')[0]}]</span>
                            )}
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-ak-subtle font-medium px-1">+{dayEvents.length - 3}</div>
                        )}
                        {dayTasks.length > 0 && (
                          <div className="text-[9px] text-ak-purple font-semibold px-1 flex items-center gap-0.5">
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
            <div className="w-full lg:w-80 xl:w-96 lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-ak-line flex flex-col overflow-hidden bg-ak-panel/50 max-h-[420px] lg:max-h-none">
              <div className="flex-shrink-0 px-4 py-4 border-b border-ak-line bg-ak-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-ak-subtle uppercase tracking-widest">{DAYS_SHORT[selectedDate.getDay()]} · {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
                    <h3 className="text-3xl font-black text-ak-text leading-none mt-0.5">{selectedDate.getDate()}</h3>
                  </div>
                  <button onClick={onAdd} title="Aggiungi evento"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-ak-hover text-ak-cyan hover:bg-ak-hover border border-ak-line/60 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3 mt-2.5">
                  <span className="flex items-center gap-1 text-xs text-ak-subtle">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />{selectedDateEvents.length} eventi
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ak-subtle">
                    <span className="w-2 h-2 rounded bg-violet-400" />{selectedDateTasks.length} task
                  </span>
                </div>
                {isAdmin && managedUsers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {managedUsers.map(u => (
                      <span key={u.id} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white ${EV_PILL[userColorMap[u.id] || 'gray']}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-ak-panel/60" />
                        {(u.full_name || u.email || '').split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-ak-panel border border-ak-line flex items-center justify-center mb-3 shadow-sm">
                      <CalendarIcon className="w-6 h-6 text-ak-subtle" />
                    </div>
                    <p className="text-sm font-semibold text-ak-subtle mb-0.5">Nessun evento</p>
                    <p className="text-xs text-ak-subtle mb-4">Giornata libera</p>
                    <button onClick={onAdd} className="text-xs font-semibold px-4 py-2 bg-ak-hover text-ak-cyan rounded-xl hover:bg-ak-hover border border-ak-line/60 transition-all">
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
                            <span className="inline-flex items-center gap-1 text-[10px] bg-ak-panel/70 text-ak-warning px-2 py-0.5 rounded-full font-semibold border border-ak-warning">
                              <User className="w-2.5 h-2.5" />{ev.assigned_to_name || getUserName(ev.assigned_to) || 'Utente'}
                            </span>
                          )}
                          {ev.is_shared && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-ak-panel/70 text-ak-success px-2 py-0.5 rounded-full font-semibold border border-ak-success">
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
                    <p className="text-[10px] font-bold text-ak-subtle uppercase tracking-wider px-1 pt-1">Task</p>
                    {selectedDateTasks.map(task => (
                      <div key={task.id} className={`rounded-2xl p-3 flex items-start gap-2.5 ${
                        task.is_completed ? 'bg-ak-success-bg border-l-4 border-emerald-400' :
                        task.priority === 'urgent' ? 'bg-ak-danger-bg border-l-4 border-red-400' :
                        task.priority === 'high' ? 'bg-ak-orange-bg border-l-4 border-orange-400' :
                        'bg-ak-purple-bg border-l-4 border-violet-400'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${task.is_completed ? 'text-ak-success' : 'text-ak-subtle'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${task.is_completed ? 'line-through text-ak-subtle' : 'text-ak-text'}`}>{task.title}</p>
                          <span className="text-[10px] text-ak-subtle mt-0.5 block">
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

          }
          {selectedEvent && <EventDetailModal
            event={selectedEvent}
            clientName={clients.find(client => client.id === selectedEvent.client_id)?.name}
            workItemName={workItems.find(item => item.id === selectedEvent.work_item_id)?.title}
            onClose={() => setSelectedEvent(null)}
            onEdit={event => { setSelectedEvent(null); onEdit(event) }}
            onDelete={onDelete}
            onChanged={id => setChangedHistoryItem({ id })}
            onScheduleFollowUp={onScheduleFollowUp}
          />}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
