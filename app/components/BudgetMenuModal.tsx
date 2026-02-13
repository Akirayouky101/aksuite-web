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
    { label: 'Bilancio Completo', desc: 'Transazioni e totali', icon: BarChart3, onClick: onSelectView, color: 'bg-cyan-500/10 border-cyan-500/20', iconColor: 'text-cyan-400' },
    ...(onSelectRecurring ? [{ label: 'Nuovo Ricorrente', desc: 'Automatizza movimenti', icon: Repeat, onClick: onSelectRecurring, color: 'bg-violet-500/10 border-violet-500/20', iconColor: 'text-violet-400' }] : []),
    ...(onSelectRecurringList ? [{ label: 'Gestisci Ricorrenti', desc: 'Automazioni attive', icon: List, onClick: onSelectRecurringList, color: 'bg-teal-500/10 border-teal-500/20', iconColor: 'text-teal-400' }] : []),
    ...(onSelectLimit ? [{ label: 'Limite Budget', desc: 'Imposta tetto spesa', icon: AlertTriangle, onClick: onSelectLimit, color: 'bg-amber-500/10 border-amber-500/20', iconColor: 'text-amber-400' }] : []),
    ...(onSelectLimitsList ? [{ label: 'Gestisci Limiti', desc: 'Vedi limiti e avvisi', icon: Target, onClick: onSelectLimitsList, color: 'bg-red-500/10 border-red-500/20', iconColor: 'text-red-400' }] : []),
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-[#131920] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white/90">Bilancio Familiare</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/[0.06] hover:border-red-500/30 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick?.(); onClose() }} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-teal-400/20 transition-all text-left group">
              <div className={`w-10 h-10 rounded-lg ${item.color} border flex items-center justify-center group-hover:opacity-100 opacity-80 transition-opacity`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/80">{item.label}</h3>
                <p className="text-xs text-white/30">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
