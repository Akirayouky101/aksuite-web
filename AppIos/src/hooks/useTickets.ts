import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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
  category: string
  created_by_name: string | null
  due_date: string | null
  created_at: string
  assignees: { user_id: string; user_name: string }[]
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
      const adminIds = (perms || []).filter((p: any) => p.is_admin).map((p: any) => p.user_id)

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles').select('id, full_name, email').in('id', userIds).order('full_name')
        setTeamProfiles((profilesData || []) as TeamProfile[])
        setAdminProfiles((profilesData || []).filter((p: any) => adminIds.includes(p.id)) as TeamProfile[])
      }

      // tickets
      const { data: ticketsData } = await supabase
        .from('tickets').select('*').order('created_at', { ascending: false })
      const ids = (ticketsData || []).map((t: any) => t.id)
      let assigneesMap: Record<string, any[]> = {}
      if (ids.length > 0) {
        const { data: assigneesData } = await supabase.from('ticket_assignees').select('*').in('ticket_id', ids)
        for (const a of assigneesData || []) {
          if (!assigneesMap[a.ticket_id]) assigneesMap[a.ticket_id] = []
          assigneesMap[a.ticket_id].push({ user_id: a.user_id, user_name: a.user_name || '' })
        }
      }
      setTickets((ticketsData || []).map((t: any) => ({ ...t, assignees: assigneesMap[t.id] || [] })))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createTicket = async (data: {
    title: string
    description?: string
    priority: 'bassa' | 'normale' | 'alta' | 'urgente'
    category: string
    assignees: { user_id: string; user_name: string }[]
    due_date?: string | null
    creatorName?: string
  }) => {
    if (!user) return null
    const { data: t, error } = await supabase.from('tickets').insert([{
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      category: data.category,
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

  const updateStatus = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchAll()
  }

  return { tickets, teamProfiles, adminProfiles, loading, createTicket, updateStatus, reload: fetchAll }
}
