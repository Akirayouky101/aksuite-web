'use client'

import { useState, useEffect } from 'react'
import {
  Lock, LogIn, LogOut, User, Phone, UserCheck, LayoutDashboard,
  DollarSign, CheckSquare, StickyNote, ChevronRight, Plus,
  TrendingUp, Clock, Calendar, Menu, X
} from 'lucide-react'
import PasswordModal from './components/PasswordModal'
import PasswordMenuModal from './components/PasswordMenuModal'
import PasswordListModal from './components/PasswordListModal'
import BudgetModal from './components/BudgetModal'
import BudgetMenuModal from './components/BudgetMenuModal'
import BudgetViewModal from './components/BudgetViewModal'
import RecurringModal from './components/RecurringModal'
import RecurringListModal from './components/RecurringListModal'
import BudgetLimitModal from './components/BudgetLimitModal'
import BudgetLimitsViewModal from './components/BudgetLimitsViewModal'
import CallModal from './components/CallModal'
import CallMenuModal from './components/CallMenuModal'
import CallsListModal from './components/CallsListModal'
import VisitModal from './components/VisitModal'
import VisitsListModal from './components/VisitsListModal'
import TaskModal from './components/TaskModal'
import TasksListModal from './components/TasksListModal'
import NoteModal from './components/NoteModal'
import NotesListModal from './components/NotesListModal'
import EventModal from './components/EventModal'
import CalendarView from './components/CalendarView'
import UnifiedDashboard from './components/UnifiedDashboard'
import AuthModal from './components/AuthModal'
import { usePasswords } from './hooks/usePasswords'
import { useBudget } from './hooks/useBudget'
import { useRecurring } from './hooks/useRecurring'
import { useBudgetLimits } from './hooks/useBudgetLimits'
import { useCalls } from './hooks/useCalls'
import { useVisits } from './hooks/useVisits'
import { useTasks } from './hooks/useTasks'
import { useNotes } from './hooks/useNotes'
import { useEvents } from './hooks/useEvents'
import { useRelations } from './hooks/useRelations'
import { supabase } from '@/lib/supabase'
import { initConsoleGuard } from '@/lib/console-guard'

export default function Home() {
  // Modal states
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isBudgetMenuModalOpen, setIsBudgetMenuModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isBudgetViewModalOpen, setIsBudgetViewModalOpen] = useState(false)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isRecurringListModalOpen, setIsRecurringListModalOpen] = useState(false)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)
  const [isLimitsViewModalOpen, setIsLimitsViewModalOpen] = useState(false)
  const [isCallMenuModalOpen, setIsCallMenuModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isCallsListModalOpen, setIsCallsListModalOpen] = useState(false)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [isVisitsListModalOpen, setIsVisitsListModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTasksListModalOpen, setIsTasksListModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isNotesListModalOpen, setIsNotesListModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [userProfile, setUserProfile] = useState<any>(null)
  const [consoleGuard, setConsoleGuard] = useState<any>(null)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingCall, setEditingCall] = useState<any>(null)
  const [editingVisit, setEditingVisit] = useState<any>(null)

  // Hooks
  const { passwords, addPassword, user, deletePassword } = usePasswords()
  const { transactions, addTransaction, deleteTransaction, getStats } = useBudget()
  const { recurring, addRecurring, deleteRecurring, toggleActive } = useRecurring()
  const { limits, limitsStatus, addLimit, deleteLimit, toggleActive: toggleLimitActive } = useBudgetLimits()
  const { calls, addCall, deleteCall, updateCallStatus, updateCall } = useCalls()
  const { visits, addVisit, deleteVisit, updateVisitStatus, updateVisit } = useVisits()
  const { tasks, addTask, updateTask, deleteTask, toggleComplete } = useTasks()
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { addRelation, removeRelation, getRelatedItems } = useRelations()

  const availableRelationItems = { passwords, calls, visits, tasks, notes, events, transactions }

  // Computed
  const stats = getStats()
  const pendingCalls = calls.filter(c => c.status === 'pending').length
  const activeTasks = tasks.filter(t => !t.is_completed).length
  const todayEvents = events.filter(e => {
    const today = new Date()
    const eventDate = new Date(e.start_date)
    return eventDate.toDateString() === today.toDateString()
  }).length

  // Effects
  useEffect(() => {
    const guard = initConsoleGuard()
    setConsoleGuard(guard)
  }, [])

  useEffect(() => {
    if (consoleGuard) {
      if (!user) { consoleGuard.blockConsole() } else { consoleGuard.unblockConsole() }
    }
  }, [user, consoleGuard])

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (!error && data) setUserProfile(data)
      } else { setUserProfile(null) }
    }
    loadProfile()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // ── LOGIN SCREEN ──
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">AK Suite</h1>
              <p className="text-slate-500 mt-2">Accedi al tuo pannello di controllo</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <LogIn className="w-5 h-5" />
              Accedi
            </button>
            <p className="text-center text-sm text-slate-400 mt-6">Ambiente protetto e sicuro</p>
          </div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
        />
      </div>
    )
  }

  // ── NAV CONFIG ──
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => setIsDashboardOpen(true), color: 'text-blue-600' },
    { id: 'passwords', label: 'Password', icon: Lock, onClick: () => setIsMenuModalOpen(true), color: 'text-amber-600' },
    { id: 'calls', label: 'Chiamate', icon: Phone, onClick: () => setIsCallMenuModalOpen(true), color: 'text-green-600', badge: pendingCalls },
    { id: 'visits', label: 'Visite', icon: UserCheck, onClick: () => setIsVisitsListModalOpen(true), color: 'text-purple-600' },
    { id: 'tasks', label: 'Task', icon: CheckSquare, onClick: () => setIsTasksListModalOpen(true), color: 'text-cyan-600', badge: activeTasks },
    { id: 'notes', label: 'Note', icon: StickyNote, onClick: () => setIsNotesListModalOpen(true), color: 'text-yellow-600' },
    { id: 'calendar', label: 'Calendario', icon: Calendar, onClick: () => setIsCalendarViewOpen(true), color: 'text-indigo-600', badge: todayEvents },
    { id: 'budget', label: 'Bilancio', icon: DollarSign, onClick: () => setIsBudgetMenuModalOpen(true), color: 'text-emerald-600' },
  ]

  const quickActions = [
    { label: 'Nuova Chiamata', icon: Phone, onClick: () => setIsCallModalOpen(true), color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
    { label: 'Nuovo Task', icon: CheckSquare, onClick: () => setIsTaskModalOpen(true), color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200' },
    { label: 'Nuova Nota', icon: StickyNote, onClick: () => { setEditingNote(null); setIsNoteModalOpen(true) }, color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' },
    { label: 'Nuovo Evento', icon: Calendar, onClick: () => { setEditingEvent(null); setIsEventModalOpen(true) }, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
    { label: 'Nuova Visita', icon: UserCheck, onClick: () => { setEditingVisit(null); setIsVisitModalOpen(true) }, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    { label: 'Transazione', icon: DollarSign, onClick: () => setIsBudgetModalOpen(true), color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
  ]

  // ── MAIN LAYOUT ──
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Menu"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">AK Suite</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span className="hidden sm:inline font-medium">{userProfile?.full_name || user.email}</span>
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR OVERLAY (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-200 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-3 space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigazione</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { item.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {item.badge}
                  </span>
                ) : null}
                <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            <div className="border-t border-slate-100 my-3" />
            <p className="px-3 pt-1 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Crea Nuovo</p>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                <span>{action.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          {/* Welcome */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Buongiorno{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
            </h2>
            <p className="text-slate-500 mt-1">Ecco il riepilogo della tua giornata</p>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button onClick={() => setIsCallMenuModalOpen(true)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                {pendingCalls > 0 && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{pendingCalls} in attesa</span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{calls.length}</p>
              <p className="text-sm text-slate-500">Chiamate</p>
            </button>

            <button onClick={() => setIsTasksListModalOpen(true)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-cyan-600" />
                </div>
                {activeTasks > 0 && (
                  <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">{activeTasks} attivi</span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
              <p className="text-sm text-slate-500">Task</p>
            </button>

            <button onClick={() => setIsCalendarViewOpen(true)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                {todayEvents > 0 && (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{todayEvents} oggi</span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{events.length}</p>
              <p className="text-sm text-slate-500">Eventi</p>
            </button>

            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(0)}€
              </p>
              <p className="text-sm text-slate-500">Bilancio</p>
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Azioni Rapide</h3>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${action.color}`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* TWO COLUMN PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chiamate recenti */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Chiamate Recenti
                </h3>
                <button onClick={() => setIsCallsListModalOpen(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Vedi tutte
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {calls.slice(0, 4).map(call => (
                  <div key={call.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{call.caller_name}</p>
                      <p className="text-sm text-slate-500 truncate">{call.company || call.phone || '\u2014'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      call.status === 'completed' ? 'bg-green-50 text-green-700' :
                      call.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {call.status === 'completed' ? 'Completata' : call.status === 'cancelled' ? 'Annullata' : 'In attesa'}
                    </span>
                  </div>
                ))}
                {calls.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessuna chiamata</p>
                  </div>
                )}
              </div>
            </div>

            {/* Task attivi */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-cyan-600" />
                  Task Attivi
                </h3>
                <button onClick={() => setIsTasksListModalOpen(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Vedi tutti
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {tasks.filter(t => !t.is_completed).slice(0, 4).map(task => (
                  <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.due_date && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status === 'in-progress' ? 'In corso' : 'Da fare'}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => !t.is_completed).length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessun task attivo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Note recenti */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-yellow-600" />
                  Note Recenti
                </h3>
                <button onClick={() => setIsNotesListModalOpen(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Vedi tutte
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {notes.slice(0, 3).map(note => (
                  <div
                    key={note.id}
                    onClick={() => { setEditingNote(note); setIsNoteModalOpen(true) }}
                    className="px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-slate-900 truncate">{note.title}</p>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{note.content?.replace(/<[^>]*>/g, '').substring(0, 80) || '\u2014'}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessuna nota</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visite recenti */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Visite Recenti
                </h3>
                <button onClick={() => setIsVisitsListModalOpen(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Vedi tutte
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {visits.slice(0, 3).map(visit => (
                  <div key={visit.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{visit.visitor_name}</p>
                      <p className="text-sm text-slate-500 truncate">{visit.company || visit.visit_type}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      visit.status === 'completed' ? 'bg-green-50 text-green-700' :
                      visit.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                      visit.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {visit.status === 'completed' ? 'Completata' : visit.status === 'in_progress' ? 'In corso' : visit.status === 'cancelled' ? 'Annullata' : 'Programmata'}
                    </span>
                  </div>
                ))}
                {visits.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nessuna visita</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PASSWORD + BILANCIO ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <button onClick={() => setIsMenuModalOpen(true)} className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Vault Password</h3>
                  <p className="text-sm text-slate-500">{passwords.length} password salvate</p>
                </div>
              </div>
              <span className="flex items-center text-sm text-blue-600 font-medium">
                Gestisci <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </button>

            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Bilancio Familiare</h3>
                  <p className="text-sm text-slate-500">{transactions.length} transazioni</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">+{stats.totalIncome.toFixed(0)}€ entrate</span>
                <span className="text-red-500 font-medium">-{stats.totalExpenses.toFixed(0)}€ uscite</span>
              </div>
            </button>
          </div>
        </main>
      </div>

      {/* ALL MODALS */}
      <PasswordMenuModal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}
        onSelectNew={() => setIsPasswordModalOpen(true)} onSelectList={() => setIsListModalOpen(true)} />
      <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}
        onSave={(data) => { addPassword(data) }} />
      <PasswordListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)}
        passwords={passwords} onDelete={deletePassword} />

      <BudgetMenuModal isOpen={isBudgetMenuModalOpen} onClose={() => setIsBudgetMenuModalOpen(false)}
        onSelectNew={() => setIsBudgetModalOpen(true)} onSelectView={() => setIsBudgetViewModalOpen(true)}
        onSelectRecurring={() => setIsRecurringModalOpen(true)} onSelectRecurringList={() => setIsRecurringListModalOpen(true)}
        onSelectLimit={() => setIsLimitModalOpen(true)} onSelectLimitsList={() => setIsLimitsViewModalOpen(true)} />
      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onSave={addTransaction} />
      <BudgetViewModal isOpen={isBudgetViewModalOpen} onClose={() => setIsBudgetViewModalOpen(false)}
        transactions={transactions} onDelete={deleteTransaction} stats={getStats()} />
      <RecurringModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} onSave={addRecurring} />
      <RecurringListModal isOpen={isRecurringListModalOpen} onClose={() => setIsRecurringListModalOpen(false)}
        recurring={recurring} onToggleActive={toggleActive} onDelete={deleteRecurring} />
      <BudgetLimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)}
        onSave={addLimit} existingCategories={limits.map(l => l.category)} />
      <BudgetLimitsViewModal isOpen={isLimitsViewModalOpen} onClose={() => setIsLimitsViewModalOpen(false)}
        limits={limitsStatus} onToggleActive={toggleLimitActive} onDelete={deleteLimit} />

      <CallMenuModal isOpen={isCallMenuModalOpen} onClose={() => setIsCallMenuModalOpen(false)}
        onSelectNew={() => setIsCallModalOpen(true)} onSelectList={() => setIsCallsListModalOpen(true)} />
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => { setIsCallModalOpen(false); setEditingCall(null) }}
        onSave={async (callData) => {
          let callId: string | undefined
          if (editingCall) { await updateCall(editingCall.id, callData); callId = editingCall.id }
          else { const newCall = await addCall(callData); callId = newCall?.id }
          if (callData.follow_up && callData.follow_up_date && callId) {
            const newTask = await addTask({
              title: `Follow-up: ${callData.caller_name || 'Chiamata'}`,
              description: `Follow-up chiamata da ${callData.caller_name || 'contatto'}${callData.company ? ` (${callData.company})` : ''}`,
              due_date: callData.follow_up_date, priority: callData.priority || 'medium',
              status: 'todo', category: 'follow_up', is_recurring: false, recurring_type: null, tags: [], subtasks: []
            })
            if (newTask?.id) await addRelation('call', callId, 'task', newTask.id, 'related', 'Auto follow-up')
          }
        }}
        editCall={editingCall} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems}
      />
      <CallsListModal isOpen={isCallsListModalOpen} onClose={() => setIsCallsListModalOpen(false)}
        calls={calls} onDelete={deleteCall} onStatusChange={updateCallStatus}
        onEdit={(call) => { setEditingCall(call); setIsCallModalOpen(true); setIsCallsListModalOpen(false) }} />

      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => { setIsVisitModalOpen(false); setEditingVisit(null) }}
        onSave={async (visitData) => {
          let visitId: string | undefined
          if (editingVisit) { await updateVisit(editingVisit.id, visitData); visitId = editingVisit.id }
          else { const newVisit = await addVisit(visitData); visitId = newVisit?.id }
          if (visitData.follow_up && visitData.follow_up_date && visitId) {
            const newTask = await addTask({
              title: `Follow-up: ${visitData.visitor_name || 'Visita'}`,
              description: `Follow-up visita di ${visitData.visitor_name || 'visitatore'}${visitData.company ? ` (${visitData.company})` : ''}`,
              due_date: visitData.follow_up_date, priority: visitData.priority || 'medium',
              status: 'todo', category: 'follow_up', is_recurring: false, recurring_type: null, tags: [], subtasks: []
            })
            if (newTask?.id) await addRelation('visit', visitId, 'task', newTask.id, 'related', 'Auto follow-up')
          }
        }}
        editVisit={editingVisit}
      />
      <VisitsListModal isOpen={isVisitsListModalOpen} onClose={() => setIsVisitsListModalOpen(false)}
        visits={visits} onDelete={deleteVisit} onStatusChange={updateVisitStatus}
        onEdit={(visit) => { setEditingVisit(visit); setIsVisitModalOpen(true); setIsVisitsListModalOpen(false) }}
        onNew={() => { setEditingVisit(null); setIsVisitModalOpen(true) }} />

      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}
        onSave={async (task) => { await addTask(task) }} editTask={null}
        availableItems={availableRelationItems} onAddRelation={addRelation}
        onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />
      <TasksListModal isOpen={isTasksListModalOpen} onClose={() => setIsTasksListModalOpen(false)}
        tasks={tasks} onDelete={deleteTask} onToggleComplete={toggleComplete}
        onUpdate={updateTask} onAdd={async (task) => { await addTask(task) }} />

      {isDashboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl relative">
            <button onClick={() => setIsDashboardOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all"
              title="Chiudi">
              <X className="w-5 h-5 text-white" />
            </button>
            <UnifiedDashboard passwords={passwords} calls={calls} tasks={tasks} transactions={transactions}
              onOpenPasswords={() => { setIsDashboardOpen(false); setIsMenuModalOpen(true) }}
              onOpenCalls={() => { setIsDashboardOpen(false); setIsCallMenuModalOpen(true) }}
              onOpenTasks={() => { setIsDashboardOpen(false); setIsTasksListModalOpen(true) }}
              onOpenBudget={() => { setIsDashboardOpen(false); setIsBudgetMenuModalOpen(true) }}
              onNewPassword={() => { setIsDashboardOpen(false); setIsPasswordModalOpen(true) }}
              onNewCall={() => { setIsDashboardOpen(false); setIsCallModalOpen(true) }}
              onNewTask={() => { setIsDashboardOpen(false); setIsTaskModalOpen(true) }}
              onNewTransaction={() => { setIsDashboardOpen(false); setIsBudgetModalOpen(true) }}
            />
          </div>
        </div>
      )}

      <NoteModal isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setEditingNote(null) }}
        onSave={(noteData) => { if (editingNote) { updateNote(editingNote.id, noteData) } else { addNote(noteData) } }}
        editNote={editingNote} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />
      <NotesListModal isOpen={isNotesListModalOpen} onClose={() => setIsNotesListModalOpen(false)}
        notes={notes} onDelete={deleteNote} onUpdate={updateNote} onTogglePin={togglePin}
        onEdit={(note) => { setEditingNote(note); setIsNoteModalOpen(true) }}
        onAdd={() => { setEditingNote(null); setIsNoteModalOpen(true) }} />

      <EventModal isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setEditingEvent(null) }}
        onSave={(eventData) => { if (editingEvent) { updateEvent(editingEvent.id, eventData) } else { addEvent(eventData) } }}
        editEvent={editingEvent} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />

      <CalendarView isOpen={isCalendarViewOpen} onClose={() => setIsCalendarViewOpen(false)}
        events={events} tasks={tasks} onDelete={deleteEvent}
        onEdit={(event) => { setEditingEvent(event); setIsEventModalOpen(true) }}
        onAdd={() => { setEditingEvent(null); setIsEventModalOpen(true) }} />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
