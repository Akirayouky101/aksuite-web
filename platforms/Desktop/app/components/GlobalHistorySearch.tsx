'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { historyDates } from '@/lib/lifecycle'
import type { Event } from '../hooks/useEvents'
import type { WorkItem } from '../hooks/useWorkItems'

type Result = { kind: 'event'; item: Event; completion_time: string; item_id: string }
  | { kind: 'todo'; item: WorkItem; completion_time: string; item_id: string }

export default function GlobalHistorySearch({ term, onOpen }: { term: string; onOpen: (kind: string, item: Event | WorkItem) => void }) {
  const [rows, setRows] = useState<Result[]>([])
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [criteria, setCriteria] = useState({ term: '', from: '', until: '' })
  const [busy, setBusy] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  async function search(more = false) {
    if (busy) return
    setBusy(true); setError('')
    try {
      const input = more ? criteria : { term: term.trim(), from, until }
      if (!input.term || input.term.length > 200) throw new Error('Inserisci un testo di ricerca tra 1 e 200 caratteri.')
      const dates = historyDates(input.from, input.until)
      const last = more ? rows[rows.length - 1] : null
      const { data, error } = await supabase.rpc('search_completed_history', {
        term: input.term, date_from: dates.start || null, date_until: dates.end || null,
        cursor_time: last?.completion_time || null, cursor_id: last?.item_id || null, cursor_kind: last?.kind || null,
      })
      if (error) throw error
      const page: Result[] = (data || []).slice(0, 5)
      setRows(current => more ? [...current, ...page] : page)
      setHasMore((data?.length || 0) > 5)
      setCriteria(input); setSearched(true)
    } catch (cause) { console.error('Global history search failed:', cause); setError(cause instanceof Error ? cause.message : 'Ricerca nello storico non riuscita.') }
    finally { setBusy(false) }
  }
  return <section className="border-t p-3">
    <h3 className="text-sm font-bold">Ricerca globale in eseguite e archiviate</h3>
    <p className="my-2 text-xs text-[#716a91]">Il database viene interrogato solo premendo Cerca; include titoli, descrizioni, note e checklist.</p>
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">Dal<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block rounded border p-2" /></label>
      <label className="text-xs">Al<input type="date" value={until} onChange={e => setUntil(e.target.value)} className="block rounded border p-2" /></label>
      <button disabled={busy} onClick={() => void search()} className="rounded border p-2 text-sm font-bold">Cerca nel database</button>
    </div>
    {error && <p role="alert" className="my-2 text-xs text-red-700">{error}</p>}
    {searched && !rows.length && <p className="my-2 text-sm">Nessun risultato nello storico.</p>}
    {rows.map(row => <button key={`${row.kind}-${row.item_id}`} onClick={() => onOpen(row.kind, row.item)} className="my-2 block w-full rounded-xl bg-[#fff8ed] p-3 text-left text-sm"><strong>{row.item.title}</strong><span className="block text-xs">{row.kind === 'event' ? 'Calendario' : 'Cose da fare'} · {row.item.archived_at ? 'Archiviata' : 'Eseguita'}</span></button>)}
    {hasMore && <button disabled={busy} onClick={() => void search(true)} className="rounded border p-2 text-sm">Carica altre 5</button>}
  </section>
}
