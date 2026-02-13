'use client'

import { useState, useEffect } from 'react'
import { EntityType, RelationType, RelatedItem } from '../hooks/useRelations'
import RelationManager from './RelationManager'
import RelatedItemsPanel from './RelatedItemsPanel'

interface RelationsIntegrationProps {
  // Current item details
  entityType: EntityType
  entityId: string | null // null for new items
  entityTitle: string
  
  // Available items to link
  availableItems: {
    passwords?: any[]
    calls?: any[]
    tasks?: any[]
    notes?: any[]
    events?: any[]
    transactions?: any[]
  }
  
  // Relation operations
  onAddRelation: (targetType: EntityType, targetId: string, relationType: RelationType, notes: string) => void
  onRemoveRelation: (relationId: string) => void
  getRelatedItems: (type: EntityType, id: string, items: any) => Promise<RelatedItem[]>
  
  // Optional navigation handler
  onNavigateToItem?: (type: EntityType, id: string) => void
}

export default function RelationsIntegration({
  entityType,
  entityId,
  entityTitle,
  availableItems,
  onAddRelation,
  onRemoveRelation,
  getRelatedItems,
  onNavigateToItem
}: RelationsIntegrationProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entityId) {
      loadRelatedItems()
    }
  }, [entityId])

  const loadRelatedItems = async () => {
    if (!entityId) return
    
    setLoading(true)
    try {
      const items = await getRelatedItems(entityType, entityId, availableItems)
      setRelatedItems(items)
    } catch (error) {
      console.error('Error loading related items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRelation = async (
    targetType: EntityType,
    targetId: string,
    relationType: RelationType,
    notes: string
  ) => {
    onAddRelation(targetType, targetId, relationType, notes)
    // Reload related items
    setTimeout(loadRelatedItems, 500)
  }

  const handleRemoveRelation = async (relationId: string) => {
    onRemoveRelation(relationId)
    setRelatedItems(prev => prev.filter(item => item.relation_id !== relationId))
  }

  // Don't show for new items (no entityId yet)
  if (!entityId) {
    return (
      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4">
        <p className="text-slate-400 text-sm text-center">
          💡 Salva prima questo elemento per poter creare collegamenti
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Related Items Panel */}
      {loading ? (
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-6 text-center">
          <div className="text-slate-400">Caricamento collegamenti...</div>
        </div>
      ) : (
        <RelatedItemsPanel
          relatedItems={relatedItems}
          onRemoveRelation={handleRemoveRelation}
          onNavigate={onNavigateToItem}
        />
      )}

      {/* Relation Manager */}
      <RelationManager
        currentType={entityType}
        currentId={entityId}
        currentTitle={entityTitle}
        availableItems={availableItems}
        onAddRelation={handleAddRelation}
      />
    </div>
  )
}
