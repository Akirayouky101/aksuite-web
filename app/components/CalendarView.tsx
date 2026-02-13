'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronLeft, ChevronRight, Plus, Edit, Trash2, 
  Calendar as CalendarIcon, MapPin, Clock, Repeat, CheckCircle2 
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
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

const COLORS = {
  blue: 'bg-blue-500/20 border-indigo-500 text-indigo-400',
  green: 'bg-green-500/20 border-green-500 text-green-300',
  red: 'bg-red-500/20 border-red-500 text-red-300',
  purple: 'bg-purple-500/20 border-purple-500 text-purple-300',
  orange: 'bg-orange-500/20 border-orange-500 text-orange-300',
  pink: 'bg-pink-500/20 border-pink-500 text-pink-300',
  yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
  gray: 'bg-gray-500/20 border-slate-300 text-slate-500'
}

export default function CalendarView({
  isOpen,
  onClose,
  events,
  tasks = [],
  onDelete,
  onEdit,
  onAdd
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i))
    }

    return days
  }, [currentYear, currentMonth])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)

      return (
        (eventStart >= dateStart && eventStart <= dateEnd) ||
        (eventEnd >= dateStart && eventEnd <= dateEnd) ||
        (eventStart <= dateStart && eventEnd >= dateEnd)
      )
    })
  }

  // Get tasks for a specific date (only tasks with due_date)
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false
      
      const taskDate = new Date(task.due_date)
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)

      return taskDate >= dateStart && taskDate <= dateEnd
    })
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatEventDate = (event: Event) => {
    const start = new Date(event.start_date)
    if (event.all_day) {
      return 'Tutto il giorno'
    }
    const end = event.end_date ? new Date(event.end_date) : null
    return end 
      ? `${formatTime(event.start_date)} - ${formatTime(event.end_date!)}`
      : formatTime(event.start_date)
  }

  const getColorClasses = (color: string) => {
    return COLORS[color as keyof typeof COLORS] || COLORS.blue
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 ">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-900/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  📅 Calendario Eventi
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Oggi
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-slate-800">
                  {MONTHS[currentMonth]} {currentYear}
                </h3>

                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-green-700 hover:to-emerald-700 text-slate-800 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nuovo Evento
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {DAYS.map(day => (
                      <div
                        key={day}
                        className="text-center text-sm font-bold text-slate-400 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }

                      const dayEvents = getEventsForDate(date)
                      const dayTasks = getTasksForDate(date)
                      const isSelected = selectedDate && 
                        date.getDate() === selectedDate.getDate() &&
                        date.getMonth() === selectedDate.getMonth() &&
                        date.getFullYear() === selectedDate.getFullYear()

                      return (
                        <motion.button
                          key={date.toISOString()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(date)}
                          className={`aspect-square rounded-lg border-2 p-2 relative transition-all ${
                            isToday(date)
                              ? 'bg-blue-600 border-indigo-300 text-slate-800 font-bold'
                              : isSelected
                              ? 'bg-purple-600/30 border-purple-400 text-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-sm">{date.getDate()}</div>
                          {(dayEvents.length > 0 || dayTasks.length > 0) && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                              {dayEvents.slice(0, 2).map((event, i) => (
                                <div
                                  key={`event-${i}`}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    event.color === 'blue' ? 'bg-blue-400' :
                                    event.color === 'green' ? 'bg-green-400' :
                                    event.color === 'red' ? 'bg-red-400' :
                                    event.color === 'purple' ? 'bg-purple-400' :
                                    event.color === 'orange' ? 'bg-orange-400' :
                                    event.color === 'pink' ? 'bg-pink-400' :
                                    event.color === 'yellow' ? 'bg-yellow-400' :
                                    'bg-gray-400'
                                  }`}
                                />
                              ))}
                              {dayTasks.slice(0, 2).map((task, i) => (
                                <div
                                  key={`task-${i}`}
                                  className="w-1.5 h-1.5 rounded-sm bg-violet-400"
                                  title="Task"
                                />
                              ))}
                            </div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Events and Tasks List for Selected Date */}
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
                  <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarIcon size={20} />
                    {selectedDate 
                      ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`
                      : 'Seleziona una data'
                    }
                  </h4>

                  {selectedDate && selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <div className="text-4xl mb-2">📅</div>
                      <p>Nessun evento o task per questa data</p>
                      <button
                        onClick={onAdd}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                      >
                        Aggiungi Evento
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {/* Events */}
                    {selectedDateEvents.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                          <CalendarIcon size={14} />
                          Eventi ({selectedDateEvents.length})
                        </h5>
                        {selectedDateEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`${getColorClasses(event.color)} border-l-4 rounded-lg p-3 mb-2`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h6 className="font-bold text-slate-800">{event.title}</h6>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => onEdit(event)}
                                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                                  title="Modifica evento"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Eliminare questo evento?')) {
                                      onDelete(event.id)
                                    }
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                                  title="Elimina evento"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {event.description && (
                              <p className="text-sm text-slate-500 mb-2">{event.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatEventDate(event)}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {event.location}
                                </span>
                              )}
                              {event.is_recurring && (
                                <span className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded">
                                  <Repeat size={12} />
                                  Ricorrente
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {selectedDateTasks.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          Task ({selectedDateTasks.length})
                        </h5>
                        {selectedDateTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (selectedDateEvents.length + index) * 0.05 }}
                            className={`border-l-4 rounded-lg p-3 mb-2 ${
                              task.is_completed 
                                ? 'bg-green-500/10 border-green-500' 
                                : task.priority === 'urgent' || task.priority === 'high'
                                ? 'bg-red-500/10 border-red-500'
                                : 'bg-indigo-50 border-indigo-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h6 className={`font-bold ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {task.title}
                                </h6>
                                {task.description && (
                                  <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs mt-2">
                                  <span className={`px-2 py-0.5 rounded ${
                                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-blue-500/20 text-indigo-400'
                                  }`}>
                                    {task.priority === 'urgent' ? '🔴 Urgente' :
                                     task.priority === 'high' ? '🟠 Alta' :
                                     task.priority === 'medium' ? '🟡 Media' : '🔵 Bassa'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded ${
                                    task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                    task.status === 'in-progress' ? 'bg-blue-500/20 text-indigo-400' :
                                    'bg-gray-500/20 text-slate-500'
                                  }`}>
                                    {task.status === 'completed' ? '✓ Completato' :
                                     task.status === 'in-progress' ? '⏳ In corso' : '📋 Da fare'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
