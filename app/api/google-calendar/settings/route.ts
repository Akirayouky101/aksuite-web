import { NextResponse } from 'next/server'
import { authenticatedUser, UnauthorizedError } from '@/lib/serverAuth'
import { CalendarConnection, decryptGoogleCredentials, googleAccessToken, googleConfigured, googleRequest } from '@/lib/googleCalendar'
import { CalendarBusyError, withGoogleLease } from '@/lib/googleCalendarSync'
export const dynamic = 'force-dynamic'

function failure(cause: unknown) {
  if (cause instanceof UnauthorizedError) return NextResponse.json({ error: cause.message }, { status: 401 })
  if (cause instanceof CalendarBusyError) return NextResponse.json({ error: cause.message }, { status: 409 })
  console.error('Google Calendar settings failed:', cause instanceof Error ? cause.message : 'Database error')
  return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Impostazioni Google non disponibili.' }, { status: 500 })
}
export async function GET(request: Request) {
  try {
    const { user, client } = await authenticatedUser(request)
    if (!googleConfigured()) return NextResponse.json({ configured: false, connected: false })
    const { data, error } = await client.from('google_calendar_connections').select('*').eq('user_id', user.id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ configured: true, connected: false })
    const connection: CalendarConnection = data
    if (connection.calendar_id) return NextResponse.json({
      configured: true, connected: true, email: connection.google_email, calendarId: connection.calendar_id,
      calendars: [], initialFrom: connection.initial_from, lastSync: connection.last_sync_at, lastError: connection.last_error,
    }, { headers: { 'Cache-Control': 'no-store' } })
    const access = await googleAccessToken(client, connection)
    const calendars: { id: string; summary: string; accessRole: string }[] = []
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams({ maxResults: '100', minAccessRole: 'writer' })
      if (pageToken) params.set('pageToken', pageToken)
      const page = await googleRequest<{ items?: typeof calendars; nextPageToken?: string }>(access, `users/me/calendarList?${params}`)
      calendars.push(...(page.items || [])); pageToken = page.nextPageToken
      if (calendars.length > 1000) throw new Error('Troppi calendari: riduci i calendari visibili prima di collegarti.')
    } while (pageToken)
    return NextResponse.json({
      configured: true, connected: true, email: connection.google_email, calendarId: connection.calendar_id,
      calendars, initialFrom: connection.initial_from, lastSync: connection.last_sync_at, lastError: connection.last_error,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (cause) { return failure(cause) }
}
export async function PUT(request: Request) {
  try {
    const { user, client } = await authenticatedUser(request)
    const input: unknown = await request.json()
    if (!input || typeof input !== 'object' || !('calendarId' in input) || typeof input.calendarId !== 'string' ||
      !('initialFrom' in input) || typeof input.initialFrom !== 'string' || !Number.isFinite(new Date(input.initialFrom).getTime())) {
      return NextResponse.json({ error: 'Calendario o data iniziale non validi.' }, { status: 400 })
    }
    const calendarId = input.calendarId
    const initialFrom = input.initialFrom
    return await withGoogleLease(client, user.id, async lease => {
    const { data, error } = await client.from('google_calendar_connections').select('*').eq('user_id', user.id).single()
    if (error) throw error
    if (data.calendar_id && data.calendar_id !== calendarId) return NextResponse.json({ error: 'Disconnetti prima di scegliere un calendario diverso. I dati esistenti saranno conservati.' }, { status: 409 })
    const access = await googleAccessToken(client, data)
    const selected = await googleRequest<{ id: string; accessRole: string }>(access, `users/me/calendarList/${    encodeURIComponent(calendarId)}`)
    if (!['writer', 'owner'].includes(selected.accessRole)) return NextResponse.json({ error: 'Questo calendario non consente modifiche.' }, { status: 403 })
    const { error: updateError } = await client.rpc('configure_google_calendar', {
      owner_id: user.id, chosen_calendar: selected.id, from_date: new Date(initialFrom).toISOString(), lease,
    })
    if (updateError) throw updateError
    return NextResponse.json({ saved: true })
    })
  } catch (cause) { return failure(cause) }
}
export async function DELETE(request: Request) {
  try {
    const { user, client } = await authenticatedUser(request)
    return await withGoogleLease(client, user.id, async () => {
    const { data, error } = await client.from('google_calendar_connections').select('credentials').eq('user_id', user.id).single()
    if (error) throw error
    let warning: string | null = null
    if (data) {
      try {
        const token = decryptGoogleCredentials(data.credentials)
        const response = await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', body: new URLSearchParams({ token: token.refresh_token }), signal: AbortSignal.timeout(10000) })
        if (!response.ok) warning = 'Connessione rimossa da AK Suite, ma Google non ha confermato la revoca. Revocala anche dal tuo account Google.'
      } catch (cause) {
        console.error('Google revocation failed:', cause instanceof Error ? cause.message : 'Network error')
        warning = 'Connessione rimossa da AK Suite, ma non è stato possibile revocare le credenziali su Google. Revocala anche dal tuo account Google.'
      }
    }
    const { error: deleteError } = await client.from('google_calendar_connections').delete().eq('user_id', user.id)
    if (deleteError) throw deleteError
    return NextResponse.json({ disconnected: true, warning })
    })
  } catch (cause) { return failure(cause) }
}
