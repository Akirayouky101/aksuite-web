import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const enabled = Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY && process.env.WEB_PUSH_SUBJECT && process.env.CRON_SECRET)
  return NextResponse.json({ enabled, publicKey: enabled ? process.env.WEB_PUSH_PUBLIC_KEY : null }, { headers: { 'Cache-Control': 'no-store' } })
}
