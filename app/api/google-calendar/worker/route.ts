import { NextResponse } from 'next/server'
import { serverClient, validCronAuthorization } from '@/lib/serverAuth'
import { googleConfigured } from '@/lib/googleCalendar'
import { CalendarBusyError, syncGoogleCalendar } from '@/lib/googleCalendarSync'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    if (!validCronAuthorization(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!googleConfigured()) return NextResponse.json({ error: 'OAuth Google non configurato.' }, { status: 503 })
    const client = serverClient()
    const { data, error } = await client.from('google_calendar_connections').select('user_id')
      .not('calendar_id', 'is', null).is('last_error', null).order('last_sync_at', { nullsFirst: true }).limit(1)
    if (error) throw error
    if (!data?.length) return NextResponse.json({ processed: 0 })
    return NextResponse.json({ processed: 1, ...await syncGoogleCalendar(client, data[0].user_id) })
  } catch (cause) {
    if (cause instanceof CalendarBusyError) return NextResponse.json({ error: cause.message }, { status: 409 })
    console.error('Google Calendar worker failed:', cause instanceof Error ? cause.message : 'Database error')
    return NextResponse.json({ error: 'Sincronizzazione pianificata non riuscita.' }, { status: 500 })
  }
}
