'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Search, X, Lock, Phone, CheckCircle2, FileText, Calendar, DollarSign, UserCheck } from 'lucide-react'
import { EntityType, RelationType } from '../hooks/useRelations'

interface RelationManagerProps {
  currentType: EntityType
  currentId: string
  currentTitle: string
  availableItems: {
    passwords?: any[]
    calls?: any[]
    visits?: any[]
    tasks?: any[]
    notes?: any[]
    events?: any[]
    transactions?: any[]
  }
  onAddRelation: (targetType: EntityType, targetId: string, relationType: RelationType, notes: string) => void
}

const ENTITY_CONFIG = {
  password: { icon: Lock, label: 'Password', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  call: { icon: Phone, label: 'Chiamata', color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  visit: { icon: UserCheck, label: 'Visita', color: 'text-pink-400', bg: 'bg-pink-900/30' },
  task: { icon: CheckCircle2, label: 'Task', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  note: { icon: FileText, label: 'Nota', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  event: { icon: Calendar, label: 'Evento', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
  transaction: { icon: DollarSign, label: 'Transazione', color: 'text-green-400', bg: 'bg-green-900/30' }
}

const RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: 'related', label: '🔗 Collegato' },
  { value: 'depends_on', label: '⚡ Dipende da' },
  { value: 'blocks', label: '🚫 Blocca' },
  { value: 'implements', label: '✅ Implementa' },
  { value: 'references', label: '📖 Riferimento' }
]

export default function RelationManager({
  currentType,
  currentId,
  currentTitle,
  availableItems,
  onAddRelation
}: RelationManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EntityType>('task')
  const [searchQuery, setSearchQuery] = useState('')
  const [relationType, setRelationType] = useState<RelationType>('related')
  const [relationNotes, setRelationNotes] = useState('')

  const getItemsForType = (type: EntityType) => {
    switch (type) {
      case 'password': return availableItems.passwords || []
      case 'call': return availableItems.calls || []
      case 'visit': return availableItems.visits || []
      case 'task': return availableItems.tasks || []
      case 'note': return availableItems.notes || []
      case 'event': return availableItems.events || []
      case 'transaction': return availableItems.transactions || []
      default: return []
    }
  }

  const getItemTitle = (type: EntityType, item: any) => {
    switch (type) {
      case 'password': return item.service || 'Password'
      case 'call': return item.caller_name || 'Chiamata'
      case 'visit': return item.visitor_name || 'Visita'
      case 'task': return item.title || 'Task'
      case 'note': return item.title || 'Nota'
      case 'event': return item.title || 'Evento'
      case 'transaction': return item.description || 'Transazione'
      default: return 'Item'
    }
  }

  const filteredItems = getItemsForType(selectedType)
    .filter(item => item.id !== currentId) // Don't show current item
    .filter(item => {
      const title = getItemTitle(selectedType, item).toLowerCase()
      return title.includes(searchQuery.toLowerCase())
    })

  const handleAddRelation = (targetId: string) => {
    onAddRelation(selectedType, targetId, relationType, relationNotes)
    setIsOpen(false)
    setSearchQuery('')
    setRelationNotes('')
    setRelationType('related')
  }

  const Icon = ENTITY_CONFIG[currentType].icon

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
      >
        <Link2 size={20} />
        Collega ad altri elementi
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-gray-700"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Link2 size={24} />
                    Collega Elementi
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Current Item */}
                <div className={`${ENTITY_CONFIG[currentType].bg} border border-gray-600 rounded-lg p-3 flex items-center gap-3`}>
                  <Icon className={ENTITY_CONFIG[currentType].color} size={20} />
                  <div>
                    <div className="text-xs text-gray-400">{ENTITY_CONFIG[currentType].label} corrente</div>
                    <div className="text-white font-medium">{currentTitle}</div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-240px)]">
                {/* Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collega a:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(ENTITY_CONFIG) as EntityType[])
                      .filter(type => type !== currentType)
                      .map(type => {
                        const config = ENTITY_CONFIG[type]
                        const TypeIcon = config.icon
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedType === type
                                ? `${config.bg} border-gray-500`
                                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            <TypeIcon className={`${config.color} mx-auto mb-1`} size={20} />
                            <div className="text-xs text-gray-300">{config.label}</div>
                          </button>
                        )
                      })}
                  </div>
                </div>

                {/* Relation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo di collegamento:
                  </label>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as RelationType)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {RELATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cerca {ENTITY_CONFIG[selectedType].label}:
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Cerca ${ENTITY_CONFIG[selectedType].label.toLowerCase()}...`}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note collegamento (opzionale):
                  </label>
                  <input
                    type="text"
                    value={relationNotes}
                    onChange={(e) => setRelationNotes(e.target.value)}
                    placeholder="Es: Necessario per completare il task..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Items List */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">
                    Seleziona elemento ({filteredItems.length} disponibili):
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        {searchQuery ? 'Nessun risultato trovato' : `Nessun ${ENTITY_CONFIG[selectedType].label.toLowerCase()} disponibile`}
                      </div>
                    ) : (
                      filteredItems.map((item, index) => {
                        const ItemIcon = ENTITY_CONFIG[selectedType].icon
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleAddRelation(item.id)}
                            className={`w-full ${ENTITY_CONFIG[selectedType].bg} hover:bg-gray-700 border border-gray-600 rounded-lg p-3 text-left transition-all flex items-center gap-3`}
                          >
                            <ItemIcon className={ENTITY_CONFIG[selectedType].color} size={18} />
                            <div className="flex-1">
                              <div className="text-white font-medium">{getItemTitle(selectedType, item)}</div>
                              {selectedType === 'call' && item.phone && (
                                <div className="text-xs text-gray-400">{item.phone}</div>
                              )}
                              {selectedType === 'event' && item.start_date && (
                                <div className="text-xs text-gray-400">
                                  {new Date(item.start_date).toLocaleDateString('it-IT')}
                                </div>
                              )}
                            </div>
                            <Link2 size={16} className="text-gray-400" />
                          </motion.button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
