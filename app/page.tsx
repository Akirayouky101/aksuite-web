'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, FileText, Calendar, Users, Bookmark, CheckSquare, DollarSign, Folder, Shield, Sparkles, ArrowRight, Zap } from 'lucide-react'

interface AppCard {
  id: string
  title: string
  description: string
  icon: any
  gradient: string
}

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const apps: AppCard[] = [
    { id: 'passwords', title: 'Passwords', description: 'Secure vault for all your credentials', icon: Lock, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'notes', title: 'Notes', description: 'Capture ideas and organize thoughts', icon: FileText, gradient: 'from-amber-500 to-orange-500' },
    { id: 'calendar', title: 'Calendar', description: 'Schedule events and manage time', icon: Calendar, gradient: 'from-red-500 to-pink-500' },
    { id: 'contacts', title: 'Contacts', description: 'Keep your network organized', icon: Users, gradient: 'from-purple-500 to-violet-500' },
    { id: 'bookmarks', title: 'Bookmarks', description: 'Save and organize your web resources', icon: Bookmark, gradient: 'from-fuchsia-500 to-pink-500' },
    { id: 'tasks', title: 'Tasks', description: 'Track and complete your to-dos', icon: CheckSquare, gradient: 'from-emerald-500 to-green-500' },
    { id: 'finance', title: 'Finance', description: 'Monitor expenses and budgets', icon: DollarSign, gradient: 'from-indigo-500 to-blue-500' },
    { id: 'documents', title: 'Documents', description: 'Store and manage your files', icon: Folder, gradient: 'from-cyan-500 to-teal-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated gradient orbs background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="container mx-auto px-6 pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-75" />
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl">
                  <Zap className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-7xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
            >
              AK Suite
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl text-purple-200 mb-3 font-medium"
            >
              Your Digital Command Center
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-purple-300/70 mb-8"
            >
              Manage passwords, notes, tasks, and more—all in one beautiful place
            </motion.p>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full text-white font-bold text-lg shadow-xl shadow-purple-500/50 transition-all"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>

        {/* Apps Grid */}
        <div className="container mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {apps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onHoverStart={() => setHoveredCard(app.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="group cursor-pointer"
              >
                <div className="relative h-full">
                  {/* Glow effect */}
                  {hoveredCard === app.id && (
                    <motion.div
                      layoutId="card-glow"
                      className={`absolute -inset-0.5 bg-gradient-to-r ${app.gradient} rounded-2xl blur opacity-75`}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Card */}
                  <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20">
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${app.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <app.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all">
                      {app.title}
                    </h3>

                    {/* Description */}
                    <p className="text-purple-200/60 text-sm leading-relaxed group-hover:text-purple-200/80 transition-colors">
                      {app.description}
                    </p>

                    {/* Arrow indicator */}
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-8 right-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75" />
            <div className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold shadow-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Coming Soon</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
