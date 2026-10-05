import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GoogleCredentials = { access_token: string; refresh_token: string; expires_at: number }
export type CalendarConnection = {
  user_id: string; credentials: string; google_subject: string; google_email: string; calendar_id: string | null;
  initial_from: string; sync_token: string | null; page_token: string | null; full_reset: boolean; last_sync_at: string | null; last_error: string | null
}
export type GoogleEvent = {
  id: string; etag: string; status?: string; summary?: string; description?: string; location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string }; end?: { date?: string; dateTime?: string; timeZone?: string };
  recurrence?: string[]; extendedProperties?: { private?: Record<string, string> }
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_TOKEN_ENCRYPTION_KEY && process.env.APP_URL)
}
export function appUrl() {
  const url = new URL(process.env.APP_URL || '')
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new Error('APP_URL deve essere HTTPS (HTTP consentito solo in locale).')
  }
  return url.origin
}
function encryptionKey() {
  const key = Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || '', 'base64')
  if (key.length !== 32) throw new Error('La chiave di cifratura Google deve contenere 32 byte in Base64.')
  return key
}
export function encryptGoogleCredentials(value: GoogleCredentials) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce)
  const payload = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString('base64')
}
export function decryptGoogleCredentials(value: string): GoogleCredentials {
  const buffer = Buffer.from(value, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), buffer.subarray(0, 12))
  decipher.setAuthTag(buffer.subarray(12, 28))
  const result: GoogleCredentials = JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8'))
  if (!result.access_token || !result.refresh_token || !Number.isFinite(result.expires_at)) throw new Error('Credenziali Google non valide. Ricollega il calendario.')
  return result
}
export const stateHash = (state: string) => createHash('sha256').update(state).digest('hex')

export class GoogleApiError extends Error {
  constructor(public status: number) {
    super(status === 401 ? 'Autorizzazione Google scaduta: ricollega il calendario.' : status === 403 ? 'Google ha negato l’accesso al calendario. Controlla i permessi e che Calendar API sia attiva.' : `Google Calendar ha restituito un errore (${status}). Riprova.`)
  }
}
export async function googleRequest<T>(accessToken: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...options, cache: 'no-store', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new GoogleApiError(response.status)
  if (response.status === 204) return undefined as T
  return response.json()
}
export async function googleAccessToken(client: SupabaseClient, connection: CalendarConnection) {
  const credentials = decryptGoogleCredentials(connection.credentials)
  if (credentials.expires_at > Date.now() + 60000) return credentials.access_token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(10000), cache: 'no-store',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: credentials.refresh_token, grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) throw new GoogleApiError(response.status)
  const token: { access_token: string; expires_in: number; refresh_token?: string } = await response.json()
  if (!token.access_token || !Number.isFinite(token.expires_in)) throw new Error('Risposta OAuth Google non valida.')
  const encrypted = encryptGoogleCredentials({
    access_token: token.access_token, refresh_token: token.refresh_token || credentials.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
  })
  const { error } = await client.from('google_calendar_connections').update({ credentials: encrypted })
    .eq('user_id', connection.user_id)
  if (error) throw error
  return token.access_token
}

function dateInRome(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(value))
}
function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export type LocalCalendarEvent = {
  id: string; user_id?: string; title: string; description: string; location: string;
  start_date: string; end_date: string | null; all_day: boolean; is_recurring: boolean; recurring_type: string | null; is_completed?: boolean
}
export function localEventHash(event: LocalCalendarEvent) {
  return stateHash(JSON.stringify([
    event.title, event.description || '', event.location || '',
    new Date(event.start_date).toISOString(), event.end_date ? new Date(event.end_date).toISOString() : null,
    event.all_day, event.is_recurring, event.recurring_type, Boolean(event.is_completed),
  ]))
}
const recurrenceFrequency: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }
export function toGoogleEvent(event: LocalCalendarEvent, userId: string, recurrence: string[] = [], timeZone = 'Europe/Rome') {
  const frequency = recurrenceFrequency[event.recurring_type || '']
  if (event.is_recurring && !frequency && !recurrence.length) throw new Error('Ricorrenza non rappresentabile su Google. Modificala prima di sincronizzare.')
  const preserveRecurrence = event.recurring_type === 'custom' || recurrence.some(rule => rule.includes(`FREQ=${frequency}`))
  const start = event.all_day ? { date: dateInRome(event.start_date) }   : { dateTime: new Date(event.start_date).toISOString(), timeZone }
  const end = event.all_day ? { date: shiftDate(dateInRome(event.end_date || event.start_date), 1) }
    : { dateTime: event.end_date || new Date(new Date(event.start_date).getTime() + 3600000).toISOString(), timeZone }
  return {
    summary: event.title, description: event.description || '', location: event.location || '', start, end,
    recurrence: event.is_recurring ? (preserveRecurrence ? recurrence : [`RRULE:FREQ=${frequency}`]) : [],
    extendedProperties: { private: {
      aksuite_user_id: userId, aksuite_event_id: event.id, aksuite_completed: String(Boolean(event.is_completed)),
      aksuite_no_end: String(!event.end_date), aksuite_start: event.start_date, aksuite_end: event.end_date || '',
    } },
  }
}
export function fromGoogleEvent(event: GoogleEvent, userId: string): Omit<LocalCalendarEvent, 'id' | 'user_id'> {
  if (!event.start || !event.end) throw new Error('Evento Google senza date valide.')
  const allDay = Boolean(event.start.date)
  let start = allDay ? `${event.start.date}T12:00:00Z` : event.start.dateTime
  let end = allDay && event.end.date ? `${shiftDate(event.end.date, -1)}T12:00:00Z` : event.end.dateTime
  const own = event.extendedProperties?.private?.aksuite_user_id === userId
  const metadata = event.extendedProperties?.private
  if (own && allDay && metadata?.aksuite_start && Number.isFinite(new Date(metadata.aksuite_start).getTime()) && dateInRome(metadata.aksuite_start) === event.start.date) start = metadata.aksuite_start
  if (own && allDay && metadata?.aksuite_end && Number.isFinite(new Date(metadata.aksuite_end).getTime()) && shiftDate(dateInRome(metadata.aksuite_end), 1) === event.end.date) end = metadata.aksuite_end
  if (own && event.extendedProperties?.private?.aksuite_no_end === 'true') end = undefined
  if (!start || !Number.isFinite(new Date(start).getTime()) || (end && !Number.isFinite(new Date(end).getTime()))) throw new Error('Date evento Google non valide.')
  const rule = event.recurrence?.find(rule => rule.startsWith('RRULE:')) || ''
  const frequency = Object.entries(recurrenceFrequency).find(([, frequency]) => rule.includes(`FREQ=${frequency}`))?.[0] || 'custom'
  return {
    title: event.summary || '(Senza titolo)', description: event.description || '', location: event.location || '',
    start_date: new Date(start).toISOString(), end_date: end ? new Date(end).toISOString() : null, all_day: allDay,
    is_recurring: Boolean(event.recurrence?.length), recurring_type: event.recurrence?.length ? frequency : null,
    is_completed: own && event.extendedProperties?.private?.aksuite_completed === 'true',
  }
}
export function importedEventId(userId: string, calendarId: string, googleId: string) {
  const hex = stateHash(JSON.stringify([userId, calendarId, googleId])).slice(0, 32).split('')
  hex[12] = '5'; hex[16] = '8'
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
