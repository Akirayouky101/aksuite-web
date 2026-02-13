'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trash2, Send, ChevronDown, History, Pencil, Check } from 'lucide-react'
import { Lavorazione } from '../hooks/useLavorazioni'
import { TimelineEntry, EVENT_TYPES } from '../hooks/useLavorazioneTimeline'

interface LavorazioneTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  lavorazione: Lavorazione | null
  entries: TimelineEntry[]
  loading: boolean
  onAddEntry: (entry: { lavorazione_id: string; description: string; event_type: TimelineEntry['event_type']; created_by_name: string }) => Promise<any>
  onDeleteEntry: (id: string) => Promise<void>
  onUpdateEntry?: (id: string, updates: { description?: string; event_type?: TimelineEntry['event_type']; created_by_name?: string }) => Promise<any>
  teamMembers?: Array<{ id: string; name: string; role: string }>
}

const statusLabels: Record<string, string> = {
  da_fare: '📋 Da Fare',
  in_corso: '🔄 In Corso',
  completata: '✅ Completata',
  annullata: '❌ Annullata',
}

export default function LavorazioneTimelineModal({
  isOpen, onClose, lavorazione, entries, loading, onAddEntry, onDeleteEntry, onUpdateEntry, teamMembers = []
}: LavorazioneTimelineModalProps) {
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<TimelineEntry['event_type']>('nota')
  const [createdByName, setCreatedByName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editEventType, setEditEventType] = useState<TimelineEntry['event_type']>('nota')
  const [editCreatedByName, setEditCreatedByName] = useState('')
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  if (!isOpen || !lavorazione) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await onAddEntry({
        lavorazione_id: lavorazione.id,
        description: description.trim(),
        event_type: eventType,
        created_by_name: createdByName.trim()
      })
      setDescription('')
      setEventType('nota')
      setCreatedByName('')
    } catch (error) {
      console.error('Error adding timeline entry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDeleteEntry(id) } finally { setDeletingId(null) }
  }

  const startEdit = (entry: TimelineEntry) => {
    setEditingEntry(entry.id)
    setEditDescription(entry.description)
    setEditEventType(entry.event_type)
    setEditCreatedByName(entry.created_by_name)
    setShowEditTypeDropdown(false)
  }

  const cancelEdit = () => {
    setEditingEntry(null)
    setEditDescription('')
    setEditEventType('nota')
    setEditCreatedByName('')
    setShowEditTypeDropdown(false)
  }

  const saveEdit = async () => {
    if (!editingEntry || !editDescription.trim() || !onUpdateEntry) return
    setSavingEdit(true)
    try {
      await onUpdateEntry(editingEntry, {
        description: editDescription.trim(),
        event_type: editEventType,
        created_by_name: editCreatedByName.trim()
      })
      cancelEdit()
    } catch (error) {
      console.error('Error updating timeline entry:', error)
    } finally {
      setSavingEdit(false)
    }
  }

  const formatDateTime = (d: string) => {
    const date = new Date(d)
    return {
      date: date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString('it-IT')
    }
  }

  const groupedEntries: { date: string; items: TimelineEntry[] }[] = []
  entries.forEach(entry => {
    const dateStr = new Date(entry.created_at).toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    const existing = groupedEntries.find(g => g.date === dateStr)
    if (existing) existing.items.push(entry)
    else groupedEntries.push({ date: dateStr, items: [entry] })
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full my-8"
        >
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Cronologia</h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{lavorazione.title}</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Lavorazione summary */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200/60 flex-shrink-0">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium">{statusLabels[lavorazione.status] || lavorazione.status}</span>
                {lavorazione.assigned_to && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>👤 {lavorazione.assigned_to}</span>
                  </>
                )}
                {lavorazione.scheduled_date && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>📅 {new Date(lavorazione.scheduled_date).toLocaleDateString('it-IT')}</span>
                  </>
                )}
                <span className="ml-auto font-medium text-slate-400">{entries.length} eventi</span>
              </div>
            </div>

            {/* Timeline Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-h-[200px] max-h-[45vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📜</div>
                  <p className="text-slate-400 text-sm">Nessun evento nella cronologia</p>
                  <p className="text-slate-300 text-xs mt-1">Aggiungi il primo evento qui sotto</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-violet-200 to-purple-200" />

                  {groupedEntries.map((group, gIdx) => (
                    <div key={gIdx} className="mb-6 last:mb-0">
                      <div className="relative flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center z-10 shadow-sm">
                          <span className="text-sm">📅</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.date}</span>
                      </div>

                      {group.items.map((entry, idx) => {
                        const typeConfig = EVENT_TYPES[entry.event_type] || EVENT_TYPES.altro
                        const dt = formatDateTime(entry.created_at)
                        const isEditing = editingEntry === entry.id

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative flex items-start gap-3 mb-4 last:mb-0 group"
                          >
                            <div className="w-10 flex-shrink-0 flex items-center justify-center z-10">
                              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm group-hover:border-indigo-300 transition-colors">
                                <span className="text-sm">{isEditing ? (EVENT_TYPES[editEventType]?.emoji || '📝') : typeConfig.emoji}</span>
                              </div>
                            </div>

                            <div className="flex-1 bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md transition-shadow group-hover:border-indigo-200/60">
                              {isEditing ? (
                                /* ═══ EDIT MODE ═══ */
                                <div className="space-y-2">
                                  {/* Event type selector */}
                                  <div className="relative">
                                    <button type="button" onClick={() => setShowEditTypeDropdown(!showEditTypeDropdown)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs hover:bg-slate-100 transition-colors">
                                      <span>{EVENT_TYPES[editEventType]?.emoji}</span>
                                      <span className="text-slate-600 font-medium">{EVENT_TYPES[editEventType]?.label}</span>
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    {showEditTypeDropdown && (
                                      <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-slate-200/60 shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
                                        {Object.entries(EVENT_TYPES).map(([key, config]) => (
                                          <button key={key} type="button"
                                            onClick={() => { setEditEventType(key as TimelineEntry['event_type']); setShowEditTypeDropdown(false) }}
                                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 text-xs hover:bg-slate-50 transition-colors ${editEventType === key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}>
                                            <span>{config.emoji}</span>
                                            <span>{config.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {/* Description edit */}
                                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-lg text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                                    placeholder="Descrizione..." autoFocus />
                                  {/* Author edit */}
                                  {teamMembers.length > 0 ? (
                                    <select value={editCreatedByName} onChange={(e) => setEditCreatedByName(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:border-indigo-300 outline-none">
                                      <option value="">Chi? (opzionale)</option>
                                      {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    </select>
                                  ) : (
                                    <input type="text" value={editCreatedByName} onChange={(e) => setEditCreatedByName(e.target.value)}
                                      placeholder="Chi? (opzionale)"
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:border-indigo-300 outline-none" />
                                  )}
                                  {/* Save / Cancel */}
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={saveEdit} disabled={!editDescription.trim() || savingEdit} title="Salva modifiche"
                                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                                      <Check className={`w-3.5 h-3.5 ${savingEdit ? 'animate-pulse' : ''}`} />
                                      Salva
                                    </button>
                                    <button onClick={cancelEdit} title="Annulla modifiche"
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors">
                                      Annulla
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* ═══ VIEW MODE ═══ */
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-md text-xs font-medium text-slate-500">
                                        {typeConfig.label}
                                      </span>
                                      <span className="text-xs text-slate-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {dt.time}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{entry.description}</p>
                                    {entry.created_by_name && (
                                      <p className="text-xs text-slate-400 mt-1.5">— {entry.created_by_name}</p>
                                    )}
                                  </div>
                                  {/* Action buttons */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {onUpdateEntry && (
                                      <button onClick={() => startEdit(entry)} title="Modifica evento"
                                        className="p-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                                        <Pencil className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-400" />
                                      </button>
                                    )}
                                    <button onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id} title="Elimina evento"
                                      className="p-1.5 rounded-lg hover:bg-red-50 transition-all">
                                      <Trash2 className={`w-3.5 h-3.5 ${deletingId === entry.id ? 'text-slate-300 animate-spin' : 'text-slate-300 hover:text-red-400'}`} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Entry Form */}
            <div className="border-t border-slate-200/60 bg-white/80 px-6 py-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative">
                    <button type="button" onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm hover:bg-slate-100 transition-colors">
                      <span>{EVENT_TYPES[eventType].emoji}</span>
                      <span className="text-slate-600 font-medium hidden sm:inline">{EVENT_TYPES[eventType].label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {showTypeDropdown && (
                      <div className="absolute bottom-full left-0 mb-1 w-56 bg-white rounded-xl border border-slate-200/60 shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                        {Object.entries(EVENT_TYPES).map(([key, config]) => (
                          <button key={key} type="button"
                            onClick={() => { setEventType(key as TimelineEntry['event_type']); setShowTypeDropdown(false) }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors ${eventType === key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}>
                            <span>{config.emoji}</span>
                            <span>{config.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {teamMembers.length > 0 ? (
                    <select value={createdByName} onChange={(e) => setCreatedByName(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none">
                      <option value="">Chi? (opzionale)</option>
                      {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={createdByName} onChange={(e) => setCreatedByName(e.target.value)}
                      placeholder="Chi? (opzionale)"
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none" />
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrivi cosa è successo..."
                    className="flex-1 px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    disabled={submitting} />
                  <button type="submit" disabled={!description.trim() || submitting}
                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-sm hidden sm:inline">Aggiungi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
