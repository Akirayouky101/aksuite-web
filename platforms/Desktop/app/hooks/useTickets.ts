'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface TicketAssignee {
  user_id: string
  user_name: string
  assigned_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: 'aperto' | 'in_corso' | 'completato' | 'chiuso'
  priority: 'bassa' | 'normale' | 'alta' | 'urgente'
  created_by: string | null
  created_by_name: string | null
  due_date: string | null
  user_id: string
  created_at: string
  updated_at: string
  assignees: TicketAssignee[]
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Carica tickets (la RLS filtra già quelli visibili all'utente)
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) { console.error('loadTickets error:', error); setLoading(false); return }

      // Carica assignees per tutti i ticket visibili
      const ids = (ticketsData || []).map((t: any) => t.id)
      let assigneesMap: Record<string, TicketAssignee[]> = {}
      if (ids.length > 0) {
        const { data: assigneesData } = await supabase
          .from('ticket_assignees')
          .select('*')
          .in('ticket_id', ids)
        for (const a of assigneesData || []) {
          if (!assigneesMap[a.ticket_id]) assigneesMap[a.ticket_id] = []
          assigneesMap[a.ticket_id].push({ user_id: a.user_id, user_name: a.user_name || '', assigned_at: a.assigned_at })
        }
      }

      setTickets((ticketsData || []).map((t: any) => ({
        ...t,
        assignees: assigneesMap[t.id] || []
      })))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) loadTickets()
    else setTickets([])
  }, [user?.id])

  // ─── Crea ticket ───────────────────────────────────────────────
  const addTicket = async (data: {
    title: string
    description?: string
    priority: Ticket['priority']
    due_date?: string | null
    assignees: { user_id: string; user_name: string }[]
    creatorName?: string
  }) => {
    if (!user) return null

    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert([{
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: 'aperto',
        due_date: data.due_date || null,
        created_by: user.id,
        created_by_name: data.creatorName || user.email || '',
        user_id: user.id,
      }])
      .select()
      .single()
    if (error) { console.error('addTicket error:', error); return null }

    // Inserisci assignees
    if (data.assignees.length > 0) {
      const rows = data.assignees.map(a => ({
        ticket_id: newTicket.id,
        user_id: a.user_id,
        user_name: a.user_name,
      }))
      await supabase.from('ticket_assignees').insert(rows)
    }

    await loadTickets()
    logActivity('create', 'ticket', data.title, `Nuovo ticket: ${data.title}`)
    return newTicket
  }

  // ─── Aggiorna ticket ───────────────────────────────────────────
  const updateTicket = async (id: string, data: Partial<Pick<Ticket, 'title' | 'description' | 'status' | 'priority' | 'due_date'>> & {
    assignees?: { user_id: string; user_name: string }[]
  }) => {
    const { assignees, ...fields } = data
    const { error } = await supabase
      .from('tickets')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('updateTicket error:', error); return }

    if (assignees !== undefined) {
      // Sostituisce tutti gli assignees
      await supabase.from('ticket_assignees').delete().eq('ticket_id', id)
      if (assignees.length > 0) {
        await supabase.from('ticket_assignees').insert(
          assignees.map(a => ({ ticket_id: id, user_id: a.user_id, user_name: a.user_name }))
        )
      }
    }

    await loadTickets()
    logActivity('update', 'ticket', fields.title || 'Ticket', `Aggiornato ticket`)
  }

  // ─── Cambia status veloce ─────────────────────────────────────
  const updateStatus = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  // ─── Elimina ticket ────────────────────────────────────────────
  const deleteTicket = async (id: string) => {
    const ticket = tickets.find(t => t.id === id)
    await supabase.from('tickets').delete().eq('id', id)
    setTickets(prev => prev.filter(t => t.id !== id))
    logActivity('delete', 'ticket', ticket?.title || 'Ticket', `Eliminato ticket`)
  }

  return { tickets, loading, addTicket, updateTicket, updateStatus, deleteTicket, reload: loadTickets }
}
