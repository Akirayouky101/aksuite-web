'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface TeamMember {
  id: string
  user_id: string
  name: string
  role: string
  created_at: string
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setMembers([]); setLoading(false); return }
    let mounted = true
    const loadMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        if (mounted) setMembers(data || [])
      } catch (error) {
        console.error('Error loading team members:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadMembers()
    return () => { mounted = false }
  }, [user?.id])

  const addMember = async (name: string, role: string = '') => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('team_members')
      .insert([{ name, role, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    if (data) {
      setMembers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      logActivity('create', 'team_member', data.name, data.role || '')
      return data
    }
    return null
  }

  const deleteMember = async (id: string) => {
    const memberToDelete = members.find(m => m.id === id)
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (error) throw error
    setMembers(prev => prev.filter(m => m.id !== id))
    logActivity('delete', 'team_member', memberToDelete?.name || '', '')
  }

  return { members, loading, addMember, deleteMember }
}
