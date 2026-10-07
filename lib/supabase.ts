import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const authLockQueues = new Map<string, Promise<void>>()

const authLock = async <T>(_name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> => {
  const previous = authLockQueues.get(_name) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  authLockQueues.set(_name, previous.then(() => current))
  await previous
  try {
    return await fn()
  } finally {
    release()
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: authLock },
})

// Password secrets are encrypted client-side by lib/passwordVault (see docs/password-vault.md).

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      passwords: {
        Row: {
          id: string
          user_id: string
          title: string
          username: string
          encrypted_password: string
          pin_code: string | null
          encrypted_pin_code: string | null
          vault_format: number
          website: string | null
          category: string
          emoji: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          username: string
          encrypted_password: string
          pin_code?: string | null
          encrypted_pin_code?: string | null
          vault_format?: number
          website?: string | null
          category?: string
          emoji?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          username?: string
          encrypted_password?: string
          pin_code?: string | null
          encrypted_pin_code?: string | null
          vault_format?: number
          website?: string | null
          category?: string
          emoji?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
