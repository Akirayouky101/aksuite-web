'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react'
import RelationsIntegration from './RelationsIntegration'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: {
    title: string
    description: string
    category: string
    priority: string
    status: 'todo' | 'in-progress' | 'completed'
    due_date: string | null
    is_recurring: boolean
    recurring_type: string | null
    tags: string[]
    subtasks: Subtask[]
  }) => Promise<void>
  editTask?: {
    id: string
    title: string
    description: string
    category: string
    priority: string
    status: 'todo' | 'in-progress' | 'completed'
    due_date: string | null
    is_recurring: boolean
    recurring_type: string | null
    tags: string[]
    subtasks: Subtask[]
  } | null
  // Relazioni multi-entità
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

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editTask,
  availableItems,
  onAddRelation,
  onRemoveRelation,
  getRelatedItems,
  onNavigateToItem
}: TaskModalProps) {
  const [formData, setFormData] = useState<{
    title: string
    description: string
    category: string
    priority: string
    status: 'todo' | 'in-progress' | 'completed'
    due_date: string
    is_recurring: boolean
    recurring_type: string
    tags: string[]
    subtasks: Subtask[]
  }>({
    title: '',
    description: '',
    category: 'personale',
    priority: 'media',
    status: 'todo',
    due_date: '',
    is_recurring: false,
    recurring_type: '',
    tags: [],
    subtasks: []
  })
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description,
        category: editTask.category,
        priority: editTask.priority,
        status: editTask.status,
        due_date: editTask.due_date ? editTask.due_date.split('T')[0] : '',
        is_recurring: editTask.is_recurring,
        recurring_type: editTask.recurring_type || '',
        tags: editTask.tags || [],
        subtasks: editTask.subtasks || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'personale',
        priority: 'media',
        status: 'todo',
        due_date: '',
        is_recurring: false,
        recurring_type: '',
        tags: [],
        subtasks: []
      })
    }
  }, [editTask, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...formData,
        due_date: formData.due_date || null,
        recurring_type: formData.is_recurring ? formData.recurring_type : null
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const subtask: Subtask = {
        id: Date.now().toString(),
        title: newSubtask.trim(),
        completed: false
      }
      setFormData({ ...formData, subtasks: [...formData.subtasks, subtask] })
      setNewSubtask('')
    }
  }

  const toggleSubtask = (id: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(st =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    })
  }

  const removeSubtask = (id: string) => {
    setFormData({ ...formData, subtasks: formData.subtasks.filter(st => st.id !== id) })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600 rounded-3xl hidden" />
          
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editTask ? 'Modifica Task' : 'Nuovo Task'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Organizza le tue attività</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Titolo */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Es. Completare presentazione progetto"
                  required
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Dettagli del task..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Categoria e Priorità */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  >
                    <option value="lavoro">💼 Lavoro</option>
                    <option value="personale">👤 Personale</option>
                    <option value="urgente">⚡ Urgente</option>
                    <option value="shopping">🛒 Shopping</option>
                    <option value="altro">📋 Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Priorità
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  >
                    <option value="bassa">🟢 Bassa</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>
              </div>

              {/* Status e Data Scadenza */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'todo' | 'in-progress' | 'completed' })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  >
                    <option value="todo">📋 Da Fare</option>
                    <option value="in-progress">🔄 In Corso</option>
                    <option value="completed">✅ Completato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Scadenza
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Ricorrenza */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-200 text-purple-500 focus:ring-indigo-400"
                  />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    🔄 Task Ricorrente
                  </span>
                </label>

                {formData.is_recurring && (
                  <select
                    value={formData.recurring_type}
                    onChange={(e) => setFormData({ ...formData, recurring_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  >
                    <option value="">Seleziona frequenza</option>
                    <option value="daily">📅 Giornaliero</option>
                    <option value="weekly">📆 Settimanale</option>
                    <option value="monthly">🗓️ Mensile</option>
                  </select>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  🏷️ Tag
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Aggiungi tag..."
                    className="flex-1 px-4 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-violet-50 border border-violet-200/60 text-violet-600 rounded-full text-xs font-semibold flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-purple-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  ✓ Sottotask
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    placeholder="Aggiungi sottotask..."
                    className="flex-1 px-4 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm text-sm"
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-white/60 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask.id)}
                        className="flex-shrink-0"
                      >
                        {subtask.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-400'}`}>
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collegamenti Multi-Entità */}
              {editTask?.id && (
                <div className="space-y-3 pt-4 border-t border-slate-100/80">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    🔗 Collegamenti
                  </h4>
                  <RelationsIntegration
                    entityType="task"
                    entityId={editTask.id}
                    entityTitle={formData.title}
                    availableItems={availableItems || {}}
                    onAddRelation={(targetType, targetId, relationType, notes) => {
                      if (onAddRelation && editTask?.id) {
                        onAddRelation('task', editTask.id, targetType, targetId, relationType, notes)
                      }
                    }}
                    onRemoveRelation={onRemoveRelation || (async () => {})}
                    getRelatedItems={getRelatedItems || (async () => [])}
                    onNavigateToItem={onNavigateToItem}
                  />
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={saving || !formData.title.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {saving ? '⏳ Salvataggio...' : editTask ? '✏️ Aggiorna Task' : '💾 Salva Task'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
