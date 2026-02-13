'use client'

import { useState } from 'react'
import { Phone, DollarSign, Lock, ClipboardList, Calendar, FileText, MapPin, Bell, Search, Plus, ChevronRight, LayoutGrid, LogOut, TrendingUp, TrendingDown, MoreHorizontal, Zap } from 'lucide-react'

const stats = [
  { label: 'Chiamate', value: '24', trend: '+12%', up: true, icon: Phone, iconBg: 'bg-sky-100 text-sky-600' },
  { label: 'Budget Mese', value: '€4.580', trend: '+8%', up: true, icon: DollarSign, iconBg: 'bg-emerald-100 text-emerald-600' },
  { label: 'Task Aperti', value: '18', trend: '-3', up: false, icon: ClipboardList, iconBg: 'bg-amber-100 text-amber-600' },
  { label: 'Prossimi Eventi', value: '7', trend: '+2', up: true, icon: Calendar, iconBg: 'bg-purple-100 text-purple-600' },
]

const activities = [
  { text: 'Chiamata con Mario Rossi', time: '2h fa', icon: Phone, dot: 'bg-sky-500' },
  { text: 'Spesa supermercato €85.50', time: '4h fa', icon: DollarSign, dot: 'bg-red-500' },
  { text: 'Completato: Preventivo', time: 'Ieri', icon: ClipboardList, dot: 'bg-emerald-500' },
  { text: 'Riunione team alle 15:00', time: 'Domani', icon: Calendar, dot: 'bg-purple-500' },
  { text: 'Nota progetto aggiornata', time: '2gg fa', icon: FileText, dot: 'bg-slate-400' },
]

const nav = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Phone, label: 'Chiamate' },
  { icon: MapPin, label: 'Visite' },
  { icon: ClipboardList, label: 'Task' },
  { icon: Calendar, label: 'Calendario' },
  { icon: FileText, label: 'Note' },
  { icon: DollarSign, label: 'Budget' },
  { icon: Lock, label: 'Password' },
]

export default function PreviewC() {
  const [active, setActive] = useState('Dashboard')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Dark sidebar */}
      <aside className="w-[72px] bg-slate-900 flex flex-col items-center h-screen sticky top-0 py-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6">
          <Zap className="w-5 h-5 text-white" />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1">
          {nav.map((item) => (
            <button key={item.label} onClick={() => setActive(item.label)}
              title={item.label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                active === item.label
                  ? 'bg-white text-slate-900 shadow-lg shadow-black/20'
                  : 'text-slate-500 hover:text-white hover:bg-white/10'
              }`}>
              <item.icon className="w-[18px] h-[18px]" />
            </button>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/10 mt-2">
          <button className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Esci">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">AK</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-400 text-sm w-64">
              <Search className="w-3.5 h-3.5" />
              <span>Cerca ovunque...</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200">
              <Plus className="w-4 h-4" /> Nuovo
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-500 font-medium">Home</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-medium">Dashboard</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-500 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[26px] font-bold text-slate-900 tracking-tight leading-none">{s.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-400 text-sm">{s.label}</p>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${s.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                    {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {s.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Activity Timeline */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Timeline Attivita</h3>
                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">Vedi tutto</button>
              </div>
              <div className="p-5">
                <div className="space-y-0">
                  {activities.map((a, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${a.dot} ring-4 ring-white`} />
                        {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                      </div>
                      <div className={`flex-1 ${i < activities.length - 1 ? 'pb-5' : ''}`}>
                        <p className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{a.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Azioni Rapide</h3>
              </div>
              <div className="p-3 space-y-1">
                {nav.slice(1).map((item) => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                      <item.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <span className="text-sm text-slate-600 font-medium flex-1 group-hover:text-slate-800 transition-colors">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5">Anteprima Modale</h3>
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-sky-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Nuova Chiamata</h4>
                  </div>
                  <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nome Cliente</label>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm">Mario Rossi</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Telefono</label>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm">+39 333 1234567</div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200">
                    Salva Chiamata
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-300/40 border border-indigo-400/30">
        LAYOUT C — Modern SaaS (sidebar icone scura + contenuti chiari + timeline)
      </div>
    </div>
  )
}
