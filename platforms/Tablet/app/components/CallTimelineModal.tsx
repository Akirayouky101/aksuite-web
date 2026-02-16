'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trash2, Send, ChevronDown, History, Pencil, Check, Camera, Image as ImageIcon, ZoomIn, Phone } from 'lucide-react'
import { Call } from '../hooks/useCalls'
import { CallTimelineEntry, CALL_EVENT_TYPES } from '../hooks/useCallTimeline'

interface CallTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  call: Call | null
  entries: CallTimelineEntry[]
  loading: boolean
  onAddEntry: (entry: { call_id: string; description: string; event_type: CallTimelineEntry['event_type']; created_by_name: string; image_url?: string | null }) => Promise<any>
  onDeleteEntry: (id: string) => Promise<void>
  onUpdateEntry?: (id: string, updates: { description?: string; event_type?: CallTimelineEntry['event_type']; created_by_name?: string }) => Promise<any>
  onUploadPhoto?: (file: File, callId: string) => Promise<string | null>
  teamMembers?: Array<{ id: string; name: string; role: string }>
}

const statusLabels: Record<string, string> = {
  pending: '\u{1F4CB} In Attesa',
  in_corso: '\u{1F504} In Corso',
  completed: '\u{2705} Completata',
  cancelled: '\u{274C} Annullata',
}

export default function CallTimelineModal({
  isOpen, onClose, call, entries, loading, onAddEntry, onDeleteEntry, onUpdateEntry, onUploadPhoto, teamMembers = []
}: CallTimelineModalProps) {
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<CallTimelineEntry['event_type']>('nota')
  const [createdByName, setCreatedByName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editEventType, setEditEventType] = useState<CallTimelineEntry['event_type']>('nota')
  const [editCreatedByName, setEditCreatedByName] = useState('')
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  if (!isOpen || !call) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() && !selectedPhoto) return
    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (selectedPhoto && onUploadPhoto) {
        imageUrl = await onUploadPhoto(selectedPhoto, call.id)
      }
      await onAddEntry({
        call_id: call.id,
        description: description.trim() || (selectedPhoto ? 'Foto allegata' : ''),
        event_type: eventType,
        created_by_name: createdByName.trim(),
        image_url: imageUrl
      })
      setDescription('')
      setEventType('nota')
      setCreatedByName('')
      setSelectedPhoto(null)
      setPhotoPreview(null)
    } catch (error) {
      console.error('Error adding call timeline entry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDeleteEntry(id) } finally { setDeletingId(null) }
  }

  const startEdit = (entry: CallTimelineEntry) => {
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
      console.error('Error updating call timeline entry:', error)
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

  const groupedEntries: { date: string; items: CallTimelineEntry[] }[] = []
  entries.forEach(entry => {
    const dateStr = new Date(entry.created_at).toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    const existing = groupedEntries.find(g => g.date === dateStr)
    if (existing) existing.items.push(entry)
    else groupedEntries.push({ date: dateStr, items: [entry] })
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Cronologia Chiamata</h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{call.caller_name}{call.company ? ` - ${call.company}` : ''}</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            {/* Call summary */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200/60 flex-shrink-0">
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-medium">{statusLabels[call.status] || call.status}</span>
                {call.phone && (
                  <>
                    <span className="text-slate-300">{'\u2022'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.phone}</span>
                  </>
                )}
                {call.assigned_to && (
                  <>
                    <span className="text-slate-300">{'\u2022'}</span>
                    <span>{'\u{1F464}'} {call.assigned_to}</span>
                  </>
                )}
                <span className="ml-auto font-medium text-slate-400">{entries.length} eventi</span>
              </div>
            </div>

            {/* Timeline Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-h-[200px] max-h-[45vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">{'\u{1F4DC}'}</div>
                  <p className="text-slate-400 text-sm">Nessun evento nella cronologia</p>
                  <p className="text-slate-300 text-xs mt-1">Aggiungi il primo evento qui sotto</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-violet-200" />

                  {groupedEntries.map((group, gIdx) => (
                    <div key={gIdx} className="mb-6 last:mb-0">
                      <div className="relative flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center z-10 shadow-sm">
                          <span className="text-sm">{'\u{1F4C5}'}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.date}</span>
                      </div>

                      {group.items.map((entry, idx) => {
                        const typeConfig = CALL_EVENT_TYPES[entry.event_type] || CALL_EVENT_TYPES.altro
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
                              <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm group-hover:border-blue-300 transition-colors">
                                <span className="text-sm">{isEditing ? (CALL_EVENT_TYPES[editEventType]?.emoji || '\u{1F4DD}') : typeConfig.emoji}</span>
                              </div>
                            </div>

                            <div className="flex-1 bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md transition-shadow group-hover:border-blue-200/60">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <button type="button" onClick={() => setShowEditTypeDropdown(!showEditTypeDropdown)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs hover:bg-slate-100 transition-colors">
                                      <span>{CALL_EVENT_TYPES[editEventType]?.emoji}</span>
                                      <span className="text-slate-600 font-medium">{CALL_EVENT_TYPES[editEventType]?.label}</span>
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    {showEditTypeDropdown && (
                                      <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-slate-200/60 shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
                                        {Object.entries(CALL_EVENT_TYPES).map(([key, config]) => (
                                          <button key={key} type="button"
                                            onClick={() => { setEditEventType(key as CallTimelineEntry['event_type']); setShowEditTypeDropdown(false) }}
                                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 text-xs hover:bg-slate-50 transition-colors ${editEventType === key ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>
                                            <span>{config.emoji}</span>
                                            <span>{config.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-lg text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none"
                                    placeholder="Descrizione..." autoFocus />
                                  {teamMembers.length > 0 ? (
                                    <select value={editCreatedByName} onChange={(e) => setEditCreatedByName(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:border-blue-300 outline-none">
                                      <option value="">Chi? (opzionale)</option>
                                      {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                    </select>
                                  ) : (
                                    <input type="text" value={editCreatedByName} onChange={(e) => setEditCreatedByName(e.target.value)}
                                      placeholder="Chi? (opzionale)"
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs focus:border-blue-300 outline-none" />
                                  )}
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={saveEdit} disabled={!editDescription.trim() || savingEdit} title="Salva modifiche"
                                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
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
                                    {entry.image_url && (
                                      <button onClick={() => setViewingImage(entry.image_url)} className="mt-2 relative group/img rounded-lg overflow-hidden border border-slate-200/60 inline-block">
                                        <img src={entry.image_url} alt="Foto" className="max-h-32 rounded-lg object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-all" />
                                        </div>
                                      </button>
                                    )}
                                    {entry.created_by_name && (
                                      <p className="text-xs text-slate-400 mt-1.5">&mdash; {entry.created_by_name}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {onUpdateEntry && (
                                      <button onClick={() => startEdit(entry)} title="Modifica evento"
                                        className="p-1.5 rounded-lg hover:bg-blue-50 transition-all">
                                        <Pencil className="w-3.5 h-3.5 text-slate-300 hover:text-blue-400" />
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
                      <span>{CALL_EVENT_TYPES[eventType].emoji}</span>
                      <span className="text-slate-600 font-medium hidden sm:inline">{CALL_EVENT_TYPES[eventType].label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {showTypeDropdown && (
                      <div className="absolute bottom-full left-0 mb-1 w-56 bg-white rounded-xl border border-slate-200/60 shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                        {Object.entries(CALL_EVENT_TYPES).map(([key, config]) => (
                          <button key={key} type="button"
                            onClick={() => { setEventType(key as CallTimelineEntry['event_type']); setShowTypeDropdown(false) }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors ${eventType === key ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>
                            <span>{config.emoji}</span>
                            <span>{config.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {teamMembers.length > 0 ? (
                    <select value={createdByName} onChange={(e) => setCreatedByName(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none">
                      <option value="">Chi? (opzionale)</option>
                      {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={createdByName} onChange={(e) => setCreatedByName(e.target.value)}
                      placeholder="Chi? (opzionale)"
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrivi cosa \u00E8 successo..."
                    className="flex-1 px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    disabled={submitting} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" title="Seleziona foto"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedPhoto(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }
                    }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} title="Allega foto"
                    className={`px-3 py-3 rounded-xl border transition-all flex items-center justify-center ${selectedPhoto ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-200/60 text-slate-400 hover:text-blue-500 hover:border-blue-200'}`}>
                    <Camera className="w-4 h-4" />
                  </button>
                  <button type="submit" disabled={(!description.trim() && !selectedPhoto) || submitting}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-sm hidden sm:inline">Aggiungi</span>
                  </button>
                </div>
                {photoPreview && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200/40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 font-medium truncate">{selectedPhoto?.name}</p>
                      <p className="text-[10px] text-slate-400">{selectedPhoto ? `${(selectedPhoto.size / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedPhoto(null); setPhotoPreview(null) }} title="Rimuovi foto"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Image Lightbox */}
            {viewingImage && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                onClick={() => setViewingImage(null)}>
                <div className="relative max-w-4xl max-h-[90vh]">
                  <img src={viewingImage} alt="Foto" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
                  <button onClick={() => setViewingImage(null)} title="Chiudi"
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
