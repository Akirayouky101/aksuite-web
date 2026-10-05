import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/lib/serverAuth'
import { appUrl, encryptGoogleCredentials, googleConfigured, stateHash } from '@/lib/googleCalendar'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let destination: URL
  try { destination = new URL(appUrl()); } catch { return NextResponse.json({ error: 'OAuth non configurato.' }, { status: 503 }) }
  try {
    if (!googleConfigured()) throw new Error('OAuth not configured')
    const state = request.nextUrl.searchParams.get('state')
    const cookie = request.cookies.get('aksuite-google-state')?.value
    const code = request.nextUrl.searchParams.get('code')
    if (!state || !cookie || stateHash(state) !== stateHash(cookie)) throw new Error('Invalid OAuth state')
    const client = serverClient()
    const { data, error } = await client.from('google_calendar_oauth_states').delete()
      .eq('state_hash', stateHash(state)).gt('expires_at', new Date().toISOString()).select('user_id,code_verifier').single()
    if (error || !data) throw new Error('Expired or consumed OAuth state')
    if (!code || request.nextUrl.searchParams.has('error')) throw new Error('OAuth authorization declined')
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${appUrl()}/api/google-calendar/callback`, grant_type: 'authorization_code', code, code_verifier: data.code_verifier,
      }),
    })
    if (!response.ok) throw new Error(`OAuth token exchange failed (${response.status})`)
    const token: { access_token: string; refresh_token: string; expires_in: number } = await response.json()
    if (!token.access_token || !token.refresh_token || !Number.isFinite(token.expires_in)) throw new Error('Missing OAuth credentials')
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
    if (!profileResponse.ok) throw new Error(`Google profile lookup failed (${profileResponse.status})`)
    const profile: { sub: string; email: string } = await profileResponse.json()
    if (!profile.sub || !profile.email) throw new Error('Invalid Google profile')
    const { data: existing, error: existingError } = await client.from('google_calendar_connections')
      .select('google_subject,lease_until').eq('user_id', data.user_id).maybeSingle()
    if (existingError) throw existingError
    if (existing?.lease_until && new Date(existing.lease_until).getTime() > Date.now()) throw new Error('Calendar synchronization is running; retry linking later')
    if (existing && existing.google_subject !== profile.sub) throw new Error('Disconnect the previous Google account before linking a different account')
    const { error: saveError } = await client.from('google_calendar_connections').upsert({
      user_id: data.user_id, google_subject: profile.sub, google_email: profile.email,
      credentials: encryptGoogleCredentials({ access_token: token.access_token, refresh_token: token.refresh_token, expires_at: Date.now() + token.expires_in * 1000 }),
      last_error: null,
    }, { onConflict: 'user_id' })
    if (saveError) throw saveError
    destination.searchParams.set('google-calendar', 'connected')
  } catch (cause) {
    console.error('Google OAuth callback failed:', cause instanceof Error ? cause.message : 'Database error')
    destination.searchParams.set('google-calendar', 'error')
  }
  const response = NextResponse.redirect(destination)
  response.cookies.delete('aksuite-google-state')
  return response
}
