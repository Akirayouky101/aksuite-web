'use client'

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  userId: string | null
  authLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, userId: null, authLoading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const nextUser = session?.user ?? null
      userIdRef.current = nextUser?.id ?? null
      setUser(nextUser)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const nextUser = session?.user ?? null
      userIdRef.current = nextUser?.id ?? null
      setUser(nextUser)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  return <AuthContext.Provider value={{ user, userId: userIdRef.current, authLoading: loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
