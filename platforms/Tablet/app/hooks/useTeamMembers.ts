'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface TeamMember {
  id: string
  user_id: string
  name: string
  role: string
  created_at: string
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadMembers(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadMembers(session.user.id)
      } else {
        setMembers([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadMembers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

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
      return data
    }
    return null
  }

  const deleteMember = async (id: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (error) throw error
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  return { members, loading, addMember, deleteMember }
}
