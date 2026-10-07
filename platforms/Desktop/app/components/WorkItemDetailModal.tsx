'use client'

import { CalendarClock, CheckCircle2, FileDown, ListChecks, Package, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { checklistProgress, materialsCoverage, WorkItem } from '../hooks/useWorkItems'
import { Event } from '../hooks/useEvents'
import EventDetailModal from './EventDetailModal'
import PhotoGallery from './PhotoGallery'

interface WorkItemDetailModalProps {
  item: WorkItem
  events: Event[]
  clientName: string
  onClose: () => void
  onEdit: () => void
  onOpenList: (kind: 'checklist' | 'materials') => void
  onScheduleFollowUp: (event: Event) => void
  onRescheduleEvent?: (event: Event) => void
}

const statusLabel = { planned: 'Da pianificare', in_progress: 'In corso', waiting: 'In attesa', completed: 'Completata' }
const priorityLabel = { low: 'Bassa', normal: 'Normale', high: 'Alta' }

export default function WorkItemDetailModal({ item, events, clientName, onClose, onEdit, onOpenList, onScheduleFollowUp, onRescheduleEvent }: WorkItemDetailModalProps) {
  const isTodo = item.kind === 'todo'
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [preparedPdf, setPreparedPdf] = useState<Blob | null>(null)
  const [interventionId, setInterventionId] = useState<string | null>(null)
  const progress = checklistProgress(item.checklist)
  const materials = checklistProgress(item.materials)
  const coverage = materialsCoverage(item.materials, item.checklist)
  const interventions = [...events].sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())
  const selectedIntervention = interventions.find(event => event.id === interventionId)

  useEffect(() => {
    let cancelled = false
    setPreparedPdf(null)
    setExportError('')
    if (isTodo) return
    import('./workItemPdf').then(({ createWorkItemPdf }) => createWorkItemPdf(item, clientName, interventions))
      .then(blob => { if (!cancelled) setPreparedPdf(blob) })
      .catch(() => { if (!cancelled) setExportError('Impossibile preparare il PDF.') })
    return () => { cancelled = true }
  }, [item, clientName, isTodo, events])

  const exportPdf = async () => {
    if (!preparedPdf) return
    setExporting(true)
    setExportError('')
    try {
      const file = new File([preparedPdf], `AKSuite-${item.title.replace(/[^a-z0-9-]/gi, '-').slice(0, 55)}.pdf`, { type: 'application/pdf' })
      const download = () => {
        const url = URL.createObjectURL(preparedPdf)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: item.title }) }
        catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; download() }
      } else download()
    } catch {
      setExportError('Impossibile creare o condividere il PDF.')
    } finally {
      setExporting(false)
    }
  }
  return <div className="ak-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-ak-inset/40 p-3 backdrop-blur-sm" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={`Riepilogo ${item.title}`} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-ak-panel p-5 shadow-2xl sm:p-6" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="ak-kicker">{isTodo ? 'Cosa da fare' : 'Riepilogo lavorazione'}</p><h2 className="mt-1 break-words text-xl font-black text-ak-text">{item.title}</h2><p className="mt-1 text-sm text-ak-muted">{clientName || 'Nessun cliente collegato'}</p></div>
        <button onClick={onClose} title="Chiudi" className="shrink-0 rounded-lg p-2 text-ak-muted hover:bg-ak-hover"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-lg bg-ak-success-bg px-2.5 py-1.5 text-ak-success">{isTodo && item.status === 'planned' ? 'Da fare' : statusLabel[item.status]}</span>
        <span className="rounded-lg bg-ak-inset px-2.5 py-1.5 text-ak-text">Priorità {priorityLabel[item.priority]}</span>
      </div>
      {item.description && <p className="mt-4 whitespace-pre-wrap text-sm text-ak-muted">{item.description}</p>}
      {(item.due_date || item.scheduled_at) && <div className="mt-4 space-y-2 text-sm text-ak-muted">
        {item.due_date && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-ak-success" />Scadenza: {new Date(`${item.due_date.slice(0, 10)}T12:00:00`).toLocaleDateString('it-IT')}</p>}
        {item.scheduled_at && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-ak-success" />Appuntamento: {new Date(item.scheduled_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</p>}
      </div>}
      {item.next_action && <p className="mt-4 text-sm text-ak-muted"><span className="font-bold text-ak-text">Prossima azione:</span> {item.next_action}</p>}
      {item.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-ak-muted"><span className="font-bold text-ak-text">Note:</span> {item.notes}</p>}

      <div className="mt-6 grid gap-3 border-t border-ak-line pt-5 sm:grid-cols-2">
        <button onClick={() => onOpenList('checklist')} className="rounded-lg border border-ak-line bg-ak-inset p-4 text-left transition-colors hover:border-ak-success">
          <span className="flex items-center gap-2 text-sm font-bold text-ak-text"><ListChecks className="h-4 w-4 text-ak-success" />Checklist</span>
          <span className="mt-2 block text-xs text-ak-muted">{progress.done} fatte · {progress.total - progress.done} da fare</span>
          <span className="mt-1 block text-lg font-black text-ak-success">{progress.percent}%</span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-ak-line"><span className="block h-full bg-ak-accent" style={{ width: `${progress.percent}%` }} /></span>
        </button>
        {!isTodo && <button onClick={() => onOpenList('materials')} className="rounded-lg border border-ak-line bg-ak-inset p-4 text-left transition-colors hover:border-ak-success">
          <span className="flex items-center gap-2 text-sm font-bold text-ak-text"><Package className="h-4 w-4 text-ak-success" />Materiali</span>
          <span className="mt-2 block text-xs text-ak-muted">{materials.done} utilizzati · {materials.total - materials.done} da utilizzare</span>
          <span className="mt-1 block text-lg font-black text-ak-success">{materials.total} totali</span>
          {(coverage.total > 0 || coverage.orphaned > 0) && <span className={`mt-2 flex items-center gap-1 text-xs font-bold ${coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches ? 'text-ak-success' : 'text-ak-orange'}`}>{coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches && <CheckCircle2 className="h-4 w-4" />}{coverage.matched}/{coverage.total} materiali installati{coverage.orphaned > 0 ? ` · ${coverage.orphaned} collegamenti da verificare` : ''}{coverage.unitMismatches > 0 ? ` · ${coverage.unitMismatches} con unità diversa` : ''}</span>}
        </button>}
      </div>
      {!isTodo && <section className="mt-6 border-t border-ak-line pt-5">
        <div className="flex items-center justify-between"><h3 className="font-black text-ak-text">Diagramma interventi</h3><span className="text-xs font-bold text-ak-muted">{interventions.length}</span></div>
        {interventions.length ? <ol className="mt-4 border-l-2 border-ak-line pl-4">
          {interventions.map(event => {
            const start = new Date(event.start_date)
            const elapsed = new Date(event.end_date || event.start_date).getTime() < Date.now()
            return <li key={event.id} className="relative pb-2 last:pb-0">
              <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-ak-line ${elapsed ? 'bg-ak-inset' : 'bg-ak-accent'}`} />
              <button onClick={() => setInterventionId(event.id)} className="w-full rounded-lg p-2 text-left hover:bg-ak-inset">
                <p className="text-xs font-bold text-ak-success">{Number.isNaN(start.getTime()) ? event.start_date : start.toLocaleString('it-IT', event.all_day ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })} · {elapsed ? 'Trascorso' : 'In programma'}</p>
                <p className="mt-1 break-words text-sm font-bold text-ak-text">{event.title}</p>
                {event.location && <p className="mt-0.5 break-words text-xs text-ak-muted">{event.location}</p>}
              </button>
            </li>
          })}
        </ol> : <p className="mt-3 text-sm text-ak-muted">Nessun intervento nel calendario per questa lavorazione.</p>}
      </section>}
      <PhotoGallery scope={{ workItemId: item.id }} />
      {exportError && <p role="alert" className="mt-4 text-sm text-ak-danger">{exportError}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {!isTodo && <button onClick={() => void exportPdf()} disabled={exporting || !preparedPdf} className="flex min-w-[160px] flex-1 items-center justify-center gap-2 rounded-lg bg-ak-accent px-3 py-3 text-sm font-bold text-white disabled:opacity-50"><FileDown className="h-4 w-4" />{preparedPdf ? 'Esporta e condividi PDF' : 'Preparazione PDF...'}</button>}
        <button onClick={onEdit} className="flex min-w-[160px] flex-1 items-center justify-center gap-2 rounded-lg bg-ak-accent px-3 py-3 text-sm font-bold text-white"><Pencil className="h-4 w-4" />{isTodo ? 'Modifica attività' : 'Modifica lavorazione'}</button>
      </div>
      {selectedIntervention &&       <EventDetailModal onReschedule={onRescheduleEvent} event={selectedIntervention} clientName={clientName} workItemName={item.title} onClose={() => setInterventionId(null)} onScheduleFollowUp={onScheduleFollowUp} />}
    </div>
  </div>
}