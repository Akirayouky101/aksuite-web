'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Calendar, ClipboardList, Clock, Plus, RefreshCw } from 'lucide-react'
import { DASHBOARD_LABELS, DashboardRow, DashboardSnapshot, loadDashboardSnapshot } from '@/lib/dashboard'
import styles from './MacShell.module.css'

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
  const chartMaximum = Math.max(4, ...(snapshot?.week.map(day => day.events + day.tasks + 1) || []))
  const renderPanel = (panel: typeof panels[number]) => <section key={panel.title} className={`${styles.glass} ${styles.panel}`}>
    <h2><panel.icon size={21} aria-hidden="true" />{panel.title}</h2>
    {loading ? <p role="status" className={styles.muted}>Caricamento...</p> : panel.rows && (panel.rows.length ? <ul>{panel.rows.map(row => <li key={`${row.kind}-${row.id}`}><button disabled={opening} onClick={() => void open(row)} className={styles.summaryRow}><strong>{row.title}</strong><span>{DASHBOARD_LABELS[row.kind]} · {row.all_day ? 'Tutto il giorno' : row.date ? new Date(row.date).toLocaleString('it-IT', { day: 'numeric', month: 'short', ...(row.kind === 'event' ? { hour: '2-digit', minute: '2-digit' } : {}) }) : 'Senza scadenza'}</span></button></li>)}</ul> : <p className={styles.muted}>{panel.empty}</p>)}
    <p className={styles.muted}>Al massimo 5 elementi, non il totale della sezione.</p>
    {panel.section && <button onClick={() => { if (panel.section) onNavigate(panel.section) }} className={styles.button}>Apri {panel.title === 'Agenda di oggi' ? 'calendario' : 'cose da fare'} →</button>}
  </section>
  return <section aria-label="Dashboard operativa" className={styles.dashboard}>
    <div className={`${styles.glass} ${styles.hero}`}>
      <div>
        <p className={styles.date}>{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>La giornata, sotto controllo.</h1>
        <p>Priorità, appuntamenti e scadenze: tutto al suo posto.</p>
        <div className={styles.quickActions}>{[['event', 'Evento'], ['todo', 'Attività'], ['note', 'Nota']].map(([kind, label]) => <button key={kind} onClick={() => onCreate(kind)}><Plus size={17} aria-hidden="true" />{label}</button>)}</div>
      </div>
      <button onClick={() => setReload(value => value + 1)} disabled={loading} aria-label="Aggiorna dashboard" className={styles.button}><RefreshCw className={loading ? 'animate-spin motion-reduce:animate-none' : ''} size={17} aria-hidden="true" />Aggiorna</button>
    </div>
    {error && <p role="alert" className={styles.notice}>{error}<button onClick={() => setReload(value => value + 1)} className="ml-3 underline">Riprova</button></p>}
    <div className={styles.metrics}>{panels.map((panel, index) => <div key={panel.title} className={`${styles.glass} ${styles.metric}`}>
      <panel.icon size={24} aria-hidden="true" />
      <div><strong>{loading ? '...' : panel.rows?.length ?? '—'}</strong><p>{['In evidenza oggi', 'Attività in vista', 'Scadenze in vista'][index]}</p></div>
    </div>)}</div>
    <div className={styles.chartLayout}>
      <section className={`${styles.glass} ${styles.panel}`} aria-labelledby="week-heading">
        <h2 id="week-heading"><BarChart3 size={21} aria-hidden="true" />Ritmo della settimana</h2>
        <p className={styles.muted}>Appuntamenti e attività con scadenza · prossimi 7 giorni</p>
        {loading ? <p role="status" className={styles.muted}>Caricamento grafico...</p> : snapshot && <>
          <div className={styles.chart} aria-hidden="true">{snapshot.week.map(day => <div key={day.date} className={styles.chartColumn}>
            <div className={styles.chartBars}>
              <span className={styles.eventBar} style={{ height: `${day.events / chartMaximum * 100}%` }} title={`${day.events} appuntamenti`} />
              <span className={styles.taskBar} style={{ height: `${day.tasks / chartMaximum * 100}%` }} title={`${day.tasks} attività`} />
            </div>
            <span>{new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short' })}</span>
          </div>)}</div>
          <p className={styles.chartLegend}><span>Appuntamenti</span><span>Attività</span></p>
          <div className="sr-only"><table><caption>Appuntamenti attivi e attività da fare con scadenza nei prossimi sette giorni</caption><thead><tr><th>Giorno</th><th>Appuntamenti</th><th>Attività</th></tr></thead><tbody>{snapshot.week.map(day => <tr key={day.date}><th>{new Date(day.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</th><td>{day.events}</td><td>{day.tasks}</td></tr>)}</tbody></table></div>
        </>}
      </section>
      {renderPanel(panels[2])}
    </div>
    <div className={styles.panels}>{panels.slice(0, 2).map(renderPanel)}</div>
    <p className={`${styles.muted} ${styles.footnote}`}>Le scadenze includono lavorazioni, richiami e promemoria dei pagamenti, anche arretrati. Per rate e anticipi apri Pagamenti dal menu.</p>
  </section>
}
