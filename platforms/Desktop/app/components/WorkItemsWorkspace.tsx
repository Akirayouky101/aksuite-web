'use client'

import { ArrowLeft, Briefcase, CalendarClock, Check, CheckCircle2, Clock3, ListChecks, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Client } from '../hooks/useClients'
import { Event } from '../hooks/useEvents'
import { checklistProgress, materialsCoverage, WorkItem, WorkKind, WorkStatus } from '../hooks/useWorkItems'
import WorkItemDetailModal from './WorkItemDetailModal'
import WorkItemListModal from './WorkItemListModal'
import HistoryBrowser from './HistoryBrowser'

interface WorkItemsWorkspaceProps {
  workItems: WorkItem[]
  events: Event[]
  clients: Client[]
  loading: boolean
  errorMessage: string | null
  mode?: WorkKind
  clientScopeId?: string | null
  onBackToClients?: () => void
  onNew: () => void
  onEdit: (item: WorkItem) => void
  onUpdate: (id: string, updates: Partial<WorkItem>) => Promise<unknown>
  onDelete: (id: string) => Promise<void>
  onScheduleFollowUp: (event: Event) => void
  onRescheduleEvent?: (event: Event) => void
}

const statuses: { value: 'all' | WorkStatus; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'planned', label: 'Da pianificare' },
  { value: 'in_progress', label: 'In corso' },
  { value: 'waiting', label: 'In attesa' },
  { value: 'completed', label: 'Completate' },
]

const statusLabel: Record<WorkStatus, string> = {
  planned: 'Da pianificare',
  in_progress: 'In corso',
  waiting: 'In attesa',
  completed: 'Completata',
}

const priorityLabel = { low: 'Bassa', normal: 'Normale', high: 'Alta' }
const dateLabel = (value: string | null) => value
  ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Senza scadenza'

export default function WorkItemsWorkspace({ workItems, events, clients, loading, errorMessage, mode = 'work', clientScopeId, onBackToClients, onNew, onEdit, onUpdate, onDelete, onScheduleFollowUp, onRescheduleEvent }: WorkItemsWorkspaceProps) {
  const isTodo = mode === 'todo'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | WorkStatus>('all')
  const [summaryId, setSummaryId] = useState<string | null>(null)
  const [selectedList, setSelectedList] = useState<{ id: string; kind: 'checklist' | 'materials' } | null>(null)
  const [history, setHistory] = useState<'pending' | 'completed' | 'archived'>('pending')
  const [historyItem, setHistoryItem] = useState<WorkItem | null>(null)
  const [actionError, setActionError] = useState('')
  const summaryItem = workItems.find(item => item.id === summaryId)
  const selectedItem = workItems.find(item => item.id === selectedList?.id)
  const clientsById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients])
  const clientLabel = (clientId: string | null) => {
    const client = clientsById.get(clientId || '')
    if (!client) return ''
    const parent = clientsById.get(client.parent_client_id || '')
    const path = parent ? `${parent.name} › ${client.name}` : client.name
    const company = client.company?.trim()
    return company && company.localeCompare(client.name.trim(), 'it', { sensitivity: 'base' }) !== 0 ? `${path} · ${company}` : path
  }
  const scopedItems = workItems.filter(item => (item.kind || 'work') === mode && (!clientScopeId || item.client_id === clientScopeId)
    && (!isTodo || (item.status !== 'completed' && !item.archived_at)))
  const scopedClient = clientsById.get(clientScopeId || '')
  const counts = {
    all: scopedItems.length,
    planned: scopedItems.filter(item => item.status === 'planned').length,
    in_progress: scopedItems.filter(item => item.status === 'in_progress').length,
    waiting: scopedItems.filter(item => item.status === 'waiting').length,
    completed: scopedItems.filter(item => item.status === 'completed').length,
  }
  const filtered = scopedItems
    .filter(item => status === 'all' || item.status === status)
    .filter(item => `${item.title} ${item.description} ${item.next_action} ${item.notes} ${clientLabel(item.client_id)}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(a.due_date || a.scheduled_at || a.updated_at).getTime() - new Date(b.due_date || b.scheduled_at || b.updated_at).getTime())

  return (
    <section className="ak-workspace">
      <header className="ak-workspace-head">
        <div>
          {clientScopeId && <button onClick={onBackToClients} className="mb-2 flex items-center gap-1 text-sm font-bold text-[#257259] hover:underline"><ArrowLeft className="h-4 w-4" />Rubrica</button>}
          <p className="ak-kicker">Lavoro in movimento</p>
          <h2>{isTodo ? 'Cose da fare' : 'Lavorazioni'}{scopedClient ? ` · ${scopedClient.name}` : ''}</h2>
          <p>{scopedClient ? `${isTodo ? 'Attività' : 'Lavorazioni'} collegate a ${scopedClient.name}.` : isTodo ? 'Le attività personali e i prossimi passi.' : 'Un solo posto per sapere cosa fare, con chi e qual è il prossimo passo.'}</p>
        </div>
        <button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />{isTodo ? 'Nuova cosa da fare' : 'Nuova lavorazione'}</button>
      </header>
      {isTodo && <div className="flex gap-2 border-b pb-3">{(['pending', 'completed', 'archived'] as const).map(value => <button key={value} aria-pressed={history === value} onClick={() => { setHistory(value); setHistoryItem(null) }} className={`rounded-xl px-3 py-2 text-sm font-bold ${history === value ? 'bg-[#d9e8d9]' : 'bg-[#f8e8cf]'}`}>{value === 'pending' ? 'Da fare' : value === 'completed' ? 'Eseguite' : 'Archiviate'}</button>)}</div>}
      {isTodo && history !== 'pending' ?       <HistoryBrowser key={`${history}-${clientScopeId || 'all'}`} kind="todo" state={history} clientId={clientScopeId} onOpen={setHistoryItem} /> : <>

      <div className="ak-toolbar flex-wrap justify-between">
        <div className="ak-search min-w-[220px]">
          <Search className="h-4 w-4 shrink-0" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca lavoro o cliente" />
        </div>
        <span className="ak-count">{filtered.length} di {scopedItems.length} {isTodo ? 'cose da fare' : 'lavorazioni'}</span>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#ead8bf] pb-3">
        {statuses.filter(item => !isTodo || item.value === 'all').map(item => (
          <button
            key={item.value}
            onClick={() => setStatus(item.value)}
            aria-pressed={status === item.value}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${status === item.value ? 'bg-[#2d2754] text-white' : 'text-[#716a91] hover:bg-[#f5dfca]'}`}
          >
            {isTodo && item.value === 'planned' ? 'Da fare' : item.label} <span className="ml-1 opacity-70">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-[#f0c7b5] bg-[#fff0e9] p-3 text-sm font-semibold text-[#a83d35]">{errorMessage}</p>}
      {loading ? <div className="py-12 text-center text-sm text-[#716a91]">Caricamento lavorazioni...</div> : filtered.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(item => {
            const overdue = item.due_date && new Date(`${item.due_date}T23:59:59`).getTime() < Date.now() && item.status !== 'completed'
            const progress = checklistProgress(item.checklist)
            const materialsProgress = checklistProgress(item.materials)
            const coverage = materialsCoverage(item.materials, item.checklist)
            return (
              <article key={item.id} onClick={() => setSummaryId(item.id)} className="cursor-pointer rounded-[1.1rem] border border-[#ead8bf] bg-[#fff8ed] p-4 transition-colors hover:border-[#9aba9c]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9e8d9] text-[#257259]"><Briefcase className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black text-[#2d2754]"><button onClick={event => { event.stopPropagation(); setSummaryId(item.id) }} aria-label={`Apri riepilogo ${item.title}`} className="max-w-full truncate text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#257259]">{item.title}</button></h3>
                    <p className="mt-1 truncate text-sm text-[#716a91]">{item.client_id ? `A ${clientLabel(item.client_id)}` : 'Nessun cliente collegato'}</p>
                  </div>
                  <button onClick={event => { event.stopPropagation(); onEdit(item) }} title="Modifica" className="rounded-lg p-2 text-[#897e9d] hover:bg-[#f5dfca]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={event => { event.stopPropagation(); void onDelete(item.id) }} title="Elimina" className="rounded-lg p-2 text-[#897e9d] hover:bg-[#ffd8d2] hover:text-[#a83d35]"><Trash2 className="h-4 w-4" /></button>
                </div>

                {item.description && <p className="mt-3 line-clamp-2 text-sm text-[#514b70]">{item.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`ak-status ${item.status === 'completed' ? 'ak-status-completed' : item.status === 'in_progress' ? 'ak-status-in_corso' : item.status === 'waiting' ? 'ak-status-pending' : ''}`}>{isTodo && item.status === 'planned' ? 'Da fare' : statusLabel[item.status]}</span>
                  <span className={`ak-status ${item.priority === 'high' ? 'ak-status-cancelled' : 'ak-status-pending'}`}>Priorità {priorityLabel[item.priority]}</span>
                </div>

                <div className="mt-4 space-y-2 border-t border-[#ead8bf] pt-3 text-xs text-[#716a91]">
                  <div className="flex items-center gap-2">
                    {item.scheduled_at ? <CalendarClock className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    <span className={overdue ? 'font-bold text-[#b43c44]' : ''}>{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : dateLabel(item.due_date)}{overdue ? ' · Scaduta' : ''}</span>
                  </div>
                  <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{item.next_action || 'Aggiungi la prossima azione'}</span></p>
                </div>

                <div className="mt-4">
                  <button onClick={event => { event.stopPropagation(); setSelectedList({ id: item.id, kind: 'checklist' }) }} className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-[#257259] hover:text-[#1c5d49]">
                    <span className="flex items-center gap-1.5"><ListChecks className="h-4 w-4" />Checklist</span>
                    <span>{progress.percent}% · {progress.done}/{progress.total}</span>
                  </button>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ead8bf]" role="progressbar" aria-label={`Checklist ${item.title}`} aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-[#257259] transition-[width]" style={{ width: `${progress.percent}%` }} />
                  </div>
                  {!isTodo && <button onClick={event => { event.stopPropagation(); setSelectedList({ id: item.id, kind: 'materials' }) }} className="mt-3 flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-[#2d2754] hover:text-[#257259]">
                    <span className="flex items-center gap-1.5"><Package className="h-4 w-4" />Materiali</span>
                    <span>{materialsProgress.done}/{materialsProgress.total} utilizzati</span>
                  </button>}
                  {!isTodo && (coverage.total > 0 || coverage.orphaned > 0) && <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches ? 'text-[#257259]' : 'text-[#9a5b17]'}`}>{coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches && <CheckCircle2 className="h-4 w-4" />}{coverage.matched}/{coverage.total} materiali installati{coverage.orphaned > 0 ? ` · ${coverage.orphaned} da verificare` : ''}{coverage.unitMismatches > 0 ? ` · ${coverage.unitMismatches} con unità diversa` : ''}</p>}
                </div>

                <label onClick={event => event.stopPropagation()} className="mt-4 block text-[11px] font-bold text-[#716a91]">
                  AGGIORNA STATO
                  <select value={item.status} onClick={event => event.stopPropagation()} onChange={event => {
                    setActionError('')
                    void onUpdate(item.id, { status: event.target.value as WorkStatus }).catch(cause => {
                      console.error('Work status update failed:', cause)
                      setActionError('Impossibile salvare lo stato. Riprova.')
                    })
                  }} className="mt-1 w-full rounded-lg border border-[#dfcdb1] bg-[#f8e8cf] px-2.5 py-2 text-xs text-[#2d2754]">
                    {statuses.filter(option => option.value !== 'all' && (!isTodo || ['planned', 'completed'].includes(option.value))).map(option => <option key={option.value} value={option.value}>{isTodo && option.value === 'planned' ? 'Da fare' : option.label}</option>)}
                  </select>
                </label>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="ak-empty mt-4">
          <Briefcase className="h-8 w-8" />
          <h3>{query || status !== 'all' ? 'Nessuna lavorazione trovata' : 'Nessuna lavorazione'}</h3>
          <p>{query || status !== 'all' ? 'Prova a cambiare filtro o ricerca.' : 'Registra un lavoro e tieni sotto controllo il prossimo passo.'}</p>
          {!scopedItems.length && <button onClick={onNew} className="ak-primary-action mt-2"><Plus className="h-4 w-4" />{isTodo ? 'Nuova cosa da fare' : 'Nuova lavorazione'}</button>}
        </div>
      )}
      </>}
      {actionError && <p role="alert" className="mt-3 text-red-700">{actionError}</p>}
      {historyItem && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-label={historyItem.title} className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-xl bg-[#fff8ed] p-5">
        <h3 className="text-xl font-black">{historyItem.title}</h3><p className="mt-3 whitespace-pre-wrap">{historyItem.description}</p>
        <ul className="my-3">{historyItem.checklist.map(entry => <li key={entry.id}>{entry.done ? '✓' : '·'} {entry.text}</li>)}</ul>
        <button onClick={() => setHistoryItem(null)} className="mr-3 rounded-xl border p-3">Chiudi</button>
        <button className="ak-primary-action" onClick={async () => {
          try { await onUpdate(historyItem.id, { status: 'planned' }); setHistoryItem(null); setHistory('pending'); setActionError('') }
          catch (cause) { console.error('Restore todo failed:', cause); setActionError('Impossibile riportare l’attività da fare.') }
        }}>Riporta da fare</button>
      </div></div>}
      {summaryItem &&       <WorkItemDetailModal onRescheduleEvent={onRescheduleEvent} item={summaryItem} events={events.filter(event => event.work_item_id === summaryItem.id)} clientName={clientLabel(summaryItem.client_id)} onClose={() => setSummaryId(null)} onEdit={() => { setSummaryId(null); onEdit(summaryItem) }} onOpenList={kind => setSelectedList({ id: summaryItem.id, kind })} onScheduleFollowUp={onScheduleFollowUp} />}
      {selectedList && selectedItem && <WorkItemListModal workItemId={selectedItem.id} key={`${selectedList.id}-${selectedList.kind}`} kind={selectedList.kind} simple={isTodo} title={selectedItem.title} items={selectedItem[selectedList.kind]} materials={selectedItem.materials || []} checklist={selectedItem.checklist || []} onSave={items => onUpdate(selectedItem.id, { [selectedList.kind]: items })} onClose={() => setSelectedList(null)} />}
    </section>
  )
}