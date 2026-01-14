'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Zap, Lock, Skull } from 'lucide-react'
import PasswordModal from './components/PasswordModal'
import { usePasswords } from './hooks/usePasswords'

interface AppCard {
  id: string
  title: string
  description: string
  icon: any
  gradient: string
}

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { passwords, addPassword } = usePasswords()

  const handleSavePassword = (data: any) => {
    addPassword(data)
    console.log('💥 PASSWORD SAVED!', data)
  }

  const apps: AppCard[] = [
    { 
      id: 'passwords', 
      title: '⚡ PASSWORDS ⚡', 
      description: `🔥 ULTRA SECRET VAULT! Maximum security mode activated! Your passwords are protected by the power of anime! 💀✨ (${passwords.length} passwords stored)`, 
      icon: Skull, 
      gradient: 'from-red-600 via-orange-500 to-yellow-400' 
    },
  ]

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
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-200 font-medium">Coming Soon</span>
            </motion.div>
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
                  Your Digital
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  Command Center
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Everything you need to manage your digital life in one beautiful, secure place
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
                    onClick={() => setIsModalOpen(true)}
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

      {/* PASSWORD MODAL! */}
      <PasswordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePassword}
      />
    </div>
  )
}
