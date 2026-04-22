import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string | null
}

export interface UserPermissions {
  is_admin: boolean
  can_warehouse: boolean
  can_prelievo: boolean
  can_tickets: boolean
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setPermissions(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const [{ data: profileData }, { data: permsData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', userId).single(),
        supabase.from('user_permissions').select('is_admin, can_warehouse, can_prelievo, can_tickets').eq('user_id', userId).single(),
      ])
      if (profileData) setProfile(profileData as UserProfile)
      if (permsData) setPermissions(permsData as UserPermissions)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, profile, permissions, loading, signIn, signOut }
}
