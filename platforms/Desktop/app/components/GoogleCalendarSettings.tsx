'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { romeDateStart } from '@/lib/lifecycle'
import { useAuth } from '../hooks/useAuth'
import type { CalendarConflict, Resolutions } from '@/lib/googleCalendarSync'

type Settings = {
  configured: boolean; connected: boolean; email?: string; calendarId?: string | null;
  calendars?: { id: string; summary: string }[]; initialFrom?: string; lastSync?: string; lastError?: string
}
type Sync = { pulled: number; pushed: number; conflicts: CalendarConflict[]; more: boolean; message: string }
async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session) throw new Error('Accedi per configurare il calendario.')
  const response = await fetch(`/api/google-calendar/${path}`, {
    method, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Operazione Google non riuscita.')
  return data
}

export default function GoogleCalendarSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selected, setSelected] = useState('')
  const [from, setFrom] = useState(new Date().toLocaleDateString('sv-SE'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Sync | null>(null)
  const [resolutions, setResolutions] = useState<Resolutions>({})
  const generation = useRef(0)
  const busyRef = useRef(false)
  useEffect(() => {
    let mounted = true
    generation.current++
    setSettings(null); setResult(null); setError('')
    if (!user) return
    void api<Settings>('settings').then(data => {
      if (!mounted) return
      setSettings(data); setSelected(data.calendarId || '')
      if (data.initialFrom) setFrom(data.initialFrom.slice(0, 10))
    }).catch(cause => { console.error('Calendar settings load failed:', cause); if (mounted) setError(cause instanceof Error ? cause.message : 'Impossibile caricare le impostazioni.') })
    return () => { mounted = false; generation.current++ }
  }, [user?.id])
  async function run(action: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('')
    try { await action() }
    catch (cause) { console.error('Google Calendar operation failed:', cause); setError(cause instanceof Error ? cause.message : 'Operazione non riuscita.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  async function sync() {
    const ticket = generation.current
    const data = await api<Sync>('sync', 'POST', { resolutions })
    if (ticket !== generation.current) return
    setResult(data); setMessage(`${data.message} Ricevuti: ${data.pulled}, inviati: ${data.pushed}.`)
    setResolutions({})
    window.dispatchEvent(new window.Event('aksuite-events-changed'))
    setSettings(current => current ? { ...current, lastError: data.conflicts.length ? 'Conflitti da risolvere.' : undefined } : current)
  }
  return <section className="my-4 space-y-3 rounded-xl border p-4">
    <h3 className="font-bold">Collega calendario personale · Google Calendar</h3>
    <p className="text-sm">Sincronizzazione in entrambe le direzioni del calendario scelto: appuntamenti, modifiche ed eliminazioni. I conflitti richiedono una scelta, senza sovrascritture automatiche.</p>
    {!user && <p className="text-sm">Accedi per collegare il tuo calendario.</p>}
    {settings && !settings.configured && <div className="rounded-lg bg-ak-warning-bg p-3 text-sm text-ak-warning">
      Google Cloud/OAuth non è ancora configurato. Occorre attivare Calendar API, creare un client OAuth Web e impostare sul server client ID, secret e chiave di cifratura.
      <p className="mt-2">Redirect di produzione: <code className="break-all">https://aksuite.app/api/google-calendar/callback</code>. Non inserire le chiavi qui o nella chat.</p>
    </div>}
    {settings?.configured && !settings.connected && <button disabled={busy} onClick={() => void run(async () => { const data = await api<{ url: string }>('connect', 'POST'); window.location.assign(data.url) })} className="rounded-lg border px-3 py-2 font-bold">Collega account Google</button>}
    {settings?.connected && <>
      <p className="text-sm">Collegato: {settings.email}</p>
      <button disabled={busy} onClick={() => void run(async () => { const data = await api<{ url: string }>('connect', 'POST'); window.location.assign(data.url) })} className="rounded-lg border px-3 py-2 text-sm">Rinnova autorizzazione Google</button>
      <label className="block text-sm">Calendario con permesso di modifica<select disabled={Boolean(settings.calendarId) || busy} value={selected} onChange={event => setSelected(event.target.value)} className="mt-1 block w-full rounded-lg border p-2">
        <option value="">Scegli calendario</option>{settings.calendarId && <option value={settings.calendarId}>{settings.calendarId}</option>}{settings.calendars?.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>)}
      </select></label>
      {!settings.calendarId && <>
        <label className="block text-sm">Prima importazione: impegni Google dal<input type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-1 block rounded-lg border p-2" /></label>
        <p className="text-xs">Gli eventi precedenti non vengono importati al primo collegamento. Da AK Suite vengono inviati gli appuntamenti attivi di tua proprietà, non gli archivi, le note, le password o gli appuntamenti di altri utenti.</p>
        <button disabled={busy || !selected || !from} onClick={() => void run(async () => {
          if (!window.confirm('Attivare la sincronizzazione bidirezionale? Le future eliminazioni saranno replicate. La disconnessione conserverà i dati su entrambi i servizi.')) return
          await api('settings', 'PUT', { calendarId: selected, initialFrom: romeDateStart(from) })
          setSettings(current => current ? { ...current, calendarId: selected } : current)
          await sync()
        })} className="rounded-lg border px-3 py-2 font-bold">Salva calendario e avvia</button>
      </>}
      {settings.calendarId && <button disabled={busy || Boolean(result?.conflicts.length && result.conflicts.some(item => !resolutions[item.id]))} onClick={() => void run(sync)} className="rounded-lg border px-3 py-2 font-bold">{busy ? 'Sincronizzazione...' : result?.more ? 'Continua sincronizzazione' : 'Sincronizza ora'}</button>}
      <p className="text-xs">Importazione paginata sul server (10 eventi per lotto). L’invio automatico richiede il processo pianificato configurato sul server. Le ricorrenze Google restano serie: il completamento riguarda la serie, non una singola occorrenza.</p>
      {settings.lastSync && <p className="text-xs">Ultimo lotto: {new Date(settings.lastSync).toLocaleString('it-IT')}</p>}
      {settings.lastError && <p role="alert" className="text-sm text-ak-warning">{settings.lastError}</p>}
      {result?.conflicts.map(item => <div key={item.id} className="rounded-lg bg-ak-warning-bg p-3">
        <strong className="text-sm">{item.title}</strong><p className="text-xs">{item.reason}</p>
        <label className="mt-2 block text-sm">Versione da mantenere<select value={resolutions[item.id] || ''} onChange={event => {
          const value = event.target.value
          if (value === 'local' || value === 'google') setResolutions(current => ({ ...current, [item.id]: value }))
        }} className="ml-2 rounded border p-2"><option value="">Scegli...</option><option value="local">AK Suite (anche eliminazione)</option><option value="google">Google (anche eliminazione)</option></select></label>
      </div>)}
      <button disabled={busy} onClick={() => void run(async () => {
        if (!window.confirm('Disconnettere Google Calendar? Nessun appuntamento verrà eliminato.')) return
        const result = await api<{ warning: string | null }>('settings', 'DELETE')
        setSettings({ configured: true, connected: false }); setResult(null); setSelected('')
        setMessage(result.warning || 'Google disconnesso. Dati conservati.')
      })} className="ml-3 rounded-lg border px-3 py-2 text-sm text-ak-danger">Disconnetti</button>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
    {user && !settings && error && <button disabled={busy} onClick={() => void run(async () => { const data = await api<{ url: string }>('connect', 'POST'); window.location.assign(data.url) })} className="rounded-lg border px-3 py-2 text-sm">Riprova collegamento Google</button>}
  </section>
}
