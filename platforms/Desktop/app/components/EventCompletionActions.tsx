'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Event } from '../hooks/useEvents'

export default function EventCompletionActions({ event, onDone, onReschedule, disabled = false, onBusyChange }: { event: Event; onDone: () => void; onReschedule?: () => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function complete() {
    if (busy || disabled) return
    setBusy(true); setError('')
    onBusyChange?.(true)
    try {
      const { error } = await supabase.from('events').update({ is_completed: !event.is_completed, updated_at: new Date().toISOString() }).eq('id', event.id).select('id').single()
      if (error) throw error
      window.dispatchEvent(new window.Event('aksuite-events-changed'))
      onDone()
    } catch (cause) {
      console.error('Event completion failed:', cause)
      setError('Impossibile aggiornare lo stato. Riprova.')
    } finally { setBusy(false); onBusyChange?.(false) }
  }
  return <div className="space-y-2">
    <p className="text-sm font-bold">{event.is_completed ? 'Evento eseguito' : 'L’evento è stato eseguito?'}</p>
    <div className="flex flex-wrap gap-2">
      <button type="button"       disabled={busy || disabled} onClick={() => void complete()} className="ak-primary-action">{busy ? 'Salvataggio...' : event.is_completed ? 'Riporta da fare' : 'Sì, completato'}</button>
      {!event.is_completed && onReschedule &&       <button type="button"       disabled={busy || disabled} onClick={onReschedule} className="rounded-xl border px-3 py-2 text-sm font-bold">No, scegli nuova data e ora</button>}
    </div>
    {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
  </div>
}
