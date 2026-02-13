'use client'

import { X, Plus, BarChart3, Repeat, AlertTriangle, List, DollarSign, Target } from 'lucide-react'

interface BudgetMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectView: () => void
  onSelectRecurring?: () => void
  onSelectRecurringList?: () => void
  onSelectLimit?: () => void
  onSelectLimitsList?: () => void
}

export default function BudgetMenuModal({ isOpen, onClose, onSelectNew, onSelectView, onSelectRecurring, onSelectRecurringList, onSelectLimit, onSelectLimitsList }: BudgetMenuModalProps) {
  if (!isOpen) return null

  const items = [
    { label: 'Nuovo Movimento', desc: 'Aggiungi entrata o uscita', icon: Plus, onClick: onSelectNew, color: 'bg-emerald-500/10 border-emerald-500/20', iconColor: 'text-emerald-400' },
    { label: 'Bilancio Completo', desc: 'Transazioni e totali', icon: BarChart3, onClick: onSelectView, color: 'bg-indigo-50 border-indigo-200', iconColor: 'text-indigo-500' },
    ...(onSelectRecurring ? [{ label: 'Nuovo Ricorrente', desc: 'Automatizza movimenti', icon: Repeat, onClick: onSelectRecurring, color: 'bg-indigo-50 border-violet-500/20', iconColor: 'text-indigo-500' }] : []),
    ...(onSelectRecurringList ? [{ label: 'Gestisci Ricorrenti', desc: 'Automazioni attive', icon: List, onClick: onSelectRecurringList, color: 'bg-indigo-500/10 border-indigo-500/20', iconColor: 'text-indigo-400' }] : []),
    ...(onSelectLimit ? [{ label: 'Limite Budget', desc: 'Imposta tetto spesa', icon: AlertTriangle, onClick: onSelectLimit, color: 'bg-amber-500/10 border-amber-500/20', iconColor: 'text-amber-400' }] : []),
    ...(onSelectLimitsList ? [{ label: 'Gestisci Limiti', desc: 'Vedi limiti e avvisi', icon: Target, onClick: onSelectLimitsList, color: 'bg-red-500/10 border-red-500/20', iconColor: 'text-red-400' }] : []),
  ]

  return (
    <div className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Bilancio Familiare</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-500/30 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick?.(); onClose() }} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all text-left group">
              <div className={`w-10 h-10 rounded-lg ${item.color} border flex items-center justify-center group-hover:opacity-100 opacity-80 transition-opacity`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">{item.label}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
