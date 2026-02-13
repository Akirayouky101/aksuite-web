'use client'

import { useState, useEffect } from 'react'
import {
  Lock, LogIn, LogOut, User, Phone, UserCheck, LayoutDashboard,
  DollarSign, CheckSquare, StickyNote, ChevronRight, Plus,
  TrendingUp, Clock, Calendar, Menu, X, Shield, Zap, ArrowUpRight,
  Search, Bell, Settings
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

  const [userProfile, setUserProfile] = useState<any>(null)
  const [consoleGuard, setConsoleGuard] = useState<any>(null)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingCall, setEditingCall] = useState<any>(null)
  const [editingVisit, setEditingVisit] = useState<any>(null)

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

  const stats = getStats()
  const pendingCalls = calls.filter(c => c.status === 'pending').length
  const activeTasks = tasks.filter(t => !t.is_completed).length
  const todayEvents = events.filter(e => {
    const today = new Date()
    const eventDate = new Date(e.start_date)
    return eventDate.toDateString() === today.toDateString()
  }).length

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

  // ═══ LOGIN SCREEN ═══
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AK Suite</h1>
              <p className="text-slate-400 mt-2 text-sm">La tua suite gestionale premium</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Accedi al pannello
            </button>
            <p className="text-center text-xs text-slate-300 mt-6">Crittografia end-to-end</p>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  // ═══ NAV & ACTIONS ═══
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => setIsDashboardOpen(true), color: 'text-indigo-500 bg-indigo-50' },
    { id: 'passwords', label: 'Password', icon: Lock, onClick: () => setIsMenuModalOpen(true), color: 'text-amber-600 bg-amber-50' },
    { id: 'calls', label: 'Chiamate', icon: Phone, onClick: () => setIsCallMenuModalOpen(true), color: 'text-emerald-600 bg-emerald-50', badge: pendingCalls },
    { id: 'visits', label: 'Visite', icon: UserCheck, onClick: () => setIsVisitsListModalOpen(true), color: 'text-violet-500 bg-violet-50' },
    { id: 'tasks', label: 'Task', icon: CheckSquare, onClick: () => setIsTasksListModalOpen(true), color: 'text-blue-500 bg-blue-50', badge: activeTasks },
    { id: 'notes', label: 'Note', icon: StickyNote, onClick: () => setIsNotesListModalOpen(true), color: 'text-yellow-600 bg-yellow-50' },
    { id: 'calendar', label: 'Calendario', icon: Calendar, onClick: () => setIsCalendarViewOpen(true), color: 'text-rose-500 bg-rose-50', badge: todayEvents },
    { id: 'budget', label: 'Bilancio', icon: DollarSign, onClick: () => setIsBudgetMenuModalOpen(true), color: 'text-teal-600 bg-teal-50' },
  ]

  const quickActions = [
    { label: 'Chiamata', icon: Phone, onClick: () => setIsCallModalOpen(true), color: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200' },
    { label: 'Task', icon: CheckSquare, onClick: () => setIsTaskModalOpen(true), color: 'text-blue-600 hover:bg-blue-50 border-blue-200' },
    { label: 'Nota', icon: StickyNote, onClick: () => { setEditingNote(null); setIsNoteModalOpen(true) }, color: 'text-yellow-600 hover:bg-yellow-50 border-yellow-200' },
    { label: 'Evento', icon: Calendar, onClick: () => { setEditingEvent(null); setIsEventModalOpen(true) }, color: 'text-rose-500 hover:bg-rose-50 border-rose-200' },
    { label: 'Visita', icon: UserCheck, onClick: () => { setEditingVisit(null); setIsVisitModalOpen(true) }, color: 'text-violet-500 hover:bg-violet-50 border-violet-200' },
    { label: 'Transazione', icon: DollarSign, onClick: () => setIsBudgetModalOpen(true), color: 'text-teal-600 hover:bg-teal-50 border-teal-200' },
  ]

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800">
      {/* ═══ TOP BAR ═══ */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Menu">
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">AK Suite</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-600">{userProfile?.full_name || user.email}</span>
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ═══ SIDEBAR OVERLAY ═══ */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ═══ SIDEBAR ═══ */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 z-40 transition-transform duration-200 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-4 space-y-1">
            <p className="px-3 pt-2 pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { item.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center transition-all`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <div className="border-t border-slate-100 my-4" />
            <p className="px-3 pt-1 pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Crea Nuovo</p>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 hover:bg-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Bentornato{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
            </h2>
            <p className="text-slate-400 mt-1 text-sm">Ecco la tua panoramica operativa di oggi.</p>
          </div>

          {/* ═══ STAT CARDS ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onClick={() => setIsCallMenuModalOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                {pendingCalls > 0 && <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">{pendingCalls} pending</span>}
              </div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{calls.length}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Chiamate</p>
            </button>
            <button onClick={() => setIsTasksListModalOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                </div>
                {activeTasks > 0 && <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{activeTasks} attivi</span>}
              </div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{tasks.length}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Task</p>
            </button>
            <button onClick={() => setIsCalendarViewOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-rose-500" />
                </div>
                {todayEvents > 0 && <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">{todayEvents} oggi</span>}
              </div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{events.length}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Eventi</p>
            </button>
            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(0)}€
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Bilancio</p>
            </button>
          </div>

          {/* ═══ QUICK ACTIONS ═══ */}
          <div className="mb-8">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Azioni Rapide</h3>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button key={i} onClick={action.onClick} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border transition-all shadow-sm hover:shadow-md ${action.color}`}>
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══ DATA PANELS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Calls */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" /> Chiamate Recenti
                </h3>
                <button onClick={() => setIsCallsListModalOpen(true)} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {calls.slice(0, 4).map(call => (
                  <div key={call.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{call.caller_name}</p>
                      <p className="text-xs text-slate-400 truncate">{call.company || call.phone || '\u2014'}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      call.status === 'completed' ? 'text-emerald-700 bg-emerald-50' :
                      call.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                      'text-amber-700 bg-amber-50'
                    }`}>
                      {call.status === 'completed' ? 'Completata' : call.status === 'cancelled' ? 'Annullata' : 'In attesa'}
                    </span>
                  </div>
                ))}
                {calls.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <Phone className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">Nessuna chiamata</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-500" /> Task Attivi
                </h3>
                <button onClick={() => setIsTasksListModalOpen(true)} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
                  Tutti <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {tasks.filter(t => !t.is_completed).slice(0, 4).map(task => (
                  <div key={task.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent' ? 'text-red-700 bg-red-50' :
                          task.priority === 'high' ? 'text-orange-700 bg-orange-50' :
                          task.priority === 'medium' ? 'text-yellow-700 bg-yellow-50' :
                          'text-slate-500 bg-slate-100'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => !t.is_completed).length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">Nessun task attivo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-yellow-500" /> Note Recenti
                </h3>
                <button onClick={() => setIsNotesListModalOpen(true)} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {notes.slice(0, 3).map(note => (
                  <div key={note.id} onClick={() => { setEditingNote(note); setIsNoteModalOpen(true) }} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-slate-700 truncate">{note.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{note.content?.replace(/<[^>]*>/g, '').substring(0, 80) || '\u2014'}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">Nessuna nota</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visits */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-violet-500" /> Visite Recenti
                </h3>
                <button onClick={() => setIsVisitsListModalOpen(true)} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {visits.slice(0, 3).map(visit => (
                  <div key={visit.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{visit.visitor_name}</p>
                      <p className="text-xs text-slate-400 truncate">{visit.company || visit.visit_type}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 ${
                      visit.status === 'completed' ? 'text-emerald-700 bg-emerald-50' :
                      visit.status === 'in_progress' ? 'text-blue-600 bg-blue-50' :
                      visit.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                      'text-slate-500 bg-slate-100'
                    }`}>
                      {visit.status === 'completed' ? 'Completata' : visit.status === 'in_progress' ? 'In corso' : visit.status === 'cancelled' ? 'Annullata' : 'Programmata'}
                    </span>
                  </div>
                ))}
                {visits.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">Nessuna visita</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ BOTTOM CARDS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <button onClick={() => setIsMenuModalOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Vault Password</h3>
                  <p className="text-xs text-slate-400">{passwords.length} salvate</p>
                </div>
              </div>
              <span className="flex items-center text-xs text-indigo-500 font-semibold group-hover:text-indigo-700">
                Gestisci <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </button>
            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="group bg-white rounded-2xl border border-slate-200/80 p-5 text-left hover:shadow-lg hover:shadow-slate-200/50 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Bilancio Familiare</h3>
                  <p className="text-xs text-slate-400">{transactions.length} transazioni</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-600 font-semibold">+{stats.totalIncome.toFixed(0)}€</span>
                <span className="text-red-500 font-semibold">-{stats.totalExpenses.toFixed(0)}€</span>
              </div>
            </button>
          </div>
        </main>
      </div>

      {/* ═══ ALL MODALS ═══ */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl relative">
            <button onClick={() => setIsDashboardOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-slate-400"
              title="Chiudi">
              <X className="w-4 h-4" />
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
