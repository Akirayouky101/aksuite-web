'use client'

import { useEffect, useState } from 'react'
import { Calendar, ClipboardList, Clock, Plus, RefreshCw } from 'lucide-react'
import { DASHBOARD_LABELS, DashboardRow, DashboardSnapshot, loadDashboardSnapshot } from '@/lib/dashboard'

export default function OperationalDashboard({ onNavigate, onCreate, onOpen, revision, enabled = true }: {
  onNavigate: (section: string) => void
  onCreate: (kind: string) => void
  onOpen: (row: DashboardRow) => Promise<void>
  revision: string
  enabled?: boolean
}) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [opening, setOpening] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let active = true
    setLoading(true); setError(''); setSnapshot(null)
    loadDashboardSnapshot().then(result => { if (active) setSnapshot(result) }).catch(cause => {
      console.error('Dashboard loading failed:', cause)
      if (active) setError('Impossibile aggiornare il riepilogo. Riprova.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload, revision, enabled])

  async function open(row: DashboardRow) {
    setOpening(true); setError('')
    try { await onOpen(row) }
    catch (cause) { console.error('Dashboard entry loading failed:', cause); setError('Impossibile aprire questo elemento. Aggiorna il riepilogo e riprova.') }
    finally { setOpening(false) }
  }
  const panels = [
    { title: 'Agenda di oggi', icon: Calendar, rows: snapshot?.agenda, section: 'calendar', empty: 'Nessun appuntamento oggi.' },
    { title: 'Cose da fare', icon: ClipboardList, rows: snapshot?.todos, section: 'todos', empty: 'Nessuna attività da fare.' },
    { title: 'Scadenze e richiami', icon: Clock, rows: snapshot?.deadlines, section: null, empty: 'Nessuna scadenza o richiamo nei prossimi 14 giorni.' },
  ]
  return <section aria-label="Dashboard operativa" className="space-y-5">
    <div className="ak-hero rounded-[1.75rem] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm capitalize text-[#716a91]">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Il tuo spazio operativo</h1><p className="mt-3 text-[#514b70]">Oggi, le attività aperte e le prossime scadenze. Tutte le sezioni sono nel menu.</p></div>
        <button onClick={() => setReload(value => value + 1)} disabled={loading} aria-label="Aggiorna dashboard" className="ak-logout"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Aggiorna</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{[['event', 'Evento'], ['todo', 'Attività'], ['note', 'Nota']].map(([kind, label]) => <button key={kind} onClick={() => onCreate(kind)} className="inline-flex items-center gap-2 rounded-xl bg-[#2d2754] px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />{label}</button>)}</div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}<button onClick={() => setReload(value => value + 1)} className="ml-3 underline">Riprova</button></p>}
    <div className="grid items-start gap-4 xl:grid-cols-3">{panels.map(panel => <section key={panel.title} className="ak-bento p-5">
      <div className="mb-4 flex items-center gap-2"><panel.icon className="h-5 w-5 text-[#e45f4e]" /><h2 className="font-black">{panel.title}</h2></div>
      {loading ? <p role="status" className="py-4 text-sm text-[#716a91]">Caricamento...</p> : panel.rows && (panel.rows.length ? <ul className="space-y-2">{panel.rows.map(row => <li key={`${row.kind}-${row.id}`}><button disabled={opening} onClick={() => void open(row)} className="w-full rounded-xl bg-white/60 p-3 text-left hover:bg-white"><strong className="block truncate text-sm">{row.title}</strong><span className="text-xs text-[#716a91]">{DASHBOARD_LABELS[row.kind]} · {row.all_day ? 'Tutto il giorno' : row.date ? new Date(row.date).toLocaleString('it-IT', { day: 'numeric', month: 'short', ...(row.kind === 'event' ? { hour: '2-digit', minute: '2-digit' } : {}) }) : 'Senza scadenza'}</span></button></li>)}</ul> : <p className="py-4 text-sm text-[#716a91]">{panel.empty}</p>)}
      <p className="mt-4 text-xs text-[#716a91]">Al massimo 5 elementi, non il totale della sezione.</p>
      {panel.section && <button onClick={() => { if (panel.section) onNavigate(panel.section) }} className="mt-3 text-sm font-bold text-[#4b3ba5]">Apri {panel.title === 'Agenda di oggi' ? 'calendario' : 'cose da fare'} →</button>}
    </section>)}</div>
    <p className="text-xs text-[#716a91]">Le scadenze includono lavorazioni, richiami e promemoria dei pagamenti, anche arretrati. Per rate e anticipi apri Pagamenti dal menu.</p>
  </section>
}
