'use client'

import { useState } from 'react'
import { Phone, DollarSign, Lock, ClipboardList, Calendar, FileText, MapPin, Bell, Search, Settings, Plus, TrendingUp, TrendingDown, ChevronRight, Star } from 'lucide-react'

const sampleStats = [
  { label: 'Chiamate', value: 24, icon: Phone, trend: '+12%', color: 'from-blue-500 to-indigo-600' },
  { label: 'Budget', value: '€3.240', icon: DollarSign, trend: '+8%', color: 'from-emerald-500 to-teal-600' },
  { label: 'Task', value: 18, icon: ClipboardList, trend: '-3%', color: 'from-amber-500 to-orange-600' },
  { label: 'Eventi', value: 7, icon: Calendar, trend: '+5%', color: 'from-rose-500 to-pink-600' },
]

const sampleActivities = [
  { text: 'Chiamata con Mario Rossi', time: '2 ore fa', icon: Phone },
  { text: 'Spesa supermercato - 85.50 euro', time: '4 ore fa', icon: DollarSign },
  { text: 'Completato: Preventivo cliente', time: 'Ieri', icon: ClipboardList },
  { text: 'Riunione team ore 15:00', time: 'Domani', icon: Calendar },
  { text: 'Appunti progetto nuovo', time: '2 giorni fa', icon: FileText },
]

const navItems = [
  { icon: Phone, label: 'Chiamate', count: 24 },
  { icon: DollarSign, label: 'Budget', count: 12 },
  { icon: Lock, label: 'Password', count: 8 },
  { icon: ClipboardList, label: 'Task', count: 18 },
  { icon: Calendar, label: 'Calendario', count: 7 },
  { icon: FileText, label: 'Note', count: 15 },
  { icon: MapPin, label: 'Visite', count: 5 },
]

export default function PreviewD() {
  const [activeNav, setActiveNav] = useState('Chiamate')

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Light mesh gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50" />
      <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-150px] right-[-80px] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-[100px]" />
      <div className="fixed top-[40%] left-[50%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[80px]" />
      <div className="fixed top-[20%] right-[20%] w-[300px] h-[300px] bg-rose-200/15 rounded-full blur-[80px]" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar glass on light */}
        <aside className="w-[270px] border-r border-slate-200/60 bg-white/60 backdrop-blur-2xl flex flex-col">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg tracking-tight">AK Suite</h1>
                <p className="text-slate-400 text-xs">Gestione Premium</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100/70 border border-slate-200/50">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm">Cerca...</span>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button key={item.label} onClick={() => setActiveNav(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeNav === item.label
                    ? 'bg-white text-slate-800 shadow-md shadow-slate-200/60 border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 border border-transparent'
                }`}>
                <item.icon className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeNav === item.label ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'
                }`}>{item.count}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">AK</div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-sm font-medium">Admin</p>
                <p className="text-slate-400 text-xs">Online</p>
              </div>
              <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 px-8 py-5 border-b border-slate-200/50 bg-white/40 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
                <p className="text-slate-400 text-sm mt-0.5">Benvenuto, ecco il riepilogo</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm transition-all">
                  <Bell className="w-[18px] h-[18px]" />
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />Nuovo
                </button>
              </div>
            </div>
          </header>

          <div className="p-8 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sampleStats.map((stat) => (
                <div key={stat.label} className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-slate-200/50`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'
                    }`}>
                      {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity */}
              <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold">Attivita Recenti</h3>
                  <button className="text-indigo-500 text-sm hover:text-indigo-700 font-medium transition-colors">Vedi tutto</button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {sampleActivities.map((a, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/60 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-slate-100/80 flex items-center justify-center">
                        <a.icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-medium truncate">{a.text}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{a.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-slate-800 font-semibold">Azioni Rapide</h3>
                </div>
                <div className="p-4 space-y-2">
                  {navItems.slice(0, 5).map((item) => (
                    <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 border border-slate-200/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all text-left">
                      <item.icon className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-600 text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Preview */}
            <div className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-slate-800 font-semibold mb-4">Anteprima Modale</h3>
              <div className="max-w-lg mx-auto">
                <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-slate-800 font-semibold">Nuova Chiamata</h4>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer transition-all">x</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2 block">Nome Cliente</label>
                      <div className="px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 text-sm">Mario Rossi</div>
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2 block">Telefono</label>
                      <div className="px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 text-sm">+39 333 1234567</div>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                      Salva Chiamata
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/30">
        LAYOUT D — Glassmorphism CHIARO (struttura A + sfondo light pastello)
      </div>
    </div>
  )
}
