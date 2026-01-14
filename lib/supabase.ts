import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Encryption/Decryption utilities
const ENCRYPTION_KEY = 'your-secret-key-change-this' // TODO: Use env variable

export async function encryptPassword(password: string): Promise<string> {
  // Simple encryption for now - in production use proper crypto
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ENCRYPTION_KEY)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Base64 encode for storage
  return btoa(password) // Simple encoding for demo
}

export async function decryptPassword(encryptedPassword: string): Promise<string> {
  try {
    return atob(encryptedPassword) // Simple decoding for demo
  } catch {
    return encryptedPassword
  }
}

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
