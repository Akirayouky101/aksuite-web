'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../hooks/useAuth'

function applicationKey(value: string) {
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(decoded, character => character.charCodeAt(0))
}

export default function WebPushSettings() {
  const { user } = useAuth()
  const [configured, setConfigured] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    const available = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(available)
    setEnabled(false)
    async function load() {
      const response = await fetch('/api/web-push/config')
      if (!response.ok) throw new Error('Configurazione notifiche non disponibile.')
      const config: { enabled: boolean; publicKey: string | null } = await response.json()
      if (mounted) { setConfigured(config.enabled); setPublicKey(config.publicKey || '') }
      if (!available || !user) return
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription) return
      const { data, error } = await supabase.from('web_push_subscriptions').select('id').eq('endpoint', subscription.endpoint).maybeSingle()
      if (error) throw error
      if (mounted) setEnabled(Boolean(data))
    }
    void load().catch(cause => { console.error('Web Push settings failed:', cause); if (mounted) setError('Impossibile leggere le impostazioni notifiche. Riprova.') })
    return () => { mounted = false }
  }, [user?.id])

  async function toggle() {
    if (!user) { setError('Accedi prima di attivare le notifiche.'); return }
    setBusy(true); setError('')
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (enabled) {
        if (subscription) {
          const { error } = await supabase.from('web_push_subscriptions').delete().eq('endpoint', subscription.endpoint)
          if (error) throw error
          const success = await subscription.unsubscribe()
          if (!success) throw new Error('Disattivazione notifiche non riuscita.')
        }
        setEnabled(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') throw new Error('Permesso notifiche negato. Abilitalo nelle impostazioni del browser.')
        if (subscription) {
          const { data, error } = await supabase.from('web_push_subscriptions').select('id').eq('endpoint', subscription.endpoint).maybeSingle()
          if (error) throw error
          if (!data) { await subscription.unsubscribe(); subscription = null }
        }
        const created = !subscription
        subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) })
        const value = subscription.toJSON()
        if (!value.keys?.p256dh || !value.keys.auth) throw new Error('Il browser non ha fornito le chiavi delle notifiche.')
        const { error } = await supabase.from('web_push_subscriptions').upsert({
          user_id: user.id, endpoint: subscription.endpoint, p256dh: value.keys.p256dh, auth: value.keys.auth,
        }, { onConflict: 'endpoint' })
        if (error) {
          if (created) await subscription.unsubscribe()
          throw error
        }
        setEnabled(true)
      }
    } catch (cause) { console.error('Web Push subscription failed:', cause); setError(cause instanceof Error ? cause.message : 'Operazione notifiche non riuscita.') }
    finally { setBusy(false) }
  }
  return <section className="my-4 rounded-xl border p-4">
    <h3 className="font-bold">Conferma eventi tramite notifica</h3>
    <p className="my-2 text-sm">Alla scadenza: Sì completa l’evento dopo l’accesso, No apre la scelta di una nuova data e ora. Nessuna modifica viene fatta senza il tuo accesso.</p>
    {!supported && <p className="text-sm text-ak-warning">Questo browser non supporta Web Push. Su iPhone/iPad le notifiche web richiedono l’app aggiunta alla schermata Home (iOS 16.4 o successivo).</p>}
    {!configured && <p className="text-sm text-ak-warning">Invio non ancora attivato sul server: occorre configurare le chiavi Web Push e il processo pianificato.</p>}
    <button type="button" disabled={busy || !supported || (!configured && !enabled)} onClick={() => void toggle()} className="mt-3 rounded-xl border p-3 text-sm font-bold">{busy ? 'Attendere...' : enabled ? 'Disattiva su questo browser' : 'Attiva su questo browser'}</button>
    {error && <p role="alert" className="mt-2 text-sm text-ak-danger">{error}</p>}
  </section>
}
