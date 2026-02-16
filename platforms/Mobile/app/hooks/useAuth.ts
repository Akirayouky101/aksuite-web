'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Centralized auth hook - use this in ALL hooks instead of
 * creating separate onAuthStateChange subscriptions.
 * Stabilizes user reference by comparing user.id (string),
 * preventing infinite re-render loops from object reference changes.
 */
export function useAuth() {
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
        // Only update state if user.id actually changed
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
      // Only trigger re-render if user identity actually changed
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

  return { user, userId: userIdRef.current, authLoading: loading }
}
