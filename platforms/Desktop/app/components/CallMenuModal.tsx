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
    <div className="ak-modal-backdrop fixed inset-0 bg-ak-inset/30  z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-ak-panel/90 backdrop-blur-2xl border border-ak-line/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-ak-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-ak-text">Gestione Chiamate</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-ak-inset hover:bg-ak-danger-bg border border-ak-line hover:border-ak-danger/60 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-ak-muted" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { onSelectNew(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-ak-panel/50 hover:bg-ak-panel border border-ak-line/40 hover:border-ak-line transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-ak-hover border border-ak-line/60 flex items-center justify-center group-hover:bg-ak-hover transition-colors">
              <Plus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ak-text">Nuova Chiamata</h3>
              <p className="text-xs text-ak-subtle">Registra una chiamata cliente</p>
            </div>
          </button>
          <button onClick={() => { onSelectList(); onClose() }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-ak-panel/50 hover:bg-ak-panel border border-ak-line/40 hover:border-ak-line transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-ak-hover border border-ak-line flex items-center justify-center group-hover:bg-ak-hover transition-colors">
              <List className="w-5 h-5 text-ak-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ak-text">Registro Chiamate</h3>
              <p className="text-xs text-ak-subtle">Visualizza tutte le chiamate</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
