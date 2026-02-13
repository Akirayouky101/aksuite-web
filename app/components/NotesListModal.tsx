'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Filter, Grid, List, Pin, Edit, Trash2, 
  Tag, Folder, Plus, Download, Calendar 
} from 'lucide-react'
import { Note } from '../hooks/useNotes'

interface NotesListModalProps {
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
  blue: { light: 'bg-blue-100 border-blue-300', dark: 'bg-blue-900/30 border-blue-700', text: 'text-blue-600' },
  green: { light: 'bg-green-100 border-green-300', dark: 'bg-green-900/30 border-green-700', text: 'text-green-600' },
  yellow: { light: 'bg-yellow-100 border-yellow-300', dark: 'bg-yellow-900/30 border-yellow-700', text: 'text-yellow-600' },
  red: { light: 'bg-red-100 border-red-300', dark: 'bg-red-900/30 border-red-700', text: 'text-red-600' },
  purple: { light: 'bg-purple-100 border-purple-300', dark: 'bg-purple-900/30 border-purple-700', text: 'text-purple-600' },
  pink: { light: 'bg-pink-100 border-pink-300', dark: 'bg-pink-900/30 border-pink-700', text: 'text-pink-600' },
  orange: { light: 'bg-orange-100 border-orange-300', dark: 'bg-orange-900/30 border-orange-700', text: 'text-orange-600' },
  gray: { light: 'bg-gray-100 border-gray-300', dark: 'bg-slate-50 border-slate-200', text: 'text-gray-600' }
}

export default function NotesListModal({
  isOpen,
  onClose,
  notes,
  onDelete,
  onUpdate,
  onTogglePin,
  onEdit,
  onAdd
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 ">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-900/30 to-orange-900/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  📝 Note Manager
                  <span className="text-lg font-normal text-slate-400">
                    ({sortedNotes.length} {sortedNotes.length === 1 ? 'nota' : 'note'})
                  </span>
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-green-700 hover:to-emerald-700 text-slate-800 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nuova Nota
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showFilters
                      ? 'bg-blue-600 text-slate-800'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Filter size={20} />
                  Filtri
                </button>

                <button
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showPinnedOnly
                      ? 'bg-yellow-600 text-black'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
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
                        ? 'bg-blue-600 text-slate-800'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-slate-800'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>

                <button
                  onClick={exportNotes}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  Esporta CSV
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca nelle note..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                      <Folder size={16} /> Cartella
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400"
                    >
                      {folders.map(folder => (
                        <option key={folder} value={folder}>
                          {folder === 'all' ? 'Tutte le cartelle' : folder.charAt(0).toUpperCase() + folder.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                      <Tag size={16} /> Tag
                    </label>
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400"
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
                  <p className="text-xl text-slate-400">
                    {notes.length === 0 ? 'Nessuna nota salvata' : 'Nessuna nota trovata'}
                  </p>
                  {notes.length === 0 && (
                    <button
                      onClick={onAdd}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-green-700 hover:to-emerald-700 text-slate-800 rounded-lg font-medium transition-all"
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
                        className={`${colorClasses.dark} border-2 ${colorClasses.dark.split(' ')[1]} rounded-xl p-4 hover:shadow-xl transition-all relative group`}
                      >
                        {/* Pin Badge */}
                        {note.is_pinned && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-2 shadow-lg">
                            📌
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="font-bold text-slate-800 text-lg mb-2 pr-8">
                          {note.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-slate-500 text-sm mb-3 line-clamp-3">
                          {note.content || 'Nessun contenuto'}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-slate-50/50 text-slate-500 rounded text-xs flex items-center gap-1">
                            <Folder size={12} />
                            {note.folder}
                          </span>
                          <span className="px-2 py-1 bg-slate-50/50 text-slate-500 rounded text-xs flex items-center gap-1">
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
                                className="px-2 py-1 bg-blue-900/50 text-indigo-400 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onTogglePin(note.id)}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                              note.is_pinned
                                ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <Pin size={16} className="inline" />
                          </button>
                          <button
                            onClick={() => onEdit(note)}
                            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors text-sm"
                          >
                            <Edit size={16} className="inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questa nota?')) {
                                onDelete(note.id)
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-slate-800 rounded-lg font-medium transition-colors text-sm"
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
