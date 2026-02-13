'use client'

import { useState, useEffect } from 'react'
import {
  Lock, LogIn, LogOut, User, Phone, UserCheck, LayoutDashboard,
  DollarSign, CheckSquare, StickyNote, ChevronRight, Plus,
  TrendingUp, Clock, Calendar, Menu, X, Shield, Zap, ArrowUpRight
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-[#131920]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AK Suite</h1>
              <p className="text-white/40 mt-2 text-sm">Gestione professionale sicura</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Accedi
            </button>
            <p className="text-center text-xs text-white/20 mt-6">Ambiente crittografato end-to-end</p>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => setIsDashboardOpen(true), accent: 'from-teal-400 to-cyan-400' },
    { id: 'passwords', label: 'Password', icon: Lock, onClick: () => setIsMenuModalOpen(true), accent: 'from-amber-400 to-orange-400' },
    { id: 'calls', label: 'Chiamate', icon: Phone, onClick: () => setIsCallMenuModalOpen(true), accent: 'from-green-400 to-emerald-400', badge: pendingCalls },
    { id: 'visits', label: 'Visite', icon: UserCheck, onClick: () => setIsVisitsListModalOpen(true), accent: 'from-violet-400 to-purple-400' },
    { id: 'tasks', label: 'Task', icon: CheckSquare, onClick: () => setIsTasksListModalOpen(true), accent: 'from-cyan-400 to-blue-400', badge: activeTasks },
    { id: 'notes', label: 'Note', icon: StickyNote, onClick: () => setIsNotesListModalOpen(true), accent: 'from-yellow-400 to-amber-400' },
    { id: 'calendar', label: 'Calendario', icon: Calendar, onClick: () => setIsCalendarViewOpen(true), accent: 'from-indigo-400 to-violet-400', badge: todayEvents },
    { id: 'budget', label: 'Bilancio', icon: DollarSign, onClick: () => setIsBudgetMenuModalOpen(true), accent: 'from-emerald-400 to-teal-400' },
  ]

  const quickActions = [
    { label: 'Chiamata', icon: Phone, onClick: () => setIsCallModalOpen(true), cls: 'text-green-400 hover:bg-green-400/10 border-green-400/20' },
    { label: 'Task', icon: CheckSquare, onClick: () => setIsTaskModalOpen(true), cls: 'text-cyan-400 hover:bg-cyan-400/10 border-cyan-400/20' },
    { label: 'Nota', icon: StickyNote, onClick: () => { setEditingNote(null); setIsNoteModalOpen(true) }, cls: 'text-yellow-400 hover:bg-yellow-400/10 border-yellow-400/20' },
    { label: 'Evento', icon: Calendar, onClick: () => { setEditingEvent(null); setIsEventModalOpen(true) }, cls: 'text-indigo-400 hover:bg-indigo-400/10 border-indigo-400/20' },
    { label: 'Visita', icon: UserCheck, onClick: () => { setEditingVisit(null); setIsVisitModalOpen(true) }, cls: 'text-violet-400 hover:bg-violet-400/10 border-violet-400/20' },
    { label: 'Transazione', icon: DollarSign, onClick: () => setIsBudgetModalOpen(true), cls: 'text-emerald-400 hover:bg-emerald-400/10 border-emerald-400/20' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <header className="bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors" title="Menu">
              <Menu className="w-5 h-5 text-white/60" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">AK Suite</span>
              <span className="hidden sm:inline text-xs text-white/20 font-medium ml-1">v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40">Online</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all">
              <div className="w-7 h-7 bg-white/[0.06] rounded-full flex items-center justify-center border border-white/[0.06]">
                <User className="w-3.5 h-3.5 text-white/50" />
              </div>
              <span className="hidden sm:inline text-xs font-medium">{userProfile?.full_name || user.email}</span>
              <LogOut className="w-3.5 h-3.5 text-white/30" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed lg:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-60 bg-[#0d1117]/95 backdrop-blur-xl border-r border-white/[0.06] z-40 transition-transform duration-200 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-3 space-y-0.5">
            <p className="px-3 pt-3 pb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">Navigazione</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { item.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.accent} flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity shadow-sm`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/20">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <div className="border-t border-white/[0.04] my-3" />
            <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">Crea Nuovo</p>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-white/30 hover:text-white/60 transition-all border border-transparent hover:border-white/[0.04]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-3.5rem)]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white/90 tracking-tight">
              Bentornato{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
            </h2>
            <p className="text-white/30 mt-1 text-sm">Panoramica operativa</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <button onClick={() => setIsCallMenuModalOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-green-400/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/10">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                {pendingCalls > 0 && <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">{pendingCalls} pending</span>}
              </div>
              <p className="text-2xl font-bold text-white/90 tabular-nums">{calls.length}</p>
              <p className="text-xs text-white/30 mt-0.5">Chiamate</p>
            </button>
            <button onClick={() => setIsTasksListModalOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-cyan-400/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                {activeTasks > 0 && <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">{activeTasks} attivi</span>}
              </div>
              <p className="text-2xl font-bold text-white/90 tabular-nums">{tasks.length}</p>
              <p className="text-xs text-white/30 mt-0.5">Task</p>
            </button>
            <button onClick={() => setIsCalendarViewOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-indigo-400/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                {todayEvents > 0 && <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-400/10 px-2 py-0.5 rounded-full border border-indigo-400/20">{todayEvents} oggi</span>}
              </div>
              <p className="text-2xl font-bold text-white/90 tabular-nums">{events.length}</p>
              <p className="text-xs text-white/30 mt-0.5">Eventi</p>
            </button>
            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-emerald-400/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(0)}€
              </p>
              <p className="text-xs text-white/30 mt-0.5">Bilancio</p>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] mb-3">Azioni Rapide</h3>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <button key={i} onClick={action.onClick} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${action.cls}`}>
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-green-400" /> Chiamate Recenti
                </h3>
                <button onClick={() => setIsCallsListModalOpen(true)} className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {calls.slice(0, 4).map(call => (
                  <div key={call.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/80 truncate">{call.caller_name}</p>
                      <p className="text-xs text-white/30 truncate">{call.company || call.phone || '\u2014'}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-3 border ${
                      call.status === 'completed' ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' :
                      call.status === 'cancelled' ? 'text-red-300 bg-red-400/10 border-red-400/20' :
                      'text-amber-300 bg-amber-400/10 border-amber-400/20'
                    }`}>
                      {call.status === 'completed' ? 'Completata' : call.status === 'cancelled' ? 'Annullata' : 'In attesa'}
                    </span>
                  </div>
                ))}
                {calls.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Phone className="w-6 h-6 mx-auto mb-2 text-white/10" />
                    <p className="text-xs text-white/20">Nessuna chiamata</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> Task Attivi
                </h3>
                <button onClick={() => setIsTasksListModalOpen(true)} className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5">
                  Tutti <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {tasks.filter(t => !t.is_completed).slice(0, 4).map(task => (
                  <div key={task.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/80 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.due_date && (
                          <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(task.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                          task.priority === 'urgent' ? 'text-red-300 bg-red-400/10 border-red-400/20' :
                          task.priority === 'high' ? 'text-orange-300 bg-orange-400/10 border-orange-400/20' :
                          task.priority === 'medium' ? 'text-yellow-300 bg-yellow-400/10 border-yellow-400/20' :
                          'text-white/30 bg-white/5 border-white/10'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-3 border ${
                      task.status === 'in-progress' ? 'text-blue-300 bg-blue-400/10 border-blue-400/20' : 'text-white/30 bg-white/5 border-white/10'
                    }`}>
                      {task.status === 'in-progress' ? 'In corso' : 'Da fare'}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => !t.is_completed).length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <CheckSquare className="w-6 h-6 mx-auto mb-2 text-white/10" />
                    <p className="text-xs text-white/20">Nessun task attivo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-yellow-400" /> Note Recenti
                </h3>
                <button onClick={() => setIsNotesListModalOpen(true)} className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {notes.slice(0, 3).map(note => (
                  <div key={note.id} onClick={() => { setEditingNote(note); setIsNoteModalOpen(true) }} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-white/80 truncate">{note.title}</p>
                    <p className="text-xs text-white/25 truncate mt-0.5">{note.content?.replace(/<[^>]*>/g, '').substring(0, 80) || '\u2014'}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <StickyNote className="w-6 h-6 mx-auto mb-2 text-white/10" />
                    <p className="text-xs text-white/20">Nessuna nota</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-violet-400" /> Visite Recenti
                </h3>
                <button onClick={() => setIsVisitsListModalOpen(true)} className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5">
                  Tutte <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {visits.slice(0, 3).map(visit => (
                  <div key={visit.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/80 truncate">{visit.visitor_name}</p>
                      <p className="text-xs text-white/30 truncate">{visit.company || visit.visit_type}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-3 border ${
                      visit.status === 'completed' ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' :
                      visit.status === 'in_progress' ? 'text-blue-300 bg-blue-400/10 border-blue-400/20' :
                      visit.status === 'cancelled' ? 'text-red-300 bg-red-400/10 border-red-400/20' :
                      'text-white/30 bg-white/5 border-white/10'
                    }`}>
                      {visit.status === 'completed' ? 'Completata' : visit.status === 'in_progress' ? 'In corso' : visit.status === 'cancelled' ? 'Annullata' : 'Programmata'}
                    </span>
                  </div>
                ))}
                {visits.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <UserCheck className="w-6 h-6 mx-auto mb-2 text-white/10" />
                    <p className="text-xs text-white/20">Nessuna visita</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <button onClick={() => setIsMenuModalOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-amber-400/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/80">Vault Password</h3>
                  <p className="text-xs text-white/30">{passwords.length} salvate</p>
                </div>
              </div>
              <span className="flex items-center text-xs text-teal-400 font-medium group-hover:text-teal-300">
                Gestisci <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </button>
            <button onClick={() => setIsBudgetMenuModalOpen(true)} className="group bg-[#131920]/60 backdrop-blur rounded-xl border border-white/[0.06] p-4 text-left hover:border-emerald-400/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/80">Bilancio Familiare</h3>
                  <p className="text-xs text-white/30">{transactions.length} transazioni</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-medium">+{stats.totalIncome.toFixed(0)}€</span>
                <span className="text-red-400 font-medium">-{stats.totalExpenses.toFixed(0)}€</span>
              </div>
            </button>
          </div>
        </main>
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-[#0d1117] rounded-2xl border border-white/[0.06] relative">
            <button onClick={() => setIsDashboardOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/[0.06] hover:border-red-500/30 flex items-center justify-center transition-all"
              title="Chiudi">
              <X className="w-4 h-4 text-white/60" />
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
