'use client'

import { X, Plus, List, Lock } from 'lucide-react'

interface PasswordMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNew: () => void
  onSelectList: () => void
}

export default function PasswordMenuModal({ isOpen, onClose, onSelectNew, onSelectList }: PasswordMenuModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Gestione Password</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-500/30 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { onSelectNew(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/50 hover:bg-white border border-slate-200/40 hover:border-slate-200 transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Plus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Nuova Password</h3>
              <p className="text-xs text-slate-400">Aggiungi al vault</p>
            </div>
          </button>
          <button onClick={() => { onSelectList(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/50 hover:bg-white border border-slate-200/40 hover:border-slate-200 transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <List className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Elenco Password</h3>
              <p className="text-xs text-slate-400">Visualizza tutte le password</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
