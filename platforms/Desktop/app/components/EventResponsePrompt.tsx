'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Event } from '../hooks/useEvents'
import { useAuth } from '../hooks/useAuth'
import EventCompletionActions from './EventCompletionActions'

export default function EventResponsePrompt({ onReschedule }: { onReschedule: (event: Event) => void }) {
  const { user, authLoading } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState('')
  const [completing, setCompleting] = useState(false)
  const autoCompleted = useRef<string | null>(null)
  const owner = useRef(user?.id)
  owner.current = user?.id
  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams(window.location.search)
    const id = params.get('event-response')
    setRequested(Boolean(id))
    setAction(params.get('event-action') || '')
    setEvent(null)
    if (!id || authLoading || !user) return
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) { setError('Collegamento evento non valido.'); return }
    void supabase.from('events').select('*').eq('id', id).or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`).maybeSingle().then(({ data, error }) => {
      if (!mounted) return
      if (error) { console.error('Notification event load failed:', error); setError('Impossibile leggere l’evento. Riprova.'); return }
      if (!data) { setError('Evento non disponibile o eliminato.'); return }
      setEvent(data)
    })
    return () => { mounted = false }
  }, [user?.id, authLoading])
  useEffect(() => {
    if (action !== 'complete' || !user || !event || event.is_completed || autoCompleted.current === event.id) return
    autoCompleted.current = event.id
    const userId = user.id
    setCompleting(true)
    void supabase.from('events').update({ is_completed: true, updated_at: new Date().toISOString() }).eq('id', event.id)
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`).select().single().then(({ data, error }) => {
        if (owner.current !== userId) return
        setCompleting(false)
        if (error) { console.error('Push completion failed:', error); setError('Completamento non riuscito. Usa il pulsante Sì per riprovare.'); return }
        setEvent(data)
        window.dispatchEvent(new window.Event('aksuite-events-changed'))
      })
  }, [action, event?.id, event?.is_completed, user?.id])
  function close() {
    if (user) {
      const url = new URL(window.location.href)
      url.searchParams.delete('event-response'); url.searchParams.delete('event-action')
      url.searchParams.set('web', '1')
      window.history.replaceState(null, '', url)
    }
    setRequested(false); setEvent(null); setError('')
  }
  if (!requested) return null
  return <div className="ak-modal-backdrop fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-label="Conferma evento" className="w-full max-w-lg space-y-4 rounded-xl bg-ak-panel p-5">
    <h2 className="text-xl font-bold">{event?.title || 'Conferma evento'}</h2>
    {!user && <p>Accedi ad AK Suite per confermare o riprogrammare questo evento. Chiudi questo messaggio e usa Accedi: l’evento verrà riaperto dopo l’accesso.</p>}
    {error && <p role="alert" className="text-ak-danger">{error}</p>}
    {user && !error && !event && <p role="status">Caricamento...</p>}
    {event && !completing && <><p className="text-sm">{new Date(event.start_date).toLocaleString('it-IT')}</p>
      {event.is_completed ? <p>Questo evento è già stato completato.</p> :
        action === 'reschedule' ? <button className="ak-primary-action" onClick={() => { onReschedule(event); close() }}>Scegli nuova data e ora</button> :
        <EventCompletionActions event={event} onDone={close} onReschedule={() => { onReschedule(event); close() }} />}
    </>}
    {completing && <p role="status">Completamento in corso...</p>}
    <button onClick={close} className="rounded-lg border px-3 py-2">Chiudi</button>
  </div></div>
}
