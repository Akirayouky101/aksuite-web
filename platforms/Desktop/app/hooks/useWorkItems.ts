'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export type WorkStatus = 'planned' | 'in_progress' | 'waiting' | 'completed'
export type WorkPriority = 'low' | 'normal' | 'high'
export type WorkKind = 'work' | 'todo'
export type WorkUnit = 'pezzi' | 'metri'
export interface ChecklistEntry {
  id: string
  text: string
  done: boolean
  quantity?: number
  unit?: WorkUnit
  materialId?: string
  steps?: ChecklistEntry[]
}

export function linkedQuantity(entries: ChecklistEntry[], materialId: string, unit: WorkUnit): number {
  return entries.reduce((total, entry) =>
    total + (entry.materialId === materialId && (entry.unit || 'pezzi') === unit ? entry.quantity || 1 : 0) + linkedQuantity(entry.steps || [], materialId, unit), 0)
}

export function installedQuantity(entries: ChecklistEntry[], materialId: string, unit: WorkUnit): number {
  return entries.reduce((total, entry) =>
    total + (entry.done && entry.materialId === materialId && (entry.unit || 'pezzi') === unit ? entry.quantity || 1 : 0) + installedQuantity(entry.steps || [], materialId, unit), 0)
}

export function mismatchedQuantity(entries: ChecklistEntry[], materialId: string, unit: WorkUnit): number {
  return entries.reduce((total, entry) =>
    total + (entry.materialId === materialId && (entry.unit || 'pezzi') !== unit ? entry.quantity || 1 : 0) + mismatchedQuantity(entry.steps || [], materialId, unit), 0)
}

export function synchronizeMaterialUsage(materials: ChecklistEntry[], checklist: ChecklistEntry[], previousChecklist: ChecklistEntry[] = checklist): ChecklistEntry[] {
  return materials.map(material => {
    const unit = material.unit || 'pezzi'
    const hasLink = linkedQuantity(checklist, material.id, unit) > 0 || mismatchedQuantity(checklist, material.id, unit) > 0
    const hadLink = linkedQuantity(previousChecklist, material.id, unit) > 0 || mismatchedQuantity(previousChecklist, material.id, unit) > 0
    if (!hasLink && !hadLink) return material
    const complete = hasLink && !mismatchedQuantity(checklist, material.id, unit)
      && Math.abs(installedQuantity(checklist, material.id, unit) - (material.quantity || 1)) < 0.000001
    return { ...material, done: complete }
  })
}

export function materialsCoverage(materials: ChecklistEntry[], checklist: ChecklistEntry[]) {
  const materialIds = new Set(materials.map(material => material.id))
  const countOrphans = (entries: ChecklistEntry[]): number => entries.reduce((total, entry) =>
    total + (entry.materialId && !materialIds.has(entry.materialId) ? 1 : 0) + countOrphans(entry.steps || []), 0)
  const matched = materials.filter(material => Math.abs(installedQuantity(checklist, material.id, material.unit || 'pezzi') - (material.quantity || 1)) < 0.000001 && !mismatchedQuantity(checklist, material.id, material.unit || 'pezzi')).length
  const unitMismatches = materials.reduce((total, material) => total + mismatchedQuantity(checklist, material.id, material.unit || 'pezzi'), 0)
  return { matched, total: materials.length, orphaned: countOrphans(checklist), unitMismatches }
}

export function checklistProgress(entries: ChecklistEntry[] | null | undefined) {
  const items = (entries || []).filter(entry => entry.text.trim()).flatMap(entry => {
    const steps = entry.steps?.filter(step => step.text.trim())
    return steps?.length ? steps : [entry]
  })
  const done = items.filter(entry => entry.done).length
  return { done, total: items.length, percent: items.length ? Math.round(done / items.length * 100) : 0 }
}

export interface WorkItem {
  id: string
  user_id: string
  kind: WorkKind
  client_id: string | null
  title: string
  description: string
  status: WorkStatus
  priority: WorkPriority
  scheduled_at: string | null
  due_date: string | null
  next_action: string
  notes: string
  checklist: ChecklistEntry[]
  materials: ChecklistEntry[]
  created_at: string
  updated_at: string
}

export type WorkItemInput = Omit<WorkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function useWorkItems() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    let mounted = true
    if (!user) {
      setWorkItems([])
      setLoading(false)
      return () => { mounted = false }
    }

    const loadWorkItems = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('work_items')
          .select('*')
          .order('updated_at', { ascending: false })
        if (error) throw error
        if (mounted) {
          setWorkItems(data || [])
          setErrorMessage(null)
        }
      } catch (error) {
        console.error('Error fetching work items:', error)
        if (mounted) setErrorMessage('Impossibile caricare le lavorazioni. Verifica che la tabella work_items sia stata configurata su Supabase.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadWorkItems()
    return () => { mounted = false }
  }, [user?.id])

  const addWorkItem = async (input: WorkItemInput) => {
    if (!user) throw new Error('Devi accedere per salvare una lavorazione.')
    const workItem = { ...input, materials: synchronizeMaterialUsage(input.materials, input.checklist) }
    const { data, error } = await supabase
      .from('work_items')
      .insert([{ ...workItem, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setWorkItems(current => [data, ...current])
    return data as WorkItem
  }

  const updateWorkItem = async (id: string, updates: Partial<WorkItemInput>) => {
    const previous = workItems.find(item => item.id === id)
    const changes = previous && (updates.checklist || updates.materials)
      ? { ...updates, materials: synchronizeMaterialUsage(updates.materials || previous.materials, updates.checklist || previous.checklist, previous.checklist) }
      : updates
    const { data, error } = await supabase
      .from('work_items')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setWorkItems(current => current.map(item => item.id === id ? data : item))
    return data as WorkItem
  }

  const deleteWorkItem = async (id: string) => {
    const { error } = await supabase.from('work_items').delete().eq('id', id)
    if (error) throw error
    setWorkItems(current => current.filter(item => item.id !== id))
  }

  return { workItems, loading, errorMessage, addWorkItem, updateWorkItem, deleteWorkItem }
}