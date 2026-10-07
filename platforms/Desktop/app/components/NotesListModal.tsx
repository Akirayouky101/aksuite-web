'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Filter, Grid, List, Pin, Edit, Trash2, 
  Tag, Folder, Plus, Download, Calendar, FileText 
} from 'lucide-react'
import { Note } from '../hooks/useNotes'

interface NotesListModalProps {
  embedded?: boolean
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Note>) => void
  onTogglePin: (id: string) => void
  onEdit: (note: Note) => void
  onAdd: () => void
}

const COLORS = {
  blue: { light: 'bg-ak-hover border-ak-line', dark: 'bg-blue-900/30 border-blue-700', text: 'text-ak-cyan' },
  green: { light: 'bg-ak-success-bg border-ak-success', dark: 'bg-green-900/30 border-green-700', text: 'text-ak-success' },
  yellow: { light: 'bg-ak-warning-bg border-ak-warning', dark: 'bg-yellow-900/30 border-yellow-700', text: 'text-ak-warning' },
  red: { light: 'bg-ak-danger-bg border-ak-danger', dark: 'bg-red-900/30 border-red-700', text: 'text-ak-danger' },
  purple: { light: 'bg-ak-purple-bg border-ak-purple', dark: 'bg-purple-900/30 border-purple-700', text: 'text-ak-purple' },
  pink: { light: 'bg-ak-pink-bg border-ak-pink', dark: 'bg-pink-900/30 border-pink-700', text: 'text-ak-pink' },
  orange: { light: 'bg-ak-orange-bg border-ak-orange', dark: 'bg-orange-900/30 border-orange-700', text: 'text-ak-orange' },
  gray: { light: 'bg-ak-inset border-ak-line', dark: 'bg-ak-panel/80 border-ak-line', text: 'text-ak-text' }
}

export default function NotesListModal({
  isOpen,
  onClose,
  notes,
  onDelete,
  onUpdate,
  onTogglePin,
  onEdit,
  onAdd,
  embedded = false
}: NotesListModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique folders and tags
  const folders = useMemo(() => {
    const folderSet = new Set(notes.map(n => n.folder))
    return ['all', ...Array.from(folderSet)]
  }, [notes])

  const tags = useMemo(() => {
    const tagSet = new Set(notes.flatMap(n => n.tags || []))
    return ['all', ...Array.from(tagSet)]
  }, [notes])

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFolder = selectedFolder === 'all' || note.folder === selectedFolder
      const matchesTag = selectedTag === 'all' || (note.tags || []).includes(selectedTag)
      const matchesPinned = !showPinnedOnly || note.is_pinned

      return matchesSearch && matchesFolder && matchesTag && matchesPinned
    })
  }, [notes, searchQuery, selectedFolder, selectedTag, showPinnedOnly])

  // Sort: pinned first, then by updated_at
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [filteredNotes])

  const exportNotes = () => {
    const csv = [
      ['Title', 'Content', 'Folder', 'Tags', 'Pinned', 'Created', 'Updated'].join(','),
      ...sortedNotes.map(note => [
        `"${note.title}"`,
        `"${note.content.replace(/"/g, '""')}"`,
        note.folder,
        `"${(note.tags || []).join(', ')}"`,
        note.is_pinned ? 'Yes' : 'No',
        new Date(note.created_at).toLocaleDateString(),
        new Date(note.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7) return `${diffDays} giorni fa`
    return date.toLocaleDateString('it-IT')
  }

  const getColorClasses = (color: string) => {
    return COLORS[color as keyof typeof COLORS] || COLORS.blue
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={embedded ? 'ak-workspace !p-0 overflow-hidden' : 'ak-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ak-inset/30'}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-ak-panel/90 w-full flex flex-col ${embedded ? 'min-h-[500px]' : 'rounded-2xl shadow-2xl max-w-7xl max-h-[90vh] border border-ak-line/60'}`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-ak-line/60 bg-ak-panel/60 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ak-accent to-ak-accent flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ak-text">Note</h2>
                    <p className="text-xs text-ak-subtle mt-0.5">
                      {sortedNotes.length} {sortedNotes.length === 1 ? 'nota' : 'note'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  title={embedded ? 'Torna alla dashboard' : 'Chiudi'}
                  className="w-9 h-9 rounded-xl bg-ak-inset hover:bg-ak-danger-bg border border-ak-line/60 hover:border-ak-danger flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-ak-subtle hover:text-ak-danger" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-gradient-to-r from-ak-accent to-ak-accent  text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nuova Nota
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showFilters
                      ? 'bg-blue-600 text-ak-text'
                      : 'bg-ak-panel text-ak-muted hover:bg-ak-inset'
                  }`}
                >
                  <Filter size={20} />
                  Filtri
                </button>

                <button
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showPinnedOnly
                      ? 'bg-yellow-600 text-ak-text'
                      : 'bg-ak-panel text-ak-muted hover:bg-ak-inset'
                  }`}
                >
                  <Pin size={20} />
                  Solo Fissate
                </button>

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-ak-text'
                        : 'bg-ak-panel text-ak-subtle hover:bg-ak-inset'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-ak-text'
                        : 'bg-ak-panel text-ak-subtle hover:bg-ak-inset'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>

                <button
                  onClick={exportNotes}
                  className="px-4 py-2 bg-ak-panel hover:bg-ak-inset text-ak-muted rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  Esporta CSV
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ak-subtle" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca nelle note..."
                  className="w-full pl-10 pr-4 py-3 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text placeholder-ak-subtle focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Filters */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-ak-subtle mb-2 flex items-center gap-2">
                      <Folder size={16} /> Cartella
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full px-3 py-2 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text focus:ring-2 focus:ring-indigo-200"
                    >
                      {folders.map(folder => (
                        <option key={folder} value={folder}>
                          {folder === 'all' ? 'Tutte le cartelle' : folder.charAt(0).toUpperCase() + folder.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ak-subtle mb-2 flex items-center gap-2">
                      <Tag size={16} /> Tag
                    </label>
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full px-3 py-2 bg-ak-panel/80 border border-ak-line/60 rounded-xl text-ak-text focus:ring-2 focus:ring-indigo-200"
                    >
                      {tags.map(tag => (
                        <option key={tag} value={tag}>
                          {tag === 'all' ? 'Tutti i tag' : `#${tag}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-6">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-xl text-ak-subtle">
                    {notes.length === 0 ? 'Nessuna nota salvata' : 'Nessuna nota trovata'}
                  </p>
                  {notes.length === 0 && (
                    <button
                      onClick={onAdd}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-ak-accent to-ak-accent  text-white rounded-xl font-medium transition-all"
                    >
                      Crea la tua prima nota
                    </button>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
                }>
                  {sortedNotes.map((note, index) => {
                    const colorClasses = getColorClasses(note.color)
                    
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${colorClasses.light} border-2 ${colorClasses.light.split(' ')[1]} rounded-xl p-4 hover:shadow-xl transition-all relative group`}
                      >
                        {/* Pin Badge */}
                        {note.is_pinned && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-ak-text rounded-full p-2 shadow-lg">
                            📌
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="font-bold text-ak-text text-lg mb-2 pr-8">
                          {note.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-ak-muted text-sm mb-3 line-clamp-3">
                          {note.content || 'Nessun contenuto'}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-ak-panel/50 text-ak-muted rounded text-xs flex items-center gap-1">
                            <Folder size={12} />
                            {note.folder}
                          </span>
                          <span className="px-2 py-1 bg-ak-panel/50 text-ak-muted rounded text-xs flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(note.updated_at)}
                          </span>
                        </div>

                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-ak-hover text-ak-cyan rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onTogglePin(note.id)}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                              note.is_pinned
                                ? 'bg-yellow-500 text-ak-text hover:bg-yellow-600'
                                : 'bg-ak-panel text-ak-muted hover:bg-ak-inset'
                            }`}
                          >
                            <Pin size={16} className="inline" />
                          </button>
                          <button
                            onClick={() => onEdit(note)}
                            className="flex-1 px-3 py-2 bg-ak-accent hover:bg-ak-accent text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            <Edit size={16} className="inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questa nota?')) {
                                onDelete(note.id)
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-ak-danger-bg hover:bg-ak-danger-bg text-ak-danger rounded-lg font-medium transition-colors text-sm"
                          >
                            <Trash2 size={16} className="inline" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
