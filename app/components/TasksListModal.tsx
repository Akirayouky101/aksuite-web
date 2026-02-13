'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Filter, ArrowUpDown, Download, CheckCircle2, Circle, Clock, Edit, Trash2, Calendar, Tag, Plus } from 'lucide-react'
import TasksDashboard from './TasksDashboard'
import TaskModal from './TaskModal'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: 'todo' | 'in-progress' | 'completed'
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  is_recurring: boolean
  recurring_type: string | null
  tags: string[]
  subtasks: Array<{ id: string; title: string; completed: boolean }>
  created_at: string
}

interface TasksListModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onDelete: (id: string) => Promise<void>
  onToggleComplete: (id: string, completed: boolean) => Promise<void>
  onUpdate: (id: string, data: any) => Promise<void>
  onAdd: (data: any) => Promise<void>
}

const statusColors = {
  todo: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300' },
  'in-progress': { bg: 'bg-blue-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300' }
}

const priorityColors: Record<string, string> = {
  bassa: 'bg-green-500/20 border-green-500/30 text-green-300',
  media: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  alta: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  urgente: 'bg-red-500/20 border-red-500/30 text-red-300'
}

const categoryEmojis: Record<string, string> = {
  lavoro: '💼',
  personale: '👤',
  urgente: '⚡',
  shopping: '🛒',
  altro: '📋'
}

export default function TasksListModal({ isOpen, onClose, tasks, onDelete, onToggleComplete, onUpdate, onAdd }: TasksListModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'due_date'>('date')
  const [showDashboard, setShowDashboard] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filtraggio
  let filteredTasks = tasks.filter(task => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !task.title.toLowerCase().includes(term) &&
        !task.description.toLowerCase().includes(term) &&
        !task.tags.some(tag => tag.toLowerCase().includes(term))
      ) return false
    }
    
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    if (!showCompleted && task.is_completed) return false
    
    return true
  })

  // Ordinamento
  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgente: 0, alta: 1, media: 2, bassa: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    } else if (sortBy === 'due_date') {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    return 0
  })

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Titolo', 'Descrizione', 'Categoria', 'Priorità', 'Status', 'Scadenza', 'Ricorrente', 'Tag', 'Completato', 'Data Creazione']
    const rows = filteredTasks.map(task => [
      task.title,
      task.description.replace(/"/g, '""'),
      task.category,
      task.priority,
      task.status,
      task.due_date ? new Date(task.due_date).toLocaleDateString('it-IT') : '',
      task.is_recurring ? `Sì (${task.recurring_type})` : 'No',
      task.tags.join(', '),
      task.is_completed ? 'Sì' : 'No',
      new Date(task.created_at).toLocaleString('it-IT')
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleSaveTask = async (data: any) => {
    if (editingTask) {
      // Modifica task esistente
      await onUpdate(editingTask.id, data)
    } else {
      // Crea nuovo task
      await onAdd(data)
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-slate-900/30  z-50 flex items-center justify-center p-4 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-6xl w-full overflow-x-hidden"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-600 rounded-3xl hidden" />
            
            <div className="relative bg-white rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Task Manager</h2>
                    <p className="text-sm text-slate-400">{tasks.length} task registrati</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="group relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>

              {/* New Task Button + Dashboard Toggle */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-2">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="w-full px-4 py-3 rounded-lg font-bold text-base transition-all bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-green-700 hover:to-emerald-700 text-slate-800 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nuovo Task
                </button>
                
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  {showDashboard ? '📊 Nascondi Dashboard' : '📊 Mostra Dashboard'}
                </button>
              </div>

              {/* Dashboard */}
              {showDashboard && (
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                  <TasksDashboard tasks={tasks} />
                </div>
              )}

              {/* Search and Export */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cerca per titolo, descrizione, tag..."
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-green-700 hover:to-emerald-700 text-slate-800 font-semibold text-sm flex items-center gap-2 transition-all"
                    title="Esporta in CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
                
                <div className="text-xs text-slate-400">
                  {filteredTasks.length} di {tasks.length} task
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                  >
                    <option value="all">Tutte le categorie</option>
                    <option value="lavoro">💼 Lavoro</option>
                    <option value="personale">👤 Personale</option>
                    <option value="urgente">⚡ Urgente</option>
                    <option value="shopping">🛒 Shopping</option>
                    <option value="altro">📋 Altro</option>
                  </select>

                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none text-sm"
                  >
                    <option value="all">Tutte le priorità</option>
                    <option value="urgente">🔴 Urgente</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="media">🟡 Media</option>
                    <option value="bassa">🟢 Bassa</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="todo">📋 Da Fare</option>
                    <option value="in-progress">🔄 In Corso</option>
                    <option value="completed">✅ Completato</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:border-pink-500 focus:outline-none text-sm"
                  >
                    <option value="date">📅 Data Creazione</option>
                    <option value="priority">⚡ Priorità</option>
                    <option value="due_date">🗓️ Scadenza</option>
                  </select>

                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      showCompleted
                        ? 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {showCompleted ? 'Tutti' : 'Solo Attivi'}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(90vh-200px)]">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✓</div>
                    <p className="text-slate-400 text-lg">
                      {tasks.length === 0 
                        ? 'Nessun task registrato'
                        : 'Nessun task con questi filtri'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => {
                      const completedSubtasks = task.subtasks.filter(st => st.completed).length
                      const totalSubtasks = task.subtasks.length
                      const overdue = !task.is_completed && isOverdue(task.due_date)
                      
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`rounded-xl border-2 p-4 ${statusColors[task.status].bg} ${statusColors[task.status].border} ${
                            overdue ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900' : ''
                          } transition-all`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Checkbox */}
                              <button
                                onClick={() => onToggleComplete(task.id, !task.is_completed)}
                                className="mt-1 flex-shrink-0"
                              >
                                {task.is_completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                                ) : (
                                  <Circle className="w-6 h-6 text-slate-400 hover:text-slate-400" />
                                )}
                              </button>

                              <div className="flex-1 space-y-3">
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">
                                    {categoryEmojis[task.category] || '📋'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h3 className={`text-xl font-bold ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {task.title}
                                      </h3>
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[task.priority]}`}>
                                        {task.priority.toUpperCase()}
                                      </span>
                                      {task.is_recurring && (
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/30 border border-purple-500/50 text-purple-300">
                                          🔄 {task.recurring_type === 'daily' ? 'GIORNALIERO' : task.recurring_type === 'weekly' ? 'SETTIMANALE' : 'MENSILE'}
                                        </span>
                                      )}
                                      {overdue && (
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/30 border border-red-500/50 text-red-300 animate-pulse">
                                          ⚠️ SCADUTO
                                        </span>
                                      )}
                                    </div>
                                    {task.description && (
                                      <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Tags */}
                                {task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {task.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded text-xs font-semibold flex items-center gap-1"
                                      >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Subtasks Progress */}
                                {totalSubtasks > 0 && (
                                  <div className="bg-white rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-slate-400 font-semibold">
                                        Sottotask: {completedSubtasks}/{totalSubtasks}
                                      </span>
                                      <span className="text-sm text-slate-400">
                                        {Math.round((completedSubtasks / totalSubtasks) * 100)}%
                                      </span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Due Date */}
                                {task.due_date && (
                                  <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-300' : 'text-slate-400'}`}>
                                    <Calendar className="w-4 h-4" />
                                    <span>Scadenza: {formatDate(task.due_date)}</span>
                                  </div>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Creato il {formatDate(task.created_at)}
                                  </div>
                                  <div className={`${statusColors[task.status].text}`}>
                                    {task.status === 'todo' ? '📋 Da Fare' : task.status === 'in-progress' ? '🔄 In Corso' : '✅ Completato'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-indigo-500/30 rounded-lg transition-colors"
                                title="Modifica"
                              >
                                <Edit className="w-5 h-5 text-indigo-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                disabled={deletingId === task.id}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                                title="Elimina"
                              >
                                <Trash2 className="w-5 h-5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
        }}
        onSave={handleSaveTask}
        editTask={editingTask}
      />
    </>
  )
}
