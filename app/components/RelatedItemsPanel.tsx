'use client'

import { motion } from 'framer-motion'
import { Link2Off, Lock, Phone, CheckCircle2, FileText, Calendar, DollarSign, UserCheck, ExternalLink } from 'lucide-react'
import { RelatedItem, EntityType } from '../hooks/useRelations'

interface RelatedItemsPanelProps {
  relatedItems: RelatedItem[]
  onRemoveRelation: (relationId: string) => void
  onNavigate?: (type: EntityType, id: string) => void
}

const ENTITY_CONFIG = {
  password: { icon: Lock, label: 'Password', color: 'text-teal-400', bg: 'bg-blue-900/30', border: 'border-blue-700' },
  call: { icon: Phone, label: 'Chiamata', color: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-700' },
  visit: { icon: UserCheck, label: 'Visita', color: 'text-pink-400', bg: 'bg-pink-900/30', border: 'border-pink-700' },
  task: { icon: CheckCircle2, label: 'Task', color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700' },
  note: { icon: FileText, label: 'Nota', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700' },
  event: { icon: Calendar, label: 'Evento', color: 'text-indigo-400', bg: 'bg-indigo-900/30', border: 'border-indigo-700' },
  transaction: { icon: DollarSign, label: 'Transazione', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700' }
}

const RELATION_LABELS = {
  related: '🔗 Collegato',
  depends_on: '⚡ Dipende da',
  blocks: '🚫 Blocca',
  implements: '✅ Implementa',
  references: '📖 Riferimento'
}

export default function RelatedItemsPanel({
  relatedItems,
  onRemoveRelation,
  onNavigate
}: RelatedItemsPanelProps) {
  if (relatedItems.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
        <Link2Off className="mx-auto text-gray-600 mb-3" size={48} />
        <p className="text-gray-400 text-sm">
          Nessun elemento collegato
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Usa il pulsante qui sotto per collegare password, chiamate, task, note o eventi
        </p>
      </div>
    )
  }

  // Group by type
  const groupedItems = relatedItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<EntityType, RelatedItem[]>)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Link2Off size={18} />
          Collegamenti ({relatedItems.length})
        </h4>
      </div>

      <div className="space-y-3">
        {(Object.keys(groupedItems) as EntityType[]).map(type => {
          const items = groupedItems[type]
          const config = ENTITY_CONFIG[type]
          const TypeIcon = config.icon

          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <TypeIcon size={14} />
                {config.label} ({items.length})
              </div>

              {items.map((item, index) => (
                <motion.div
                  key={item.relation_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${config.bg} border ${config.border} rounded-lg p-3 group hover:bg-opacity-70 transition-all`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TypeIcon className={`${config.color} flex-shrink-0 mt-0.5`} size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-900/50 text-gray-400 rounded">
                            {RELATION_LABELS[item.relation_type]}
                          </span>
                          {item.notes && (
                            <span className="text-xs px-2 py-0.5 bg-gray-900/50 text-gray-400 rounded truncate max-w-[200px]"
                              title={item.notes}
                            >
                              💭 {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate(item.type, item.id)}
                          className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors"
                          title="Vai a"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Rimuovere questo collegamento?')) {
                            onRemoveRelation(item.relation_id)
                          }
                        }}
                        className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                        title="Rimuovi collegamento"
                      >
                        <Link2Off size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(groupedItems) as EntityType[]).slice(0, 3).map(type => {
            const config = ENTITY_CONFIG[type]
            const TypeIcon = config.icon
            const count = groupedItems[type].length
            return (
              <div key={type} className={`${config.bg} border ${config.border} rounded px-2 py-1.5 flex items-center gap-1.5`}>
                <TypeIcon className={config.color} size={14} />
                <span className="text-white font-bold text-sm">{count}</span>
                <span className="text-xs text-gray-400 truncate">{config.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
