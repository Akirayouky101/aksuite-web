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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-2xl opacity-30" />
          
          <div className="relative bg-slate-900 rounded-2xl max-h-[90vh] overflow-hidden border-2 border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {editTask ? 'Modifica Task' : 'Nuovo Task'}
                  </h2>
                  <p className="text-sm text-slate-400">Organizza le tue attività</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group relative w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
              {/* Titolo */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Es. Completare presentazione progetto"
                  required
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Dettagli del task..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Categoria e Priorità */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="lavoro">💼 Lavoro</option>
                    <option value="personale">👤 Personale</option>
                    <option value="urgente">⚡ Urgente</option>
                    <option value="shopping">🛒 Shopping</option>
                    <option value="altro">📋 Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Priorità
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
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
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'todo' | 'in-progress' | 'completed' })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="todo">📋 Da Fare</option>
                    <option value="in-progress">🔄 In Corso</option>
                    <option value="completed">✅ Completato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Scadenza
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
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
                    className="w-5 h-5 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-slate-300">
                    🔄 Task Ricorrente
                  </span>
                </label>

                {formData.is_recurring && (
                  <select
                    value={formData.recurring_type}
                    onChange={(e) => setFormData({ ...formData, recurring_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
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
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  🏷️ Tag
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Aggiungi tag..."
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold flex items-center gap-2"
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
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  ✓ Sottotask
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    placeholder="Aggiungi sottotask..."
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask.id)}
                        className="flex-shrink-0"
                      >
                        {subtask.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collegamenti Multi-Entità */}
              {editTask?.id && (
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
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

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvataggio...' : editTask ? 'Aggiorna' : 'Crea Task'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
