'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Tag, Pin, Folder, Palette } from 'lucide-react'
import { Note } from '../hooks/useNotes'
import RelationsIntegration from './RelationsIntegration'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  editNote?: Note | null
  // Relazioni
  availableItems?: {
    passwords?: any[]
    calls?: any[]
    tasks?: any[]
    notes?: any[]
    events?: any[]
    transactions?: any[]
  }
  onAddRelation?: (sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string, relationType: RelationType, notes?: string) => Promise<void>
  onRemoveRelation?: (relationId: string) => Promise<void>
  getRelatedItems?: (type: EntityType, id: string, items: any) => Promise<RelatedItem[]>
  onNavigateToItem?: (type: EntityType, id: string) => void
}

const COLORS = [
  { name: 'blue', class: 'bg-blue-500', light: 'bg-blue-100', dark: 'bg-blue-900' },
  { name: 'green', class: 'bg-green-500', light: 'bg-green-100', dark: 'bg-green-900' },
  { name: 'yellow', class: 'bg-yellow-500', light: 'bg-yellow-100', dark: 'bg-yellow-900' },
  { name: 'red', class: 'bg-red-500', light: 'bg-red-100', dark: 'bg-red-900' },
  { name: 'purple', class: 'bg-purple-500', light: 'bg-purple-100', dark: 'bg-purple-900' },
  { name: 'pink', class: 'bg-pink-500', light: 'bg-pink-100', dark: 'bg-pink-900' },
  { name: 'orange', class: 'bg-orange-500', light: 'bg-orange-100', dark: 'bg-orange-900' },
  { name: 'gray', class: 'bg-gray-500', light: 'bg-gray-100', dark: 'bg-gray-900' }
]

const FOLDERS = [
  'general',
  'work',
  'personal',
  'ideas',
  'projects',
  'meeting-notes',
  'recipes',
  'other'
]

export default function NoteModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editNote,
  availableItems,
  onAddRelation,
  onRemoveRelation,
  getRelatedItems,
  onNavigateToItem
}: NoteModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    is_pinned: false,
    folder: 'general',
    color: 'blue'
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (editNote) {
      setFormData({
        title: editNote.title,
        content: editNote.content,
        tags: editNote.tags || [],
        is_pinned: editNote.is_pinned,
        folder: editNote.folder,
        color: editNote.color
      })
    } else {
      setFormData({
        title: '',
        content: '',
        tags: [],
        is_pinned: false,
        folder: 'general',
        color: 'blue'
      })
    }
  }, [editNote, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSave(formData)
    onClose()
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const selectedColor = COLORS.find(c => c.name === formData.color) || COLORS[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700"
          >
            {/* Header */}
            <div className={`${selectedColor.dark} p-6 border-b border-gray-700`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📝 {editNote ? 'Modifica Nota' : 'Nuova Nota'}
                </h2>
                <button
                  onClick={onClose}
                  className="group relative w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Inserisci il titolo della nota..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contenuto
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Scrivi qui il contenuto della nota..."
                />
              </div>

              {/* Folder & Pin Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Folder */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Folder size={16} /> Cartella
                  </label>
                  <select
                    value={formData.folder}
                    onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {FOLDERS.map(folder => (
                      <option key={folder} value={folder}>
                        {folder.charAt(0).toUpperCase() + folder.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pin Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Pin size={16} /> In Evidenza
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.is_pinned
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {formData.is_pinned ? '📌 Fissata' : 'Fissa Nota'}
                  </button>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Palette size={16} /> Colore
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                      className={`w-10 h-10 rounded-lg ${color.class} ${
                        formData.color === color.name
                          ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900'
                          : 'opacity-60 hover:opacity-100'
                      } transition-all`}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Tag size={16} /> Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Aggiungi tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Aggiungi
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2 border border-gray-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>

            {/* Collegamenti Multi-Entità */}
            {editNote?.id && (
              <div className="p-6 border-t border-gray-700 space-y-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  🔗 Collegamenti
                </h4>
                <RelationsIntegration
                  entityType="note"
                  entityId={editNote.id}
                  entityTitle={formData.title}
                  availableItems={availableItems || {}}
                  onAddRelation={(targetType, targetId, relationType, notes) => {
                    if (onAddRelation && editNote?.id) {
                      onAddRelation('note', editNote.id, targetType, targetId, relationType, notes)
                    }
                  }}
                  onRemoveRelation={onRemoveRelation || (async () => {})}
                  getRelatedItems={getRelatedItems || (async () => [])}
                  onNavigateToItem={onNavigateToItem}
                />
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-900/50">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Save size={20} />
                  {editNote ? 'Aggiorna Nota' : 'Salva Nota'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
