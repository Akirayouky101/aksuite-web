'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, FileText, Calendar, Bookmark, CheckSquare, DollarSign, FolderOpen, LogIn } from 'lucide-react'
import PasswordModal from './components/PasswordModal'
import PasswordMenuModal from './components/PasswordMenuModal'
import PasswordListModal from './components/PasswordListModal'
import AuthModal from './components/AuthModal'
import MobileBottomNav from './components/MobileBottomNav'
import MobileCard from './components/MobileCard'
import MobileHeader from './components/MobileHeader'
import { usePasswords } from './hooks/usePasswords'
import { supabase } from '@/lib/supabase'
import { initConsoleGuard } from '@/lib/console-guard'

export default function Home() {
  const [activeApp, setActiveApp] = useState('passwords')
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [consoleGuard, setConsoleGuard] = useState<any>(null)
  const { passwords, addPassword, user, deletePassword } = usePasswords()

  // Initialize console guard once
  useEffect(() => {
    const guard = initConsoleGuard()
    setConsoleGuard(guard)
  }, [])

  // Manage console blocking based on auth state
  useEffect(() => {
    if (consoleGuard) {
      if (!user) {
        consoleGuard.blockConsole()
      } else {
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

  // App cards data
  const apps = [
    { 
      id: 'passwords',
      title: 'PASSWORD',
      description: `Vault ultra segreto! Modalità sicurezza massima attivata! 🔥`,
      icon: Lock,
      gradient: 'from-red-600 via-orange-500 to-yellow-400',
      emoji: '🔐',
      count: passwords.length
    },
    {
      id: 'notes',
      title: 'NOTE',
      description: 'Appunti, idee e pensieri sempre a portata di mano! 📝',
      icon: FileText,
      gradient: 'from-blue-600 via-cyan-500 to-teal-400',
      emoji: '📝',
      count: 0
    },
    {
      id: 'calendar',
      title: 'CALENDARIO',
      description: 'Organizza eventi e impegni importanti! 📅',
      icon: Calendar,
      gradient: 'from-purple-600 via-pink-500 to-rose-400',
      emoji: '📅',
      count: 0
    },
    {
      id: 'bookmarks',
      title: 'SEGNALIBRI',
      description: 'Salva i tuoi link preferiti del web! 🔖',
      icon: Bookmark,
      gradient: 'from-emerald-600 via-green-500 to-lime-400',
      emoji: '🔖',
      count: 0
    },
    {
      id: 'tasks',
      title: 'ATTIVITÀ',
      description: 'Lista delle cose da fare e completare! ✓',
      icon: CheckSquare,
      gradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
      emoji: '✅',
      count: 0
    },
    {
      id: 'finance',
      title: 'FINANZE',
      description: 'Gestisci budget e spese personali! 💰',
      icon: DollarSign,
      gradient: 'from-amber-600 via-yellow-500 to-orange-400',
      emoji: '💰',
      count: 0
    },
    {
      id: 'documents',
      title: 'DOCUMENTI',
      description: 'Archivia file importanti in sicurezza! 📁',
      icon: FolderOpen,
      gradient: 'from-slate-600 via-gray-500 to-zinc-400',
      emoji: '📁',
      count: 0
    },
  ]

  // Handle app selection from bottom nav
  const handleAppSelect = (appId: string) => {
    setActiveApp(appId)
  }

  // Handle card click
  const handleCardClick = (appId: string) => {
    if (appId === 'passwords') {
      setIsMenuModalOpen(true)
    } else {
      // Placeholder for other apps
      console.log(`App ${appId} coming soon!`)
    }
  }

  // 🔒 LOGIN SCREEN FOR MOBILE
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 
                      relative overflow-hidden flex items-center justify-center px-4">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.1)_2px,transparent_2px),linear-gradient(to_bottom,rgba(139,92,246,0.1)_2px,transparent_2px)] bg-[size:40px_40px]" />
        </div>

        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-10 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-fuchsia-600/30 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Login Content */}
        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
          >
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              AK SUITE
            </h1>
            <p className="text-purple-400 font-medium">Mobile Edition</p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 
                      border-2 border-purple-500/30 shadow-2xl shadow-purple-900/50"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-black text-white mb-2 text-center">
              🔒 ACCESSO RICHIESTO
            </h2>
            <p className="text-purple-300 text-center mb-6 text-sm">
              Effettua il login per accedere alle tue app
            </p>

            <motion.button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-fuchsia-600
                        rounded-full font-black text-white text-lg
                        border-2 border-white/20 shadow-lg shadow-purple-600/50
                        flex items-center justify-center gap-3"
              whileTap={{ scale: 0.98 }}
            >
              <LogIn size={24} />
              ACCEDI
            </motion.button>
          </motion.div>

          {/* Security badges */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-purple-400">
            <span className="flex items-center gap-1">
              🔐 AES-256
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              🛡️ Sicuro
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              ☁️ Cloud Sync
            </span>
          </div>
        </motion.div>

        <AuthModal onSuccess={() => {}} 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    )
  }

  // 🎯 MAIN APP - MOBILE OPTIMIZED
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 
                    relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.1)_2px,transparent_2px),linear-gradient(to_bottom,rgba(139,92,246,0.1)_2px,transparent_2px)] bg-[size:40px_40px]" />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="fixed top-20 left-5 w-32 h-32 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-40 right-5 w-32 h-32 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none"
        animate={{ y: [0, -30, 0], x: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Mobile Header */}
      <MobileHeader
        userName={userProfile?.full_name}
        userEmail={user.email}
        onLogout={handleLogout}
      />

      {/* Main Content - Scrollable with padding for header/nav */}
      <main className="relative pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-black text-white mb-2">
              👋 Ciao, {userProfile?.full_name?.split(' ')[0] || 'User'}!
            </h2>
            <p className="text-purple-400 text-sm">
              Scegli un'app per iniziare
            </p>
          </motion.div>

          {/* Apps Grid - Vertical Stack for Mobile */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {apps.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MobileCard
                    title={app.title}
                    description={app.description}
                    icon={app.icon}
                    gradient={app.gradient}
                    emoji={app.emoji}
                    count={app.count}
                    onClick={() => handleCardClick(app.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeApp={activeApp}
        onAppSelect={handleAppSelect}
      />

      {/* Modals */}
      <PasswordMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSelectNew={() => {
          setIsMenuModalOpen(false)
          setIsPasswordModalOpen(true)
        }}
        onSelectList={() => {
          setIsMenuModalOpen(false)
          setIsListModalOpen(true)
        }}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      <PasswordListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        passwords={passwords}
        onDelete={deletePassword}
      />
    </div>
  )
}
