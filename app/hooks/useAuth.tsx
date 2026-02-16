'use client'

import { useState, useEffect, useRef, useContext, createContext, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ═══ AUTH CONTEXT — Single source of truth for auth state ═══
// Only ONE onAuthStateChange subscription for the entire app.

interface AuthContextValue {
  user: User | null
  userId: string | null
  authLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userId: null,
  authLoading: true,
})

/**
 * AuthProvider - wrap your app in this (in layout.tsx).
 * Creates exactly ONE onAuthStateChange subscription.
 * All hooks that call useAuth() read from this shared context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        const newUser = session?.user ?? null
        if (newUser?.id !== userIdRef.current) {
          userIdRef.current = newUser?.id ?? null
          setUser(newUser)
        }
      } catch (e) {
        console.warn('Auth session error:', e)
      }
      if (mounted) setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const newUser = session?.user ?? null
      const newId = newUser?.id ?? null
      if (newId !== userIdRef.current) {
        userIdRef.current = newId
        setUser(newUser)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userId: userIdRef.current, authLoading: loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth - reads from the shared AuthContext.
 * No new subscriptions created. Zero re-render overhead.
 */
export function useAuth() {
  return useContext(AuthContext)
}
