'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, StickyNote, Send, Trash2, Loader2 } from 'lucide-react'
import { useKioskNotes } from '../hooks/useKioskNotes'

interface KioskNotesModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: string
}

export default function KioskNotesModal({ isOpen, onClose, currentUser }: KioskNotesModalProps) {
  const { notes, loading, loadNotes, addNote, deleteNote } = useKioskNotes()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) loadNotes()
  }, [isOpen, loadNotes])

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    await addNote(text.trim(), currentUser || 'Magazzino')
    setText('')
    setSaving(false)
    textareaRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                <StickyNote className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Note Magazzino</h2>
                <p className="text-xs text-slate-500">Condivise · visibili solo dal magazzino</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Nessuna nota ancora</p>
                <p className="text-slate-300 text-xs mt-1">Aggiungi la prima nota qui sotto</p>
              </div>
            ) : (
              notes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {note.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-amber-700">{note.author}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(note.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/60 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 mt-1">
                {(currentUser || 'M').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
                  placeholder="Scrivi una nota per il magazzino..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!text.trim() || saving}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-400/30 transition-all disabled:opacity-40 flex-shrink-0 mt-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
