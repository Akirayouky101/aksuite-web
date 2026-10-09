'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HISTORY_PAGE_SIZE, historyDates, HistoryState } from '@/lib/lifecycle'
import DateTimePicker from './DateTimePicker'
import type { Event } from '../hooks/useEvents'
import type { WorkItem } from '../hooks/useWorkItems'
import { useAuth } from '../hooks/useAuth'

type Props = ({ kind: 'event'; state: HistoryState; onOpen: (item: Event) => void; clientId?: string | null }
  | { kind: 'todo'; state: HistoryState; onOpen: (item: WorkItem) => void; clientId?: string | null })
  & { changedItem?: { id: string } | null }

export default function HistoryBrowser(props: Props) {
  const { user } = useAuth()
  const owner = useRef(user?.id)
  owner.current = user?.id
  const [rows, setRows] = useState<(Event | WorkItem)[]>([])
  const [text, setText] = useState('')
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const criteria = useRef({ text: '', from: '', until: '' })
  const cursor = useRef<{ time: string; id: string } | null>(null)
  const fetching = useRef(false)
  const loadedOwner = useRef<string | null>(null)
  const invalidated = useRef(new Set<string>())
  useEffect(() => { setRows([]); setSearched(false); setHasMore(false); cursor.current = null; invalidated.current.clear() }, [user?.id])
  useEffect(() => {
    const id = props.changedItem?.id
    if (!id) return
    invalidated.current.add(id)
    setRows(current => current.filter(item => item.id !== id))
  }, [props.changedItem])

  async function search(more = false) {
    if (fetching.current) return
    fetching.current = true
    setBusy(true)
    setError(null)
    const userId = user?.id
    try {
      if (!userId) throw new Error('Accedi per consultare lo storico.')
      if (!more) invalidated.current.clear()
      const input = more ? criteria.current : { text: text.trim(), from, until }
      let dateBounds: { start: string | undefined; end: string | undefined }
      if (props.kind === 'event') {
        const start = input.from ? new Date(input.from) : null
        const end = input.until ? new Date(input.until) : null
        if ((start && !Number.isFinite(start.getTime())) || (end && !Number.isFinite(end.getTime()))) {
          throw new Error('Date di ricerca non valide.')
        }
        if (start && end && start > end) throw new Error('La data iniziale deve precedere quella finale.')
        dateBounds = { start: start?.toISOString(), end: end?.toISOString() }
      } else {
        dateBounds = historyDates(input.from, input.until)
      }
      let query = supabase.from(props.kind === 'event' ? 'events' : 'work_items').select('*')
      query = props.kind === 'event' ? query.eq('is_completed', true) : query.eq('kind', 'todo').eq('status', 'completed')
      query = props.state === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
      if (props.clientId) query = query.eq('client_id', props.clientId)
      if (input.text) query = query.ilike('title', `%${input.text.replace(/[%_\\]/g, '\\$&')}%`)
      if (dateBounds.start) query = query.gte('completed_at', dateBounds.start)
      if (dateBounds.end) query = query.lte('completed_at', dateBounds.end)
      const last = more ? cursor.current : null
      if (last) query = query.or(`completed_at.lt.${last.time},and(completed_at.eq.${last.time},id.lt.${last.id})`)
      const { data, error: queryError } = await query.order('completed_at', { ascending: false })
        .order('id', { ascending: false }).limit(HISTORY_PAGE_SIZE + 1)
      if (queryError) throw queryError
      if (owner.current !== userId) return
      const page = (data ?? []).filter(item => !invalidated.current.has(item.id)).slice(0, HISTORY_PAGE_SIZE)
      loadedOwner.current = userId
      setRows(current => more ? [...current, ...page] : page)
      criteria.current = input
      const tail = page[page.length - 1]
      cursor.current = tail ? { time: tail.completed_at, id: tail.id } : null
      setHasMore((data?.length ?? 0) > HISTORY_PAGE_SIZE)
      setSearched(true)
    } catch (cause) {
      console.error('History search failed:', cause)
      setError(cause instanceof Error ? cause.message : 'Impossibile caricare lo storico.')
    } finally { setBusy(false); fetching.current = false }
  }

  return <section className="mt-4 space-y-4">
    <p className="text-sm text-ak-muted">Lo storico resta nel database. Cerca o carica 5 elementi alla volta, solo quando lo richiedi. Dopo 7 giorni le eseguite passano automaticamente in archivio.</p>
    <form onSubmit={event => { event.preventDefault(); void search() }} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Titolo<input value={text} onChange={event => setText(event.target.value)} className="mt-1 block rounded-lg border p-2" /></label>
      <label className="text-sm">{props.kind === 'event' ? 'Completato dal' : 'Eseguite dal'}
        {props.kind === 'event'
          ? <DateTimePicker mode="datetime" value={from} onChange={setFrom} placeholder="Data e ora iniziale" />
          : <input type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-1 block rounded-lg border p-2" />}
      </label>
      <label className="text-sm">Al
        {props.kind === 'event'
          ? <DateTimePicker mode="datetime" value={until} onChange={setUntil} placeholder="Data e ora finale" />
          : <input type="date" value={until} onChange={event => setUntil(event.target.value)} className="mt-1 block rounded-lg border p-2" />}
      </label>
      <button disabled={busy} className="ak-primary-action">{busy ? 'Caricamento...' : 'Cerca / carica 5'}</button>
    </form>
    {error && <p role="alert" className="text-ak-danger">{error}</p>}
    {(loadedOwner.current === user?.id ? rows : []).map(item => <button key={item.id} onClick={() => {
      if (props.kind === 'event') props.onOpen(item as Event)
      else props.onOpen(item as WorkItem)
    }} className="block w-full rounded-xl border border-ak-line bg-ak-panel p-4 text-left">
      <strong>{item.title}</strong><span className="mt-1 block text-xs text-ak-muted">Eseguita: {item.completed_at ? new Date(item.completed_at).toLocaleString('it-IT') : 'data non disponibile'}</span>
    </button>)}
    {searched && !rows.length && <p>Nessun risultato.</p>}
    {hasMore && <button disabled={busy} onClick={() => void search(true)} className="ak-primary-action">{busy ? 'Caricamento...' : 'Carica altre 5'}</button>}
  </section>
}
