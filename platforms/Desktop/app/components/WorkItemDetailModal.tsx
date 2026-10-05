'use client'

import { CalendarClock, CheckCircle2, FileDown, ListChecks, Package, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { checklistProgress, materialsCoverage, WorkItem } from '../hooks/useWorkItems'
import { Event } from '../hooks/useEvents'
import EventDetailModal from './EventDetailModal'

interface WorkItemDetailModalProps {
  item: WorkItem
  events: Event[]
  clientName: string
  onClose: () => void
  onEdit: () => void
  onOpenList: (kind: 'checklist' | 'materials') => void
  onScheduleFollowUp: (event: Event) => void
}

const statusLabel = { planned: 'Da pianificare', in_progress: 'In corso', waiting: 'In attesa', completed: 'Completata' }
const priorityLabel = { low: 'Bassa', normal: 'Normale', high: 'Alta' }

export default function WorkItemDetailModal({ item, events, clientName, onClose, onEdit, onOpenList, onScheduleFollowUp }: WorkItemDetailModalProps) {
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
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={`Riepilogo ${item.title}`} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-[#fff8ed] p-5 shadow-2xl sm:p-6" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="ak-kicker">{isTodo ? 'Cosa da fare' : 'Riepilogo lavorazione'}</p><h2 className="mt-1 break-words text-xl font-black text-[#2d2754]">{item.title}</h2><p className="mt-1 text-sm text-[#716a91]">{clientName || 'Nessun cliente collegato'}</p></div>
        <button onClick={onClose} title="Chiudi" className="shrink-0 rounded-lg p-2 text-[#716a91] hover:bg-[#f5dfca]"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-lg bg-[#d9e8d9] px-2.5 py-1.5 text-[#257259]">{isTodo && item.status === 'planned' ? 'Da fare' : statusLabel[item.status]}</span>
        <span className="rounded-lg bg-[#f8e8cf] px-2.5 py-1.5 text-[#2d2754]">Priorità {priorityLabel[item.priority]}</span>
      </div>
      {item.description && <p className="mt-4 whitespace-pre-wrap text-sm text-[#514b70]">{item.description}</p>}
      {(item.due_date || item.scheduled_at) && <div className="mt-4 space-y-2 text-sm text-[#514b70]">
        {item.due_date && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#257259]" />Scadenza: {new Date(`${item.due_date.slice(0, 10)}T12:00:00`).toLocaleDateString('it-IT')}</p>}
        {item.scheduled_at && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#257259]" />Appuntamento: {new Date(item.scheduled_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</p>}
      </div>}
      {item.next_action && <p className="mt-4 text-sm text-[#514b70]"><span className="font-bold text-[#2d2754]">Prossima azione:</span> {item.next_action}</p>}
      {item.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-[#514b70]"><span className="font-bold text-[#2d2754]">Note:</span> {item.notes}</p>}

      <div className="mt-6 grid gap-3 border-t border-[#ead8bf] pt-5 sm:grid-cols-2">
        <button onClick={() => onOpenList('checklist')} className="rounded-lg border border-[#dfcdb1] bg-[#f8e8cf] p-4 text-left transition-colors hover:border-[#257259]">
          <span className="flex items-center gap-2 text-sm font-bold text-[#2d2754]"><ListChecks className="h-4 w-4 text-[#257259]" />Checklist</span>
          <span className="mt-2 block text-xs text-[#716a91]">{progress.done} fatte · {progress.total - progress.done} da fare</span>
          <span className="mt-1 block text-lg font-black text-[#257259]">{progress.percent}%</span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#dfcdb1]"><span className="block h-full bg-[#257259]" style={{ width: `${progress.percent}%` }} /></span>
        </button>
        {!isTodo && <button onClick={() => onOpenList('materials')} className="rounded-lg border border-[#dfcdb1] bg-[#f8e8cf] p-4 text-left transition-colors hover:border-[#257259]">
          <span className="flex items-center gap-2 text-sm font-bold text-[#2d2754]"><Package className="h-4 w-4 text-[#257259]" />Materiali</span>
          <span className="mt-2 block text-xs text-[#716a91]">{materials.done} utilizzati · {materials.total - materials.done} da utilizzare</span>
          <span className="mt-1 block text-lg font-black text-[#257259]">{materials.total} totali</span>
          {(coverage.total > 0 || coverage.orphaned > 0) && <span className={`mt-2 flex items-center gap-1 text-xs font-bold ${coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches ? 'text-[#257259]' : 'text-[#9a5b17]'}`}>{coverage.total > 0 && coverage.matched === coverage.total && !coverage.orphaned && !coverage.unitMismatches && <CheckCircle2 className="h-4 w-4" />}{coverage.matched}/{coverage.total} materiali installati{coverage.orphaned > 0 ? ` · ${coverage.orphaned} collegamenti da verificare` : ''}{coverage.unitMismatches > 0 ? ` · ${coverage.unitMismatches} con unità diversa` : ''}</span>}
        </button>}
      </div>
      {!isTodo && <section className="mt-6 border-t border-[#ead8bf] pt-5">
        <div className="flex items-center justify-between"><h3 className="font-black text-[#2d2754]">Diagramma interventi</h3><span className="text-xs font-bold text-[#716a91]">{interventions.length}</span></div>
        {interventions.length ? <ol className="mt-4 border-l-2 border-[#d9e8d9] pl-4">
          {interventions.map(event => {
            const start = new Date(event.start_date)
            const elapsed = new Date(event.end_date || event.start_date).getTime() < Date.now()
            return <li key={event.id} className="relative pb-2 last:pb-0">
              <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white ${elapsed ? 'bg-[#716a91]' : 'bg-[#257259]'}`} />
              <button onClick={() => setInterventionId(event.id)} className="w-full rounded-lg p-2 text-left hover:bg-[#f8e8cf]">
                <p className="text-xs font-bold text-[#257259]">{Number.isNaN(start.getTime()) ? event.start_date : start.toLocaleString('it-IT', event.all_day ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })} · {elapsed ? 'Trascorso' : 'In programma'}</p>
                <p className="mt-1 break-words text-sm font-bold text-[#2d2754]">{event.title}</p>
                {event.location && <p className="mt-0.5 break-words text-xs text-[#716a91]">{event.location}</p>}
              </button>
            </li>
          })}
        </ol> : <p className="mt-3 text-sm text-[#716a91]">Nessun intervento nel calendario per questa lavorazione.</p>}
      </section>}
      {exportError && <p role="alert" className="mt-4 text-sm text-[#a83d35]">{exportError}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {!isTodo && <button onClick={() => void exportPdf()} disabled={exporting || !preparedPdf} className="flex min-w-[160px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#257259] px-3 py-3 text-sm font-bold text-white disabled:opacity-50"><FileDown className="h-4 w-4" />{preparedPdf ? 'Esporta e condividi PDF' : 'Preparazione PDF...'}</button>}
        <button onClick={onEdit} className="flex min-w-[160px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#2d2754] px-3 py-3 text-sm font-bold text-white"><Pencil className="h-4 w-4" />{isTodo ? 'Modifica attività' : 'Modifica lavorazione'}</button>
      </div>
      {selectedIntervention && <EventDetailModal event={selectedIntervention} clientName={clientName} workItemName={item.title} onClose={() => setInterventionId(null)} onScheduleFollowUp={onScheduleFollowUp} />}
    </div>
  </div>
}