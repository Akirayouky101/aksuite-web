'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type EntityType = 'password' | 'call' | 'task' | 'note' | 'event' | 'transaction' | 'visit'
export type RelationType = 'related' | 'depends_on' | 'blocks' | 'implements' | 'references'

export interface ItemRelation {
  id: string
  user_id?: string
  source_type: EntityType
  source_id: string
  target_type: EntityType
  target_id: string
  relation_type: RelationType
  notes: string
  created_at: string
}

export interface RelatedItem {
  relation_id: string
  type: EntityType
  id: string
  title: string
  data: any
  relation_type: RelationType
  notes: string
}

export function useRelations() {
  const [relations, setRelations] = useState<ItemRelation[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadRelations()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadRelations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('item_relations')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading relations from Supabase:', error)
          loadFromLocalStorage()
        } else {
          setRelations(data || [])
        }
      } else {
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error in loadRelations:', error)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('item_relations')
    if (stored) {
      setRelations(JSON.parse(stored))
    }
  }

  const saveToLocalStorage = (updatedRelations: ItemRelation[]) => {
    localStorage.setItem('item_relations', JSON.stringify(updatedRelations))
  }

  const addRelation = async (
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    relationType: RelationType = 'related',
    notes: string = ''
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const relationData = {
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        relation_type: relationType,
        notes
      }

      if (user) {
        const { data, error } = await supabase
          .from('item_relations')
          .insert([{ ...relationData, user_id: user.id }])
          .select()
          .single()

        if (error) {
          console.error('Error adding relation to Supabase:', error)
          addRelationLocally(relationData)
        } else {
          setRelations(prev => [data, ...prev])
        }
      } else {
        addRelationLocally(relationData)
      }
    } catch (error) {
      console.error('Error in addRelation:', error)
    }
  }

  const addRelationLocally = (relationData: Omit<ItemRelation, 'id' | 'user_id' | 'created_at'>) => {
    const newRelation: ItemRelation = {
      ...relationData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    }
    const updatedRelations = [newRelation, ...relations]
    setRelations(updatedRelations)
    saveToLocalStorage(updatedRelations)
  }

  const removeRelation = async (relationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('item_relations')
          .delete()
          .eq('id', relationId)

        if (error) {
          console.error('Error deleting relation from Supabase:', error)
          removeRelationLocally(relationId)
        } else {
          setRelations(prev => prev.filter(r => r.id !== relationId))
        }
      } else {
        removeRelationLocally(relationId)
      }
    } catch (error) {
      console.error('Error in removeRelation:', error)
      removeRelationLocally(relationId)
    }
  }

  const removeRelationLocally = (relationId: string) => {
    const updatedRelations = relations.filter(r => r.id !== relationId)
    setRelations(updatedRelations)
    saveToLocalStorage(updatedRelations)
  }

  // Get all relations for a specific item (both as source and target)
  const getRelationsFor = (type: EntityType, id: string): ItemRelation[] => {
    return relations.filter(
      r => (r.source_type === type && r.source_id === id) ||
           (r.target_type === type && r.target_id === id)
    )
  }

  // Get related items with their full data
  const getRelatedItems = async (
    type: EntityType,
    id: string,
    allItems: {
      passwords?: any[]
      calls?: any[]
      tasks?: any[]
      notes?: any[]
      events?: any[]
      transactions?: any[]
      visits?: any[]
    }
  ): Promise<RelatedItem[]> => {
    const itemRelations = getRelationsFor(type, id)
    const relatedItems: RelatedItem[] = []

    for (const relation of itemRelations) {
      // Determine if this item is source or target
      const isSource = relation.source_type === type && relation.source_id === id
      const relatedType = isSource ? relation.target_type : relation.source_type
      const relatedId = isSource ? relation.target_id : relation.source_id

      // Find the related item in the provided data
      let item: any = null
      let title = 'Unknown'

      switch (relatedType) {
        case 'password':
          item = allItems.passwords?.find(p => p.id === relatedId)
          title = item?.service || 'Password'
          break
        case 'call':
          item = allItems.calls?.find(c => c.id === relatedId)
          title = item?.caller_name || 'Call'
          break
        case 'task':
          item = allItems.tasks?.find(t => t.id === relatedId)
          title = item?.title || 'Task'
          break
        case 'note':
          item = allItems.notes?.find(n => n.id === relatedId)
          title = item?.title || 'Note'
          break
        case 'event':
          item = allItems.events?.find(e => e.id === relatedId)
          title = item?.title || 'Event'
          break
        case 'transaction':
          item = allItems.transactions?.find(t => t.id === relatedId)
          title = item?.description || 'Transaction'
          break
        case 'visit':
          item = allItems.visits?.find(v => v.id === relatedId)
          title = item?.visitor_name || 'Visit'
          break
      }

      if (item) {
        relatedItems.push({
          relation_id: relation.id,
          type: relatedType,
          id: relatedId,
          title,
          data: item,
          relation_type: relation.relation_type,
          notes: relation.notes
        })
      }
    }

    return relatedItems
  }

  // Count relations by type for an item
  const getRelationCounts = (type: EntityType, id: string) => {
    const itemRelations = getRelationsFor(type, id)
    const counts: Record<EntityType, number> = {
      password: 0,
      call: 0,
      task: 0,
      note: 0,
      event: 0,
      transaction: 0,
      visit: 0
    }

    itemRelations.forEach(relation => {
      const isSource = relation.source_type === type && relation.source_id === id
      const relatedType = isSource ? relation.target_type : relation.source_type
      counts[relatedType]++
    })

    return counts
  }

  return {
    relations,
    user,
    loading,
    addRelation,
    removeRelation,
    getRelationsFor,
    getRelatedItems,
    getRelationCounts,
    refreshRelations: loadRelations
  }
}
