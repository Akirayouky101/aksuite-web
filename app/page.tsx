'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Zap, Lock, Skull, LogIn, LogOut, User, Phone, UserCheck, LayoutDashboard, FileText, Calendar } from 'lucide-react'
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

interface AppCard {
  id: string
  title: string
  description: string
  icon: any
  gradient: string
}

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
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

  // Prepare available items for relations
  const availableRelationItems = {
    passwords,
    calls,
    visits,
    tasks,
    notes,
    events,
    transactions
  }

  // Initialize console guard once
  useEffect(() => {
    const guard = initConsoleGuard()
    setConsoleGuard(guard)
  }, [])

  // Manage console blocking based on auth state
  useEffect(() => {
    if (consoleGuard) {
      if (!user) {
        // Block console if not logged in
        consoleGuard.blockConsole()
      } else {
        // Unblock console if logged in
        consoleGuard.unblockConsole()
      }
    }
  }, [user, consoleGuard])

  // Load user profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setUserProfile(data)
        }
      } else {
        setUserProfile(null)
      }
    }
    loadProfile()
  }, [user])

  const handleSavePassword = (data: any) => {
    addPassword(data)
    console.log('💥 PASSWORD SAVED!', data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const apps: AppCard[] = [
    { 
      id: 'dashboard', 
      title: '📊 DASHBOARD UNIFICATA 📊', 
      description: '🎯 Vista panoramica di tutto il tuo sistema! Password, chiamate, task e budget a colpo d\'occhio! 🚀✨', 
      icon: LayoutDashboard, 
      gradient: 'from-purple-600 via-indigo-500 to-blue-400' 
    },
    { 
      id: 'passwords', 
      title: '⚡ PASSWORD ⚡', 
      description: `🔥 VAULT ULTRA SEGRETO! Modalità sicurezza massima attivata! Le tue password sono protette dal potere dell'anime! 💀✨ (${passwords.length} password salvate)`, 
      icon: Skull, 
      gradient: 'from-red-600 via-orange-500 to-yellow-400' 
    },
    { 
      id: 'budget', 
      title: '💰 BILANCIO FAMILIARE 💰', 
      description: '💸 Gestisci entrate e uscite della famiglia! Tieni traccia di ogni transazione e monitora il tuo budget mensile! 📊✨', 
      icon: Zap, 
      gradient: 'from-green-600 via-emerald-500 to-teal-400' 
    },
    {
      id: 'calls',
      title: '📞 GESTIONE CHIAMATE 📞',
      description: `🎯 Registra e gestisci le chiamate clienti! Tieni traccia dei contatti, richieste e follow-up in modo professionale! 💼✨ (${calls.length} chiamate registrate)`,
      icon: Phone,
      gradient: 'from-blue-600 via-cyan-500 to-purple-400'
    },
    {
      id: 'visits',
      title: '👥 REGISTRO VISITE 👥',
      description: `🏢 Traccia i visitatori in ufficio! Gestisci appuntamenti, riunioni, consegne e molto altro! 📋✨ (${visits.length} visite registrate)`,
      icon: UserCheck,
      gradient: 'from-purple-600 via-pink-500 to-fuchsia-400'
    },
    {
      id: 'tasks',
      title: '✓ TASK MANAGER ✓',
      description: `🚀 Organizza le tue attività! Crea task, sottotask, imposta scadenze e tieni tutto sotto controllo! ✨📋 (${tasks.length} task attivi)`,
      icon: Sparkles,
      gradient: 'from-purple-600 via-pink-500 to-cyan-400'
    },
    {
      id: 'notes',
      title: '📝 NOTE MANAGER 📝',
      description: `✨ Le tue note, sempre a portata di mano! Organizza idee, promemoria e appunti con colori, tag e cartelle! 🎨📌 (${notes.length} note salvate)`,
      icon: FileText,
      gradient: 'from-yellow-600 via-orange-500 to-pink-400'
    },
    {
      id: 'calendar',
      title: '📅 CALENDARIO EVENTI 📅',
      description: `🗓️ Gestisci i tuoi eventi! Calendario mensile, promemoria, eventi ricorrenti e tanto altro! ⏰✨ (${events.length} eventi registrati)`,
      icon: Calendar,
      gradient: 'from-indigo-600 via-blue-500 to-cyan-400'
    }
  ]

  // 🔒 BLOCCO TOTALE SE NON AUTENTICATO! 🔒
  // Show only login screen if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-orange-950 relative overflow-hidden flex items-center justify-center">
        {/* Dramatic background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.2),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,69,0,0.1)_2px,transparent_2px),linear-gradient(to_bottom,rgba(255,69,0,0.1)_2px,transparent_2px)] bg-[size:50px_50px]" />
        </div>

        {/* Floating danger symbols */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl sm:text-6xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {['🏴‍☠️', '⚠️', '🔒', '💀', '⚡'][i % 5]}
          </motion.div>
        ))}

        {/* Login card */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 max-w-2xl w-full mx-4 sm:mx-6"
        >
          <div className="bg-gradient-to-br from-red-900/50 via-orange-900/50 to-yellow-900/50 backdrop-blur-xl border-2 sm:border-4 border-yellow-400 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-[0_0_50px_rgba(255,215,0,0.5)]">
            {/* Danger tape effect */}
            <div className="absolute top-0 left-0 right-0 h-2 sm:h-4 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-4 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-90" />

            {/* Skull warning */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mb-4 sm:mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-50" />
                <Skull className="w-16 h-16 sm:w-24 sm:h-24 text-red-500 relative z-10" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Warning text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6 sm:mb-10"
            >
              <h1 className="text-3xl sm:text-6xl font-black mb-3 sm:mb-6 bg-gradient-to-r from-yellow-300 via-red-400 to-orange-500 bg-clip-text text-transparent">
                🔐 ZONA PROTETTA 🔐
              </h1>
              <p className="text-xl sm:text-3xl font-bold text-yellow-200 mb-2 sm:mb-4">
                ⚠️ ACCESSO NEGATO ⚠️
              </p>
              <p className="text-sm sm:text-xl text-yellow-100 leading-snug sm:leading-relaxed">
                Questa console è sotto massima protezione!<br />
                <span className="text-lg sm:text-2xl font-black text-red-400">VAULT ULTRA SEGRETO</span>
              </p>
              <p className="text-sm sm:text-lg text-yellow-200 mt-3 sm:mt-6 font-bold">
                🔒 Devi eseguire il <span className="text-red-400">LOGIN</span> per procedere! 🔒
              </p>
            </motion.div>

            {/* Login button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-4 sm:py-6 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 text-white text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(255,215,0,0.8)] transition-all"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <LogIn className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
                <span>ENTRA NEL VAULT!</span>
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  ⚡
                </motion.span>
              </div>
            </motion.button>

            {/* Motivational quote */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-yellow-300 font-bold text-sm sm:text-lg mt-4 sm:mt-8 italic"
            >
              "La sicurezza è potere!" 🔐✨
            </motion.p>
          </div>
        </motion.div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            console.log('🎉 Benvenuto nel vault!')
            setIsAuthModalOpen(false)
          }}
        />
      </div>
    )
  }

  // GEOMETRIC THEME (original)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 relative overflow-hidden">
      {/* Geometric background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-4 sm:pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl blur-md opacity-75" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 sm:p-2.5 rounded-xl">
                  <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                AK Suite
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-200 font-medium">Prossimamente</span>
              </motion.div>

              {user ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full transition-all"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                  <span className="text-xs sm:text-sm text-red-200 font-medium hidden sm:inline">
                    {userProfile?.full_name || user.email}
                  </span>
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/50 rounded-full transition-all"
                >
                  <LogIn className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-200 font-medium">Accedi / Registrati</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-4xl mx-auto mb-8 sm:mb-16"
            >
              <h2 className="text-4xl sm:text-7xl md:text-8xl font-black mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Il Tuo Centro
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  Di Comando Digitale
                </span>
              </h2>
              <p className="text-sm sm:text-xl text-slate-300 mb-4 sm:mb-8 max-w-2xl mx-auto">
                Tutto ciò di cui hai bisogno per gestire la tua vita digitale in un unico posto sicuro e bellissimo
              </p>
            </motion.div>

            {/* Apps Grid - Empty for now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-7xl mx-auto pb-8 sm:pb-20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {apps.length === 0 && (
                  <div className="col-span-full">
                    <div className="relative group cursor-pointer">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition" />
                      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center hover:bg-white/10 transition-all">
                        <Plus className="w-16 h-16 text-violet-400 mb-4" strokeWidth={1.5} />
                        <h3 className="text-2xl font-bold text-white mb-2">Add Your First App</h3>
                        <p className="text-slate-400 text-center">Start building your digital suite</p>
                      </div>
                    </div>
                  </div>
                )}

                {apps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.1 * index,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                    onHoverStart={() => setHoveredCard(app.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    onClick={() => {
                      if (app.id === 'dashboard') {
                        setIsDashboardOpen(true)
                      } else if (app.id === 'passwords') {
                        setIsMenuModalOpen(true)
                      } else if (app.id === 'budget') {
                        setIsBudgetMenuModalOpen(true)
                      } else if (app.id === 'calls') {
                        setIsCallMenuModalOpen(true)
                      } else if (app.id === 'visits') {
                        setIsVisitsListModalOpen(true)
                      } else if (app.id === 'tasks') {
                        setIsTasksListModalOpen(true)
                      } else if (app.id === 'notes') {
                        setIsNotesListModalOpen(true)
                      } else if (app.id === 'calendar') {
                        setIsCalendarViewOpen(true)
                      }
                    }}
                    className="relative group cursor-pointer"
                  >
                    {/* EXPLOSIVE GLOW EFFECT! */}
                    {hoveredCard === app.id && (
                      <>
                        <motion.div
                          layoutId="card-hover"
                          className={`absolute -inset-2 bg-gradient-to-r ${app.gradient} rounded-2xl blur-xl opacity-75`}
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 0.3, repeat: Infinity }}
                        />
                        {/* SPARKLES EXPLOSIONS! */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                            initial={{ 
                              x: '50%', 
                              y: '50%',
                              scale: 0 
                            }}
                            animate={{ 
                              x: `${50 + Math.cos(i * 45 * Math.PI / 180) * 100}%`,
                              y: `${50 + Math.sin(i * 45 * Math.PI / 180) * 100}%`,
                              scale: [0, 1, 0],
                            }}
                            transition={{ 
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                          />
                        ))}
                      </>
                    )}
                    
                    {/* ANIME STYLE CARD! */}
                    <div className="relative bg-gradient-to-br from-slate-900/90 via-red-900/50 to-orange-900/50 backdrop-blur-xl border-4 border-yellow-400 rounded-2xl p-4 sm:p-6 hover:border-red-500 transition-all shadow-2xl overflow-hidden flex flex-col">
                      {/* SPEED LINES BACKGROUND! */}
                      <div className="absolute inset-0 opacity-20">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute h-1 bg-white"
                            style={{
                              top: `${i * 5}%`,
                              left: '0',
                              width: '100%',
                              transformOrigin: 'right',
                            }}
                            animate={{
                              scaleX: hoveredCard === app.id ? [0, 1] : 1,
                              opacity: hoveredCard === app.id ? [0, 0.5, 0] : 0.1,
                            }}
                            transition={{
                              duration: 0.5,
                              delay: i * 0.02,
                              repeat: hoveredCard === app.id ? Infinity : 0,
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative z-10 flex flex-col h-full">
                        {/* TOP SECTION - Icon and Title */}
                        <div className="flex items-start justify-between mb-3">
                          {/* PULSATING ICON! */}
                          <motion.div 
                            className={`inline-flex p-2.5 sm:p-4 rounded-xl bg-gradient-to-br ${app.gradient} shadow-2xl relative`}
                            animate={hoveredCard === app.id ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 10, -10, 0],
                            } : {}}
                            transition={{ duration: 0.6, repeat: hoveredCard === app.id ? Infinity : 0 }}
                          >
                            {/* DANGER STRIPES! */}
                            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-yellow-500/30 rounded-xl" />
                            <app.icon className="w-7 h-7 sm:w-10 sm:h-10 text-white relative z-10" strokeWidth={3} />
                            
                            {/* ROTATING RING! */}
                            {hoveredCard === app.id && (
                              <motion.div
                                className="absolute -inset-1 border-2 border-yellow-400 rounded-xl"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              />
                            )}
                          </motion.div>

                          {/* WARNING SIGN! */}
                          <motion.div
                            animate={hoveredCard === app.id ? { 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.2, 1]
                            } : {}}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-2xl sm:text-4xl"
                          >
                            ⚠️
                          </motion.div>
                        </div>
                        
                        {/* TITLE */}
                        <motion.h3 
                          className="text-xl sm:text-3xl font-black mb-2 sm:mb-3 relative"
                          animate={hoveredCard === app.id ? {
                            scale: [1, 1.02, 1],
                          } : {}}
                          transition={{ duration: 0.3, repeat: Infinity }}
                        >
                          <span className="relative z-10 bg-gradient-to-r from-yellow-300 via-red-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl">
                            {app.title}
                          </span>
                          {/* TEXT SHADOW EFFECT! */}
                          <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent blur-sm">
                            {app.title}
                          </span>
                        </motion.h3>
                        
                        {/* DESCRIPTION */}
                        <p className="text-sm sm:text-base text-yellow-100 leading-snug sm:leading-relaxed font-bold flex-1">
                          {app.description}
                        </p>
                      </div>

                      {/* DANGER TAPE BORDER! */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-70" />
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-70" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* PASSWORD MENU MODAL */}
      <PasswordMenuModal 
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSelectNew={() => setIsPasswordModalOpen(true)}
        onSelectList={() => setIsListModalOpen(true)}
      />

      {/* PASSWORD FORM MODAL */}
      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      {/* PASSWORD LIST MODAL */}
      <PasswordListModal 
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        passwords={passwords}
        onDelete={deletePassword}
      />

      {/* BUDGET MENU MODAL */}
      <BudgetMenuModal 
        isOpen={isBudgetMenuModalOpen}
        onClose={() => setIsBudgetMenuModalOpen(false)}
        onSelectNew={() => setIsBudgetModalOpen(true)}
        onSelectView={() => setIsBudgetViewModalOpen(true)}
        onSelectRecurring={() => setIsRecurringModalOpen(true)}
        onSelectRecurringList={() => setIsRecurringListModalOpen(true)}
        onSelectLimit={() => setIsLimitModalOpen(true)}
        onSelectLimitsList={() => setIsLimitsViewModalOpen(true)}
      />

      {/* BUDGET MODAL (Add Transaction) */}
      <BudgetModal 
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={addTransaction}
      />

      {/* BUDGET VIEW MODAL (View All) */}
      <BudgetViewModal 
        isOpen={isBudgetViewModalOpen}
        onClose={() => setIsBudgetViewModalOpen(false)}
        transactions={transactions}
        onDelete={deleteTransaction}
        stats={getStats()}
      />

      {/* RECURRING MODAL (Add Recurring) */}
      <RecurringModal 
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={addRecurring}
      />

      {/* RECURRING LIST MODAL (Manage Recurring) */}
      <RecurringListModal 
        isOpen={isRecurringListModalOpen}
        onClose={() => setIsRecurringListModalOpen(false)}
        recurring={recurring}
        onToggleActive={toggleActive}
        onDelete={deleteRecurring}
      />

      {/* BUDGET LIMIT MODAL (Add Limit) */}
      <BudgetLimitModal 
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onSave={addLimit}
        existingCategories={limits.map(l => l.category)}
      />

      {/* BUDGET LIMITS VIEW MODAL (Manage Limits) */}
      <BudgetLimitsViewModal 
        isOpen={isLimitsViewModalOpen}
        onClose={() => setIsLimitsViewModalOpen(false)}
        limits={limitsStatus}
        onToggleActive={toggleLimitActive}
        onDelete={deleteLimit}
      />

      {/* CALL MENU MODAL */}
      <CallMenuModal
        isOpen={isCallMenuModalOpen}
        onClose={() => setIsCallMenuModalOpen(false)}
        onSelectNew={() => setIsCallModalOpen(true)}
        onSelectList={() => setIsCallsListModalOpen(true)}
      />

      {/* CALL MODAL (Add/Edit Call) */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false)
          setEditingCall(null)
        }}
        onSave={async (callData) => {
          let callId: string | undefined
          if (editingCall) {
            await updateCall(editingCall.id, callData)
            callId = editingCall.id
          } else {
            const newCall = await addCall(callData)
            callId = newCall?.id
          }

          // Auto-create task if follow-up is enabled
          if (callData.follow_up && callData.follow_up_date && callId) {
            const taskTitle = `Follow-up: ${callData.caller_name || 'Chiamata'}`
            const newTask = await addTask({
              title: taskTitle,
              description: `Follow-up per chiamata da ${callData.caller_name || 'contatto'}${callData.company ? ` (${callData.company})` : ''}`,
              due_date: callData.follow_up_date,
              priority: callData.priority || 'medium',
              status: 'todo',
              category: 'follow_up',
              is_recurring: false,
              recurring_type: null,
              tags: [],
              subtasks: []
            })
            
            // Link task to call
            if (newTask?.id) {
              await addRelation('call', callId, 'task', newTask.id, 'related', 'Auto-created follow-up task')
            }
          }
        }}
        editCall={editingCall}
        availableItems={availableRelationItems}
        onAddRelation={addRelation}
        onRemoveRelation={removeRelation}
        getRelatedItems={getRelatedItems}
      />

      {/* CALLS LIST MODAL (View All) */}
      <CallsListModal
        isOpen={isCallsListModalOpen}
        onClose={() => setIsCallsListModalOpen(false)}
        calls={calls}
        onDelete={deleteCall}
        onStatusChange={updateCallStatus}
        onEdit={(call) => {
          setEditingCall(call)
          setIsCallModalOpen(true)
          setIsCallsListModalOpen(false)
        }}
      />

      {/* VISIT MODAL (Add/Edit Visit) */}
      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => {
          setIsVisitModalOpen(false)
          setEditingVisit(null)
        }}
        onSave={async (visitData) => {
          let visitId: string | undefined
          if (editingVisit) {
            await updateVisit(editingVisit.id, visitData)
            visitId = editingVisit.id
          } else {
            const newVisit = await addVisit(visitData)
            visitId = newVisit?.id
          }

          // Auto-create task if follow-up is enabled
          if (visitData.follow_up && visitData.follow_up_date && visitId) {
            const taskTitle = `Follow-up: ${visitData.visitor_name || 'Visita'}`
            const newTask = await addTask({
              title: taskTitle,
              description: `Follow-up per visita di ${visitData.visitor_name || 'visitatore'}${visitData.company ? ` (${visitData.company})` : ''}`,
              due_date: visitData.follow_up_date,
              priority: visitData.priority || 'medium',
              status: 'todo',
              category: 'follow_up',
              is_recurring: false,
              recurring_type: null,
              tags: [],
              subtasks: []
            })
            
            // Link task to visit
            if (newTask?.id) {
              await addRelation('visit', visitId, 'task', newTask.id, 'related', 'Auto-created follow-up task')
            }
          }
        }}
        editVisit={editingVisit}
      />

      {/* VISITS LIST MODAL (View All) */}
      <VisitsListModal
        isOpen={isVisitsListModalOpen}
        onClose={() => setIsVisitsListModalOpen(false)}
        visits={visits}
        onDelete={deleteVisit}
        onStatusChange={updateVisitStatus}
        onEdit={(visit) => {
          setEditingVisit(visit)
          setIsVisitModalOpen(true)
          setIsVisitsListModalOpen(false)
        }}
        onNew={() => {
          setEditingVisit(null)
          setIsVisitModalOpen(true)
        }}
      />

      {/* TASK MODAL (Add/Edit Task) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={async (task) => { await addTask(task) }}
        editTask={null}
        availableItems={availableRelationItems}
        onAddRelation={addRelation}
        onRemoveRelation={removeRelation}
        getRelatedItems={getRelatedItems}
      />

      {/* TASKS LIST MODAL (View All) */}
      <TasksListModal
        isOpen={isTasksListModalOpen}
        onClose={() => setIsTasksListModalOpen(false)}
        tasks={tasks}
        onDelete={deleteTask}
        onToggleComplete={toggleComplete}
        onUpdate={updateTask}
        onAdd={async (task) => { await addTask(task) }}
      />

      {/* UNIFIED DASHBOARD 📊 */}
      {isDashboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsDashboardOpen(false)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>

            <UnifiedDashboard
              passwords={passwords}
              calls={calls}
              tasks={tasks}
              transactions={transactions}
              onOpenPasswords={() => {
                setIsDashboardOpen(false)
                setIsMenuModalOpen(true)
              }}
              onOpenCalls={() => {
                setIsDashboardOpen(false)
                setIsCallMenuModalOpen(true)
              }}
              onOpenTasks={() => {
                setIsDashboardOpen(false)
                setIsTasksListModalOpen(true)
              }}
              onOpenBudget={() => {
                setIsDashboardOpen(false)
                setIsBudgetMenuModalOpen(true)
              }}
              onNewPassword={() => {
                setIsDashboardOpen(false)
                setIsPasswordModalOpen(true)
              }}
              onNewCall={() => {
                setIsDashboardOpen(false)
                setIsCallModalOpen(true)
              }}
              onNewTask={() => {
                setIsDashboardOpen(false)
                setIsTaskModalOpen(true)
              }}
              onNewTransaction={() => {
                setIsDashboardOpen(false)
                setIsBudgetModalOpen(true)
              }}
            />
          </motion.div>
        </div>
      )}

      {/* NOTE MODAL (Create/Edit) */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false)
          setEditingNote(null)
        }}
        onSave={(noteData) => {
          if (editingNote) {
            updateNote(editingNote.id, noteData)
          } else {
            addNote(noteData)
          }
        }}
        editNote={editingNote}
        availableItems={availableRelationItems}
        onAddRelation={addRelation}
        onRemoveRelation={removeRelation}
        getRelatedItems={getRelatedItems}
      />

      {/* NOTES LIST MODAL (View All) */}
      <NotesListModal
        isOpen={isNotesListModalOpen}
        onClose={() => setIsNotesListModalOpen(false)}
        notes={notes}
        onDelete={deleteNote}
        onUpdate={updateNote}
        onTogglePin={togglePin}
        onEdit={(note) => {
          setEditingNote(note)
          setIsNoteModalOpen(true)
        }}
        onAdd={() => {
          setEditingNote(null)
          setIsNoteModalOpen(true)
        }}
      />

      {/* EVENT MODAL (Create/Edit) */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setEditingEvent(null)
        }}
        onSave={(eventData) => {
          if (editingEvent) {
            updateEvent(editingEvent.id, eventData)
          } else {
            addEvent(eventData)
          }
        }}
        editEvent={editingEvent}
        availableItems={availableRelationItems}
        onAddRelation={addRelation}
        onRemoveRelation={removeRelation}
        getRelatedItems={getRelatedItems}
      />

      {/* CALENDAR VIEW */}
      <CalendarView
        isOpen={isCalendarViewOpen}
        onClose={() => setIsCalendarViewOpen(false)}
        events={events}
        tasks={tasks}
        onDelete={deleteEvent}
        onEdit={(event) => {
          setEditingEvent(event)
          setIsEventModalOpen(true)
        }}
        onAdd={() => {
          setEditingEvent(null)
          setIsEventModalOpen(true)
        }}
      />

      {/* AUTH MODAL! */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => console.log('🎉 Logged in successfully!')}
      />
    </div>
  )
}
