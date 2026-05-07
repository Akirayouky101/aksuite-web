'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, StickyNote, Send, Trash2, Loader2, Pencil, ChevronLeft, Save, Search } from 'lucide-react'
import { useKioskNotes, KioskNote } from '../hooks/useKioskNotes'

interface KioskNotesModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: string
}

const AUTHOR_FILTERS = ['Tutti', 'Giuliano', 'Lorenzo']

export default function KioskNotesModal({ isOpen, onClose, currentUser }: KioskNotesModalProps) {
  const { notes, loading, loadNotes, addNote, deleteNote, updateNote } = useKioskNotes()

  // new note
  const [newTitle, setNewTitle] = useState('')
  const [newText, setNewText] = useState('')
  const [saving, setSaving] = useState(false)

  // detail / edit
  const [detailNote, setDetailNote] = useState<KioskNote | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  // filters
  const [search, setSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('Tutti')

  const newTitleRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) loadNotes()
  }, [isOpen, loadNotes])

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = search.trim() === '' ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      const matchAuthor = authorFilter === 'Tutti' ||
        n.author.toLowerCase().includes(authorFilter.toLowerCase())
      return matchSearch && matchAuthor
    })
  }, [notes, search, authorFilter])

  const handleAdd = async () => {
    if (!newTitle.trim() || !newText.trim()) return
    setSaving(true)
    await addNote(newTitle.trim(), newText.trim(), currentUser || 'Magazzino')
    setNewTitle('')
    setNewText('')
    setSaving(false)
    newTitleRef.current?.focus()
  }

  const openDetail = (note: KioskNote) => {
    setDetailNote(note)
    setEditTitle(note.title)
    setEditText(note.content)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    if (!detailNote || !editTitle.trim() || !editText.trim()) return
    setEditSaving(true)
    const ok = await updateNote(detailNote.id, editTitle.trim(), editText.trim())
    setEditSaving(false)
    if (ok) {
      setDetailNote(prev => prev ? { ...prev, title: editTitle.trim(), content: editText.trim() } : null)
      setIsEditing(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteNote(id)
    setDetailNote(null)
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
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => detailNote ? setDetailNote(null) : onClose()} />

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              {detailNote ? (
                <button
                  onClick={() => { setDetailNote(null); setIsEditing(false) }}
                  className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-amber-700" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                  <StickyNote className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {detailNote ? (isEditing ? 'Modifica Nota' : detailNote.title || 'Dettaglio Nota') : 'Note Magazzino'}
                </h2>
                <p className="text-xs text-slate-500">
                  {detailNote ? `di ${detailNote.author}` : 'Condivise · visibili solo dal magazzino'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {detailNote ? (
              /* ── DETAIL / EDIT VIEW ── */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex-1 overflow-y-auto flex flex-col"
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {detailNote.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-amber-700">{detailNote.author}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(detailNote.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Titolo"
                        className="w-full px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-200 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                        autoFocus
                      />
                      <textarea
                        ref={editRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={7}
                        className="w-full px-4 py-3 bg-amber-50 rounded-2xl border border-amber-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 resize-none"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-base font-black text-slate-800 bg-amber-50 rounded-xl border border-amber-200/60 px-4 py-2.5">
                        {detailNote.title}
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 rounded-2xl border border-amber-200/60 p-4">
                        {detailNote.content}
                      </p>
                    </>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 flex gap-3 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => { setIsEditing(false); setEditTitle(detailNote.title); setEditText(detailNote.content) }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-all"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editTitle.trim() || !editText.trim() || editSaving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 disabled:opacity-40 transition-all"
                      >
                        {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salva
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDelete(detailNote.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-500 text-sm font-semibold transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Elimina
                      </button>
                      <button
                        onClick={() => { setIsEditing(true); setTimeout(() => editRef.current?.focus(), 100) }}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all"
                      >
                        <Pencil className="w-4 h-4" /> Modifica
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ── LIST VIEW ── */
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex-1 overflow-y-auto flex flex-col min-h-0"
              >
                {/* Filters */}
                <div className="px-4 pt-4 pb-3 space-y-2 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Cerca per titolo o contenuto..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl border border-transparent text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    {AUTHOR_FILTERS.map(f => (
                      <button
                        key={f}
                        onClick={() => setAuthorFilter(f)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          authorFilter === f
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-400/30'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-10">
                      <StickyNote className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">
                        {notes.length === 0 ? 'Nessuna nota ancora' : 'Nessun risultato'}
                      </p>
                    </div>
                  ) : (
                    filteredNotes.map(note => (
                      <motion.button
                        key={note.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => openDetail(note)}
                        className="w-full text-left bg-amber-50 hover:bg-amber-100 border border-amber-200/60 hover:border-amber-300 rounded-2xl p-4 transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {note.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-amber-700">{note.author}</span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {new Date(note.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit', month: '2-digit', year: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-800 mb-1">{note.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                      </motion.button>
                    ))
                  )}
                </div>

                {/* Input area */}
                <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {(currentUser || 'M').charAt(0).toUpperCase()}
                    </div>
                    <input
                      ref={newTitleRef}
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Titolo nota..."
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                    />
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-7 flex-shrink-0" />
                    <textarea
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
                      placeholder="Scrivi la nota..."
                      rows={2}
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 resize-none"
                    />
                    <button
                      onClick={handleAdd}
                      disabled={!newTitle.trim() || !newText.trim() || saving}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-400/30 transition-all disabled:opacity-40 flex-shrink-0"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface KioskNotesModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: string
}

export default function KioskNotesModal({ isOpen, onClose, currentUser }: KioskNotesModalProps) {
  const { notes, loading, loadNotes, addNote, deleteNote, updateNote } = useKioskNotes()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [detailNote, setDetailNote] = useState<KioskNote | null>(null)
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

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

  const openDetail = (note: KioskNote) => {
    setDetailNote(note)
    setEditText(note.content)
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    if (!detailNote || !editText.trim()) return
    setEditSaving(true)
    const ok = await updateNote(detailNote.id, editText.trim())
    setEditSaving(false)
    if (ok) {
      setDetailNote(prev => prev ? { ...prev, content: editText.trim() } : null)
      setIsEditing(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteNote(id)
    setDetailNote(null)
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
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => detailNote ? setDetailNote(null) : onClose()} />

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
              {detailNote ? (
                <button
                  onClick={() => { setDetailNote(null); setIsEditing(false) }}
                  className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-amber-700" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                  <StickyNote className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {detailNote ? 'Dettaglio Nota' : 'Note Magazzino'}
                </h2>
                <p className="text-xs text-slate-500">
                  {detailNote ? `di ${detailNote.author}` : 'Condivise · visibili solo dal magazzino'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {detailNote ? (
              /* ── DETAIL / EDIT VIEW ── */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex-1 overflow-y-auto flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {detailNote.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-amber-700">{detailNote.author}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(detailNote.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {isEditing ? (
                    <textarea
                      ref={editRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-amber-50 rounded-2xl border border-amber-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 resize-none"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 rounded-2xl border border-amber-200/60 p-4">
                      {detailNote.content}
                    </p>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 flex gap-3 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => { setIsEditing(false); setEditText(detailNote.content) }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-all"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editText.trim() || editSaving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 disabled:opacity-40 transition-all"
                      >
                        {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salva
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDelete(detailNote.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-500 text-sm font-semibold transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Elimina
                      </button>
                      <button
                        onClick={() => { setIsEditing(true); setTimeout(() => editRef.current?.focus(), 100) }}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all"
                      >
                        <Pencil className="w-4 h-4" /> Modifica
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ── LIST VIEW ── */
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="flex-1 overflow-y-auto flex flex-col"
              >
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
                      <motion.button
                        key={note.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => openDetail(note)}
                        className="w-full text-left bg-amber-50 hover:bg-amber-100 border border-amber-200/60 hover:border-amber-300 rounded-2xl p-4 transition-all active:scale-[0.98]"
                      >
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
                        <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                      </motion.button>
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
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
