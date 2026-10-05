import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { serverClient, validCronAuthorization } from '@/lib/serverAuth'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Job = { queue_id: string; event_id: string; user_id: string; lease_id: string; title: string }
type Subscription = { id: string; endpoint: string; p256dh: string; auth: string }

export async function POST(request: Request) {
  try {
    if (!validCronAuthorization(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { WEB_PUSH_SUBJECT: subject, WEB_PUSH_PUBLIC_KEY: publicKey, WEB_PUSH_PRIVATE_KEY: privateKey } = process.env
    if (!subject || !publicKey || !privateKey) return NextResponse.json({ error: 'Web Push non configurato.' }, { status: 503 })
    const client = serverClient()
    const { data, error } = await client.rpc('claim_event_confirmations')
    if (error) throw error
    const jobs: Job[] = data || []
    let delivered = 0; let failed = 0; let skipped = 0
    for (const job of jobs) {
      try {
        const { data: event, error: eventError } = await client.from('events').select('is_completed').eq('id', job.event_id).maybeSingle()
        if (eventError) throw eventError
        if (!event || event.is_completed) continue
        const { data, error } = await client.from('web_push_subscriptions').select('id,endpoint,p256dh,auth').eq('user_id', job.user_id)
        if (error) throw error
        const subscriptions: Subscription[] = data || []
        const results = await Promise.allSettled(subscriptions.map(async subscription => {
          // Only known browser push services are allowed as server-side destinations.
          const url = new URL(subscription.endpoint)
          if (url.protocol !== 'https:' || url.port || url.username || url.password || !(
            url.hostname === 'fcm.googleapis.com' ||
            url.hostname === 'updates.push.services.mozilla.com' ||
            url.hostname === 'web.push.apple.com' ||
            url.hostname.endsWith('.notify.windows.com')
          )) throw new Error('Servizio Web Push non supportato.')
          try {
            await webpush.sendNotification({
              endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            }, JSON.stringify({
              title: 'Evento eseguito?', body: `Hai eseguito “${job.title}”?`,
              url: `/?event-response=${job.event_id}`, tag: `event-confirmation-${job.event_id}`,
              actions: [{ action: 'complete', title: 'Sì, completato' }, { action: 'reschedule', title: 'No, riprogramma' }],
            }), { TTL: 86400, timeout: 10000, vapidDetails: { subject, publicKey, privateKey } })
          } catch (cause) {
            if (cause instanceof webpush.WebPushError && [404, 410].includes(cause.statusCode)) {
              const { error } = await client.from('web_push_subscriptions').delete().eq('id', subscription.id)
              if (error) throw error
              return
            }
            throw cause
          }
        }))
        const failures = results.filter(result => result.status === 'rejected')
        if (failures.length) throw new Error(`Invio non riuscito per ${failures.length} dispositivi; verrà ritentato.`)
        const { error: updateError } = await client.from('event_confirmation_queue')
          .update({ sent_at: new Date().toISOString(), last_error: null }).eq('id', job.queue_id).eq('lease_id', job.lease_id)
        if (updateError) throw updateError
        if (subscriptions.length) delivered++
        else skipped++
      } catch (cause) {
        failed++
        console.error('Event Web Push failed:', cause instanceof Error ? cause.message : 'Database error')
        const { error } = await client.from('event_confirmation_queue').update({
          last_error: cause instanceof Error ? cause.message : 'Invio non riuscito',
        }).eq('id', job.queue_id).eq('lease_id', job.lease_id)
        if (error) throw error
      }
    }
    return NextResponse.json({ processed: jobs.length, delivered, skipped, failed }, { status: failed ? 502 : 200 })
  } catch (cause) {
    console.error('Web Push worker failed:', cause instanceof Error ? cause.message : 'Database error')
    return NextResponse.json({ error: 'Invio Web Push non riuscito.' }, { status: 500 })
  }
}
