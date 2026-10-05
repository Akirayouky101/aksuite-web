import { NextResponse } from 'next/server'
import { authenticatedUser, UnauthorizedError } from '@/lib/serverAuth'
import { CalendarBusyError, Resolutions, syncGoogleCalendar } from '@/lib/googleCalendarSync'
import { googleConfigured } from '@/lib/googleCalendar'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { user, client } = await authenticatedUser(request)
    if (!googleConfigured()) return NextResponse.json({ error: 'OAuth Google non configurato.' }, { status: 503 })
    const input: unknown = await request.json()
    const resolutions: Resolutions = {}
    if (input && typeof input === 'object' && 'resolutions' in input && input.resolutions && typeof input.resolutions === 'object') {
      const entries = Object.entries(input.resolutions)
      if (entries.length > 20 || entries.some(([id, value]) => !/^[a-zA-Z0-9_-]{1,1024}$/.test(id) || !['local', 'google'].includes(value))) {
        return NextResponse.json({ error: 'Scelte conflitti non valide.' }, { status: 400 })
      }
      for (const [id, value] of entries) if (value === 'local' || value === 'google') resolutions[id] = value
    }
    return NextResponse.json(await syncGoogleCalendar(client, user.id, resolutions))
  } catch (cause) {
    if (cause instanceof UnauthorizedError) return NextResponse.json({ error: cause.message }, { status: 401 })
    if (cause instanceof CalendarBusyError) return NextResponse.json({ error: cause.message }, { status: 409 })
    console.error('Google Calendar sync failed:', cause instanceof Error ? cause.message : 'Database error')
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Sincronizzazione non riuscita.' }, { status: 500 })
  }
}
