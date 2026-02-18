'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ActivityLog {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: 'create' | 'update' | 'delete'
  entity_type: string
  entity_name: string
  details: string
  created_at: string
}

// Mappa entity_type a etichetta e emoji
export const ENTITY_LABELS: Record<string, { label: string; emoji: string }> = {
  call: { label: 'Chiamata', emoji: '\u{1F4DE}' },
  client: { label: 'Cliente', emoji: '\u{1F465}' },
  visit: { label: 'Visita', emoji: '\u{1F4CD}' },
  task: { label: 'Task', emoji: '\u{2705}' },
  note: { label: 'Nota', emoji: '\u{1F4DD}' },
  event: { label: 'Evento', emoji: '\u{1F4C5}' },
  lavorazione: { label: 'Lavorazione', emoji: '\u{1F527}' },
  supplier: { label: 'Fornitore', emoji: '\u{1F69A}' },
  order: { label: 'Ordine', emoji: '\u{1F6D2}' },
  product: { label: 'Prodotto', emoji: '\u{1F4E6}' },
  team_member: { label: 'Membro Team', emoji: '\u{1F464}' },
  budget: { label: 'Bilancio', emoji: '\u{1F4B0}' },
  budget_limit: { label: 'Limite Budget', emoji: '\u{1F6A8}' },
  budget_recurring: { label: 'Ricorrente', emoji: '\u{1F504}' },
  password: { label: 'Password', emoji: '\u{1F512}' },
  user: { label: 'Utente', emoji: '\u{1F9D1}' },
  permission: { label: 'Permesso', emoji: '\u{1F6E1}' },
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'ha creato', color: '#22c55e' },
  update: { label: 'ha modificato', color: '#f59e0b' },
  delete: { label: 'ha eliminato', color: '#ef4444' },
}

export function useActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = useCallback(async (limit: number = 100) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error loading activity logs:', error)
        return
      }
      setLogs(data || [])
    } catch (err) {
      console.error('Error loading activity logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Funzione globale per registrare un'attivita'
  const logActivity = useCallback(async (
    action: 'create' | 'update' | 'delete',
    entityType: string,
    entityName: string,
    details?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Carica il nome dal profilo
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_name: profile?.full_name || user.user_metadata?.full_name || 'Utente',
        user_email: profile?.email || user.email || '',
        action,
        entity_type: entityType,
        entity_name: entityName,
        details: details || '',
      }])
    } catch (err) {
      // Non bloccare l'operazione se il log fallisce
      console.warn('Activity log failed:', err)
    }
  }, [])

  const clearOldLogs = useCallback(async (daysToKeep: number = 90) => {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      await supabase
        .from('activity_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
    } catch (err) {
      console.error('Error clearing old logs:', err)
    }
  }, [])

  return {
    logs,
    loading,
    loadLogs,
    logActivity,
    clearOldLogs,
    ENTITY_LABELS,
    ACTION_LABELS,
  }
}
