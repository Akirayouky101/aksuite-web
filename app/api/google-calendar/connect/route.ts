import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { authenticatedUser, UnauthorizedError } from '@/lib/serverAuth'
import { appUrl, googleConfigured, stateHash } from '@/lib/googleCalendar'

export async function POST(request: Request) {
  try {
    const { user, client } = await authenticatedUser(request)
    if (!googleConfigured()) return NextResponse.json({ error: 'OAuth Google non configurato sul server.' }, { status: 503 })
    const state = randomBytes(32).toString('base64url')
    const verifier = randomBytes(32).toString('base64url')
    const { error } = await client.from('google_calendar_oauth_states').insert({
      state_hash: stateHash(state), code_verifier: verifier, user_id: user.id, expires_at: new Date(Date.now() + 600000).toISOString(),
    })
    if (error) throw error
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '', redirect_uri: `${appUrl()}/api/google-calendar/callback`,
      response_type: 'code', access_type: 'offline', prompt: 'consent', state,
      code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      scope: 'openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    }).toString()
    const response = NextResponse.json({ url: url.href })
    response.cookies.set('aksuite-google-state', state, { httpOnly: true, secure: appUrl().startsWith('https:'), sameSite: 'lax', path: '/', maxAge: 600 })
    return response
  } catch (cause) {
    if (cause instanceof UnauthorizedError) return NextResponse.json({ error: cause.message }, { status: 401 })
    console.error('Google OAuth initialization failed:', cause instanceof Error ? cause.message : 'Database error')
    return NextResponse.json({ error: 'Impossibile avviare il collegamento Google.' }, { status: 500 })
  }
}
