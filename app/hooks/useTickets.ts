'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export type TicketCategory = 'ordine' | 'preventivo' | 'assistenza' | 'documentazione' | 'chiamata'
export type CallDirection = 'in' | 'out'

export interface TicketAttachment {
  id: string
  ticket_id: string
  uploaded_by: string | null
  uploaded_by_name: string | null
  file_name: string
  file_size: number | null
  file_type: string | null
  storage_path: string
  public_url: string
  created_at: string
}

export interface TicketAssignee {
  user_id: string
  user_name: string
  assigned_at: string
}

export interface TeamProfile {
  id: string
  full_name: string
  email: string
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
  category: TicketCategory
  call_direction: CallDirection | null
  preventivo_id: string | null
  preventivo_numero: string | null
  assignees: TicketAssignee[]
  attachments: TicketAttachment[]
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [teamProfiles, setTeamProfiles] = useState<TeamProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Carica profili utenti con can_tickets (o tutti come fallback)
  const loadTeamProfiles = useCallback(async () => {
    try {
      const { data: perms } = await supabase
        .from('user_permissions')
        .select('user_id')
        .or('can_tickets.eq.true,is_admin.eq.true')

      const userIds = (perms || []).map((p: any) => p.user_id)

      if (userIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
          .order('full_name')
        setTeamProfiles((data || []) as TeamProfile[])
      } else {
        // fallback: tutti i profili
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name')
        setTeamProfiles((data || []) as TeamProfile[])
      }
    } catch {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')
      setTeamProfiles((data || []) as TeamProfile[])
    }
  }, [])

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

      // Carica assignees + allegati per tutti i ticket visibili
      const ids = (ticketsData || []).map((t: any) => t.id)
      let assigneesMap: Record<string, TicketAssignee[]> = {}
      let attachmentsMap: Record<string, TicketAttachment[]> = {}
      if (ids.length > 0) {
        const [{ data: assigneesData }, { data: attachmentsData }] = await Promise.all([
          supabase.from('ticket_assignees').select('*').in('ticket_id', ids),
          supabase.from('ticket_attachments').select('*').in('ticket_id', ids).order('created_at'),
        ])
        for (const a of assigneesData || []) {
          if (!assigneesMap[a.ticket_id]) assigneesMap[a.ticket_id] = []
          assigneesMap[a.ticket_id].push({ user_id: a.user_id, user_name: a.user_name || '', assigned_at: a.assigned_at })
        }
        for (const f of attachmentsData || []) {
          if (!attachmentsMap[f.ticket_id]) attachmentsMap[f.ticket_id] = []
          attachmentsMap[f.ticket_id].push(f as TicketAttachment)
        }
      }

      setTickets((ticketsData || []).map((t: any) => ({
        ...t,
        category: t.category || 'assistenza',
        call_direction: t.call_direction || null,
        preventivo_id: t.preventivo_id || null,
        preventivo_numero: t.preventivo_numero || null,
        assignees: assigneesMap[t.id] || [],
        attachments: attachmentsMap[t.id] || [],
      })))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) { loadTickets(); loadTeamProfiles() }
    else { setTickets([]); setTeamProfiles([]) }
  }, [user?.id])

  // ─── Crea ticket ───────────────────────────────────────────────
  const addTicket = async (data: {
    title: string
    description?: string
    priority: Ticket['priority']
    category: Ticket['category']
    call_direction?: Ticket['call_direction']
    preventivo_id?: string | null
    preventivo_numero?: string | null
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
        category: data.category,
        call_direction: data.call_direction || null,
        preventivo_id: data.preventivo_id || null,
        preventivo_numero: data.preventivo_numero || null,
        status: 'aperto',
        due_date: data.due_date || null,
        created_by: user.id,
        created_by_name: data.creatorName || user.email || '',
        user_id: user.id,
      }])
      .select()
      .single()
    if (error) { console.error('addTicket error:', error); return null }

    if (data.assignees.length > 0) {
      const rows = data.assignees.map(a => ({ ticket_id: newTicket.id, user_id: a.user_id, user_name: a.user_name }))
      await supabase.from('ticket_assignees').insert(rows)
    }

    await loadTickets()
    logActivity('create', 'ticket', data.title, `Nuovo ticket [${data.category}]: ${data.title}`)
    return newTicket
  }

  // ─── Aggiorna ticket ───────────────────────────────────────────
  const updateTicket = async (id: string, data: Partial<Pick<Ticket, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'category' | 'call_direction' | 'preventivo_id' | 'preventivo_numero'>> & {
    assignees?: { user_id: string; user_name: string }[]
  }) => {
    const { assignees, ...fields } = data
    const { error } = await supabase
      .from('tickets')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('updateTicket error:', error); return }

    if (assignees !== undefined) {
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
    // Elimina allegati da Storage
    const atts = ticket?.attachments || []
    if (atts.length > 0) {
      await supabase.storage.from('ticket-attachments').remove(atts.map(a => a.storage_path))
    }
    await supabase.from('tickets').delete().eq('id', id)
    setTickets(prev => prev.filter(t => t.id !== id))
    logActivity('delete', 'ticket', ticket?.title || 'Ticket', `Eliminato ticket`)
  }

  // ─── Upload allegato ──────────────────────────────────────────
  const uploadAttachment = async (ticketId: string, file: File): Promise<TicketAttachment | null> => {
    if (!user) return null
    try {
      const ext = file.name.split('.').pop()
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
      const path = `${ticketId}/${Date.now()}_${safeBase}`
      const { error: upErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) { console.error('uploadAttachment error:', upErr); return null }
      const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(path)

      const { data: att, error: dbErr } = await supabase
        .from('ticket_attachments')
        .insert([{
          ticket_id: ticketId,
          uploaded_by: user.id,
          uploaded_by_name: user.email || '',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: path,
          public_url: urlData.publicUrl,
        }])
        .select()
        .single()
      if (dbErr) { console.error('uploadAttachment db error:', dbErr); return null }

      // Aggiorna state locale
      setTickets(prev => prev.map(t => t.id === ticketId
        ? { ...t, attachments: [...t.attachments, att as TicketAttachment] }
        : t
      ))
      return att as TicketAttachment
    } catch (e) {
      console.error('uploadAttachment exception:', e)
      return null
    }
  }

  // ─── Elimina allegato ─────────────────────────────────────────
  const deleteAttachment = async (attachment: TicketAttachment) => {
    await supabase.storage.from('ticket-attachments').remove([attachment.storage_path])
    await supabase.from('ticket_attachments').delete().eq('id', attachment.id)
    setTickets(prev => prev.map(t => t.id === attachment.ticket_id
      ? { ...t, attachments: t.attachments.filter(a => a.id !== attachment.id) }
      : t
    ))
  }

  return { tickets, teamProfiles, loading, addTicket, updateTicket, updateStatus, deleteTicket, uploadAttachment, deleteAttachment, reload: loadTickets }
}
