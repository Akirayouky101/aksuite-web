'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Zap, Lock, Skull, LogIn, LogOut, User } from 'lucide-react'
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
import AuthModal from './components/AuthModal'
import { usePasswords } from './hooks/usePasswords'
import { useBudget } from './hooks/useBudget'
import { useRecurring } from './hooks/useRecurring'
import { useBudgetLimits } from './hooks/useBudgetLimits'
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [consoleGuard, setConsoleGuard] = useState<any>(null)
  const { passwords, addPassword, user, deletePassword } = usePasswords()
  const { transactions, addTransaction, deleteTransaction, getStats } = useBudget()
  const { recurring, addRecurring, deleteRecurring, toggleActive } = useRecurring()
  const { limits, limitsStatus, addLimit, deleteLimit, toggleActive: toggleLimitActive } = useBudgetLimits()

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
            className="absolute text-6xl opacity-20"
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
          className="relative z-10 max-w-2xl w-full mx-6"
        >
          <div className="bg-gradient-to-br from-red-900/50 via-orange-900/50 to-yellow-900/50 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl p-12 shadow-[0_0_50px_rgba(255,215,0,0.5)]">
            {/* Danger tape effect */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-90" />

            {/* Skull warning */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-50" />
                <Skull className="w-24 h-24 text-red-500 relative z-10" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Warning text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-red-400 to-orange-500 bg-clip-text text-transparent">
                🔐 ZONA PROTETTA 🔐
              </h1>
              <p className="text-3xl font-bold text-yellow-200 mb-4">
                ⚠️ ACCESSO NEGATO ⚠️
              </p>
              <p className="text-xl text-yellow-100 leading-relaxed">
                Questa console è sotto massima protezione!<br />
                <span className="text-2xl font-black text-red-400">VAULT ULTRA SEGRETO</span>
              </p>
              <p className="text-lg text-yellow-200 mt-6 font-bold">
                🔒 Devi eseguire il <span className="text-red-400">LOGIN</span> per procedere! 🔒
              </p>
            </motion.div>

            {/* Login button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-6 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 text-white text-2xl font-black rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(255,215,0,0.8)] transition-all"
            >
              <div className="flex items-center justify-center gap-3">
                <LogIn className="w-8 h-8" strokeWidth={3} />
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
              className="text-center text-yellow-300 font-bold text-lg mt-8 italic"
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
        <header className="container mx-auto px-6 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl blur-md opacity-75" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                  <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                AK Suite
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-200 font-medium">Prossimamente</span>
              </motion.div>

              {user ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full transition-all"
                >
                  <User className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-200 font-medium">
                    {userProfile?.full_name || user.email}
                  </span>
                  <LogOut className="w-4 h-4 text-red-400" />
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
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-4xl mx-auto mb-16"
            >
              <h2 className="text-7xl md:text-8xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Il Tuo Centro
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  Di Comando Digitale
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Tutto ciò di cui hai bisogno per gestire la tua vita digitale in un unico posto sicuro e bellissimo
              </p>
            </motion.div>

            {/* Apps Grid - Empty for now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      if (app.id === 'passwords') {
                        setIsMenuModalOpen(true)
                      } else if (app.id === 'budget') {
                        setIsBudgetMenuModalOpen(true)
                      }
                    }}
                    className="relative group cursor-pointer col-span-full"
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
                    <div className="relative bg-gradient-to-br from-slate-900/90 via-red-900/50 to-orange-900/50 backdrop-blur-xl border-4 border-yellow-400 rounded-2xl p-8 hover:border-red-500 transition-all shadow-2xl overflow-hidden">
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

                      <div className="relative z-10 flex items-center gap-6">
                        {/* PULSATING ICON! */}
                        <motion.div 
                          className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${app.gradient} shadow-2xl relative`}
                          animate={hoveredCard === app.id ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 360],
                          } : {}}
                          transition={{ duration: 0.6, repeat: hoveredCard === app.id ? Infinity : 0 }}
                        >
                          {/* DANGER STRIPES! */}
                          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-yellow-500/30 rounded-2xl" />
                          <app.icon className="w-12 h-12 text-white relative z-10" strokeWidth={3} />
                          
                          {/* ROTATING RING! */}
                          <motion.div
                            className="absolute -inset-2 border-4 border-yellow-400 rounded-2xl"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          />
                        </motion.div>
                        
                        <div className="flex-1">
                          {/* EXPLOSIVE TITLE! */}
                          <motion.h3 
                            className="text-4xl font-black mb-3 relative"
                            animate={hoveredCard === app.id ? {
                              scale: [1, 1.05, 1],
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
                          
                          {/* DESCRIPTION WITH TYPING EFFECT! */}
                          <p className="text-lg text-yellow-100 leading-relaxed font-bold tracking-wide">
                            {app.description}
                          </p>
                        </div>

                        {/* WARNING SIGNS! */}
                        <div className="flex flex-col gap-2">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-6xl"
                          >
                            ⚠️
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-6xl"
                          >
                            💥
                          </motion.div>
                        </div>
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

      {/* AUTH MODAL! */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => console.log('🎉 Logged in successfully!')}
      />
    </div>
  )
}
