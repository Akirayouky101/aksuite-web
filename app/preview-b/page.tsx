'use client'

import { useState } from 'react'
import { Phone, DollarSign, Lock, ClipboardList, Calendar, FileText, MapPin, Bell, Search, Settings, Plus, ChevronRight, LayoutGrid, LogOut, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const stats = [
  { label: 'Chiamate', value: '24', sub: 'questo mese', change: '+12%', up: true, icon: Phone, accent: 'bg-blue-600' },
  { label: 'Entrate', value: '€4.580', sub: 'questo mese', change: '+8%', up: true, icon: DollarSign, accent: 'bg-emerald-600' },
  { label: 'Task Attivi', value: '18', sub: '5 scaduti', change: '-3', up: false, icon: ClipboardList, accent: 'bg-amber-600' },
  { label: 'Eventi', value: '7', sub: 'prossimi 7gg', change: '+2', up: true, icon: Calendar, accent: 'bg-violet-600' },
]

const activities = [
  { text: 'Chiamata con Mario Rossi', time: '2 ore fa', icon: Phone, tag: 'Chiamata', tagColor: 'bg-blue-50 text-blue-700' },
  { text: 'Spesa supermercato €85.50', time: '4 ore fa', icon: DollarSign, tag: 'Uscita', tagColor: 'bg-red-50 text-red-700' },
  { text: 'Completato: Preventivo cliente', time: 'Ieri', icon: ClipboardList, tag: 'Task', tagColor: 'bg-amber-50 text-amber-700' },
  { text: 'Riunione team programmata', time: 'Domani', icon: Calendar, tag: 'Evento', tagColor: 'bg-violet-50 text-violet-700' },
  { text: 'Nuova nota progetto Q2', time: '2 giorni fa', icon: FileText, tag: 'Nota', tagColor: 'bg-slate-100 text-slate-700' },
]

const nav = [
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Phone, label: 'Chiamate' },
  { icon: MapPin, label: 'Visite' },
  { icon: ClipboardList, label: 'Task' },
  { icon: Calendar, label: 'Calendario' },
  { icon: FileText, label: 'Note' },
  { icon: DollarSign, label: 'Budget' },
  { icon: Lock, label: 'Password' },
]

export default function PreviewB() {
  const [active, setActive] = useState('Dashboard')

  return (
    <div className="min-h-screen bg-[#fafbfc] flex">
      {/* Sidebar — clean, no gradients, just structure */}
      <aside className="w-[260px] bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-[15px] tracking-tight">AK Suite</span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/60">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[13px]">Cerca...</span>
          </div>
        </div>

        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-2">Menu</p>
          {nav.map((item) => (
            <button key={item.label} onClick={() => setActive(item.label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                active === item.label
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">AK</div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-[13px] font-medium truncate">Admin</p>
              <p className="text-slate-400 text-[11px]">admin@aksuite.it</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-400 text-sm">Panoramica della tua attivita</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                <Bell className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                <Settings className="w-4 h-4" />
              </button>
              <button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuovo
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-100 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${s.accent} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Activity */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Attivita Recenti</h3>
                <button className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">Mostra tutto</button>
              </div>
              <div className="divide-y divide-slate-50">
                {activities.map((a, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <a.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-700 font-medium truncate">{a.text}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${a.tagColor} flex-shrink-0`}>{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Accesso Rapido</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {nav.slice(1).map((item) => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="text-[13px] text-slate-600 font-medium flex-1">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Preview */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Anteprima Modale</h3>
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Nuova Chiamata</h4>
                  <button className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors text-xs">✕</button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome Cliente</label>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[13px]">Mario Rossi</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Telefono</label>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[13px]">+39 333 1234567</div>
                  </div>
                  <button className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors">Salva Chiamata</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full bg-slate-900 text-white font-bold text-sm shadow-xl">
        LAYOUT B — Minimal Corporate (chiaro, pulito, nessun gradiente)
      </div>
    </div>
  )
}
