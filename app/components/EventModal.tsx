'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, Clock, MapPin, Palette, Repeat, Bell } from 'lucide-react'
import { Event } from '../hooks/useEvents'
import RelationsIntegration from './RelationsIntegration'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  editEvent?: Event | null
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
  { name: 'red', class: 'bg-red-500', light: 'bg-red-100', dark: 'bg-red-900' },
  { name: 'purple', class: 'bg-purple-500', light: 'bg-purple-100', dark: 'bg-purple-900' },
  { name: 'orange', class: 'bg-orange-500', light: 'bg-orange-100', dark: 'bg-orange-900' },
  { name: 'pink', class: 'bg-pink-500', light: 'bg-pink-100', dark: 'bg-pink-900' },
  { name: 'yellow', class: 'bg-yellow-500', light: 'bg-yellow-100', dark: 'bg-yellow-900' },
  { name: 'gray', class: 'bg-gray-500', light: 'bg-gray-100', dark: 'bg-slate-50' }
]

const RECURRING_TYPES = [
  { value: '', label: 'Non ripetere' },
  { value: 'daily', label: 'Giornaliero' },
  { value: 'weekly', label: 'Settimanale' },
  { value: 'monthly', label: 'Mensile' },
  { value: 'yearly', label: 'Annuale' }
]

const REMINDER_OPTIONS = [
  { value: 0, label: 'Nessun promemoria' },
  { value: 15, label: '15 minuti prima' },
  { value: 30, label: '30 minuti prima' },
  { value: 60, label: '1 ora prima' },
  { value: 120, label: '2 ore prima' },
  { value: 1440, label: '1 giorno prima' }
]

export default function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editEvent,
  availableItems,
  onAddRelation,
  onRemoveRelation,
  getRelatedItems,
  onNavigateToItem
}: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
    location: '',
    color: 'blue',
    is_recurring: false,
    recurring_type: null as string | null,
    reminder_minutes: 30
  })

  useEffect(() => {
    if (editEvent) {
      // Format dates for datetime-local input
      const startDate = new Date(editEvent.start_date)
      const endDate = editEvent.end_date ? new Date(editEvent.end_date) : null

      setFormData({
        title: editEvent.title,
        description: editEvent.description,
        start_date: formatDateTimeLocal(startDate),
        end_date: endDate ? formatDateTimeLocal(endDate) : '',
        all_day: editEvent.all_day,
        location: editEvent.location,
        color: editEvent.color,
        is_recurring: editEvent.is_recurring,
        recurring_type: editEvent.recurring_type,
        reminder_minutes: editEvent.reminder_minutes
      })
    } else {
      // Default to now
      const now = new Date()
      now.setMinutes(0)
      setFormData({
        title: '',
        description: '',
        start_date: formatDateTimeLocal(now),
        end_date: '',
        all_day: false,
        location: '',
        color: 'blue',
        is_recurring: false,
        recurring_type: null,
        reminder_minutes: 30
      })
    }
  }, [editEvent, isOpen])

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.start_date) return

    // Convert datetime-local to ISO string
    const eventData = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      recurring_type: formData.is_recurring ? formData.recurring_type : null
    }

    onSave(eventData)
    onClose()
  }

  const selectedColor = COLORS.find(c => c.name === formData.color) || COLORS[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 ">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className={`${selectedColor.dark} p-6 border-b border-slate-200`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  📅 {editEvent ? 'Modifica Evento' : 'Nuovo Evento'}
                </h2>
                <button
                  onClick={onClose}
                  className="group relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  placeholder="Es: Riunione, Compleanno, Scadenza..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                  placeholder="Aggiungi dettagli..."
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, all_day: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-slate-50 border-slate-200 rounded focus:ring-indigo-400"
                />
                <label htmlFor="all_day" className="text-slate-500 font-medium">
                  Evento giornata intera
                </label>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> Data Inizio *
                  </label>
                  <input
                    type={formData.all_day ? 'date' : 'datetime-local'}
                    value={formData.all_day ? formData.start_date.split('T')[0] : formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <Clock size={16} /> Data Fine
                  </label>
                  <input
                    type={formData.all_day ? 'date' : 'datetime-local'}
                    value={formData.all_day && formData.end_date ? formData.end_date.split('T')[0] : formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <MapPin size={16} /> Luogo
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  placeholder="Es: Ufficio, Casa, Online..."
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
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

              {/* Recurring */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      is_recurring: e.target.checked,
                      recurring_type: e.target.checked ? 'weekly' : null
                    }))}
                    className="w-5 h-5 text-blue-600 bg-slate-50 border-slate-200 rounded focus:ring-indigo-400"
                  />
                  <label htmlFor="is_recurring" className="text-slate-500 font-medium flex items-center gap-2">
                    <Repeat size={16} /> Evento ricorrente
                  </label>
                </div>

                {formData.is_recurring && (
                  <select
                    value={formData.recurring_type || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurring_type: e.target.value || null }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    {RECURRING_TYPES.slice(1).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reminder */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Bell size={16} /> Promemoria
                </label>
                <select
                  value={formData.reminder_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_minutes: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  {REMINDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {/* Collegamenti Multi-Entità */}
            {editEvent?.id && (
              <div className="p-6 border-t border-slate-200 space-y-3">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  🔗 Collegamenti
                </h4>
                <RelationsIntegration
                  entityType="event"
                  entityId={editEvent.id}
                  entityTitle={formData.title}
                  availableItems={availableItems || {}}
                  onAddRelation={(targetType, targetId, relationType, notes) => {
                    if (onAddRelation && editEvent?.id) {
                      onAddRelation('event', editEvent.id, targetType, targetId, relationType, notes)
                    }
                  }}
                  onRemoveRelation={onRemoveRelation || (async () => {})}
                  getRelatedItems={getRelatedItems || (async () => [])}
                  onNavigateToItem={onNavigateToItem}
                />
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50/50">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Save size={20} />
                  {editEvent ? 'Aggiorna Evento' : 'Salva Evento'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
