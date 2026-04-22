import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface TeamProfile {
  id: string
  full_name: string
  email: string
}

export interface TicketReply {
  id: string
  ticket_id: string
  content: string
  author_id: string | null
  author_name: string | null
  created_at: string
}

export interface Ticket {
  id: string
  serial_number: number | null
  title: string
  description: string | null
  status: 'aperto' | 'in_corso' | 'completato' | 'chiuso'
  priority: 'bassa' | 'normale' | 'alta' | 'urgente'
  category: string
  created_by: string | null
  created_by_name: string | null
  due_date: string | null
  created_at: string
  assignees: { user_id: string; user_name: string }[]
  replies: TicketReply[]
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [teamProfiles, setTeamProfiles] = useState<TeamProfile[]>([])
  const [adminProfiles, setAdminProfiles] = useState<TeamProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      // team profiles (can_tickets or admin)
      const { data: perms } = await supabase
        .from('user_permissions')
        .select('user_id, is_admin')
        .or('can_tickets.eq.true,is_admin.eq.true')

      const userIds = (perms || []).map((p: any) => p.user_id)

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles').select('id, full_name, email').in('id', userIds).order('full_name')
        setTeamProfiles((profilesData || []) as TeamProfile[])
        setAdminProfiles((profilesData || []) as TeamProfile[])
      } else {
        const { data: allProfiles } = await supabase
          .from('profiles').select('id, full_name, email').order('full_name')
        setTeamProfiles((allProfiles || []) as TeamProfile[])
        setAdminProfiles((allProfiles || []) as TeamProfile[])
      }

      // tickets
      const { data: ticketsData } = await supabase
        .from('tickets').select('*').order('created_at', { ascending: false })
      const ids = (ticketsData || []).map((t: any) => t.id)

      let assigneesMap: Record<string, any[]> = {}
      let repliesMap: Record<string, TicketReply[]> = {}

      if (ids.length > 0) {
        const [{ data: assigneesData }, { data: repliesData }] = await Promise.all([
          supabase.from('ticket_assignees').select('*').in('ticket_id', ids),
          supabase.from('ticket_replies').select('*').in('ticket_id', ids).order('created_at', { ascending: true }),
        ])
        for (const a of assigneesData || []) {
          if (!assigneesMap[a.ticket_id]) assigneesMap[a.ticket_id] = []
          assigneesMap[a.ticket_id].push({ user_id: a.user_id, user_name: a.user_name || '' })
        }
        for (const r of repliesData || []) {
          if (!repliesMap[r.ticket_id]) repliesMap[r.ticket_id] = []
          repliesMap[r.ticket_id].push(r as TicketReply)
        }
      }

      setTickets((ticketsData || []).map((t: any) => ({
        ...t,
        assignees: assigneesMap[t.id] || [],
        replies: repliesMap[t.id] || [],
      })))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createTicket = async (data: {
    title: string
    description?: string
    priority: 'bassa' | 'normale' | 'alta' | 'urgente'
    assignees: { user_id: string; user_name: string }[]
    due_date?: string | null
    creatorName?: string
  }) => {
    if (!user) return null
    const { data: t, error } = await supabase.from('tickets').insert([{
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      category: 'generale',
      status: 'aperto',
      due_date: data.due_date || null,
      created_by: user.id,
      created_by_name: data.creatorName || user.email || '',
      user_id: user.id,
    }]).select().single()
    if (error) { console.error(error); return null }
    if (data.assignees.length > 0) {
      await supabase.from('ticket_assignees').insert(
        data.assignees.map(a => ({ ticket_id: t.id, user_id: a.user_id, user_name: a.user_name }))
      )
    }
    await fetchAll()
    return t
  }

  const addReply = async (ticketId: string, content: string) => {
    if (!user) return null
    const { data: r, error } = await supabase.from('ticket_replies').insert([{
      ticket_id: ticketId,
      content: content.trim(),
      author_id: user.id,
      author_name: (user as any).full_name || user.email || 'Utente',
    }]).select().single()
    if (error) { console.error(error); return null }
    // update local state without refetching all
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, replies: [...t.replies, r as TicketReply] } : t
    ))
    return r
  }

  const updateStatus = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchAll()
  }

  return { tickets, teamProfiles, adminProfiles, loading, createTicket, addReply, updateStatus, reload: fetchAll }
}
