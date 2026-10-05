import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

export function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configurazione Supabase server mancante.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function authenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1]
  if (!token) throw new UnauthorizedError()
  const client = serverClient()
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) throw new UnauthorizedError()
  return { user, client }
}

export class UnauthorizedError extends Error {
  constructor() { super('Accedi nuovamente per continuare.') }
}

export function validCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new Error('CRON_SECRET non configurato.')
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get('authorization') || '')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
