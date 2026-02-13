'use client'

import { X, Plus, List, Phone } from 'lucide-react'

interface CallMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectList: () => void
}

export default function CallMenuModal({ isOpen, onClose, onSelectNew, onSelectList }: CallMenuModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-[#131920] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white/90">Gestione Chiamate</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/[0.06] hover:border-red-500/30 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { onSelectNew(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-teal-400/20 transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
              <Plus className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80">Nuova Chiamata</h3>
              <p className="text-xs text-white/30">Registra una chiamata cliente</p>
            </div>
          </button>
          <button onClick={() => { onSelectList(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-400/20 transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <List className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80">Registro Chiamate</h3>
              <p className="text-xs text-white/30">Visualizza tutte le chiamate</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
