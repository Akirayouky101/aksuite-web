'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Clock3, Briefcase, Building2, MapPin, Pencil, PhoneCall, Repeat2, Trash2, User, Users, X } from 'lucide-react'
import { Event } from '../hooks/useEvents'
import EventCompletionActions from './EventCompletionActions'

interface EventDetailModalProps {
  event: Event
  clientName?: string
  workItemName?: string
  onClose: () => void
  onEdit?: (event: Event) => void
  onReschedule?: (event: Event) => void
  onDelete?: (id: string) => void | Promise<void>
  onChanged?: (id: string) => void
  onScheduleFollowUp?: (event: Event) => void
}

export default function EventDetailModal({ event, clientName, workItemName, onClose, onEdit, onReschedule, onDelete, onChanged, onScheduleFollowUp }: EventDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const busy = deleting || completing
  async function remove() {
    if (!onDelete || busy) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(event.id)
      onChanged?.(event.id)
      onClose()
    } catch (cause) {
      console.error('Event deletion failed:', cause)
      setDeleteError(cause instanceof Error ? cause.message : 'Impossibile eliminare l’evento. Riprova.')
    } finally { setDeleting(false) }
  }
  const date = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const startLabel = Number.isNaN(date.getTime()) ? event.start_date : date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeLabel = event.all_day ? 'Tutto il giorno' : `${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}${endDate ? ` – ${endDate.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`

  return createPortal(<div className="ak-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-ak-inset/50 p-3 backdrop-blur-sm sm:p-5" onClick={e => { e.stopPropagation(); if (!busy) onClose() }}>
    <div role="dialog" aria-modal="true" aria-label={`Intervento ${event.title}`} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-ak-panel shadow-2xl" onClick={e => e.stopPropagation()}>
      <header className="flex items-start justify-between gap-3 border-b border-ak-line px-5 py-5 sm:px-6">
        <div className="min-w-0"><p className="ak-kicker">Intervento programmato</p><h2 className="mt-1 break-words text-xl font-black text-ak-text">{event.title}</h2></div>
        <button disabled={busy} onClick={onClose} title="Chiudi" className="shrink-0 rounded-lg p-2 text-ak-muted hover:bg-ak-hover"><X className="h-4 w-4" /></button>
      </header>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <EventCompletionActions event={event} disabled={deleting} onBusyChange={setCompleting} onDone={() => { onChanged?.(event.id); onClose() }} onReschedule={onReschedule || onEdit ? () => (onReschedule || onEdit)?.(event) : undefined} />
        {deleteError && <p role="alert" className="text-sm text-ak-danger">{deleteError}</p>}
        <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">DATA</p><p className="mt-1 text-sm font-bold capitalize text-ak-text">{startLabel}</p></div></div>
        <div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">ORARIO</p><p className="mt-1 text-sm text-ak-text">{timeLabel}</p></div></div>
        {event.location && <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">LUOGO</p><a href={`https://maps.apple.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex break-words text-sm font-semibold text-ak-success underline">{event.location} · Apri in Mappe</a></div></div>}
        {clientName && <div className="flex gap-3"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">CLIENTE / STRUTTURA</p><p className="mt-1 text-sm text-ak-text">{clientName}</p></div></div>}
        {clientName && <div className="flex gap-3"><Users className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">CONFERMA CLIENTE</p><p className={`mt-1 text-sm font-bold ${event.client_confirmed ? 'text-ak-success' : 'text-ak-warning'}`}>{event.client_confirmed ? 'Confermato' : 'In attesa'}</p></div></div>}
        {workItemName && <div className="flex gap-3"><Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" /><div><p className="text-xs font-bold text-ak-muted">LAVORAZIONE</p><p className="mt-1 text-sm text-ak-text">{workItemName}</p></div></div>}
        {event.description && <section className="border-t border-ak-line pt-4"><p className="text-xs font-bold text-ak-muted">DESCRIZIONE</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ak-text">{event.description}</p></section>}
        {(event.assigned_to || event.is_recurring || event.is_shared) && <div className="flex flex-wrap gap-3 border-t border-ak-line pt-4 text-xs font-semibold text-ak-muted">
          {event.assigned_to && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{event.assigned_to_name || 'Utente'}</span>}
          {event.is_recurring && <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" />Ricorrente</span>}
          {event.is_shared && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Visibile a tutti</span>}
        </div>}
      </div>
      {(onEdit || onDelete || (event.client_id && onScheduleFollowUp)) && <footer className="border-t border-ak-line px-5 py-4 sm:px-6">
        {confirmDelete ? <><p className="flex-1 self-center text-sm font-semibold text-ak-danger">Eliminare questo evento?</p><button disabled={busy} onClick={() => setConfirmDelete(false)} className="rounded-lg bg-ak-inset px-3 py-2 text-sm font-bold text-ak-text">Annulla</button><button type="button" disabled={busy} onClick={() => void remove()} className="rounded-lg bg-ak-danger-bg px-3 py-2 text-sm font-bold text-white">{deleting ? 'Eliminazione...' : 'Elimina'}</button></> : <>
          <div className="grid grid-cols-2 gap-2">
            {event.client_id && onScheduleFollowUp && <button disabled={busy} onClick={() => onScheduleFollowUp(event)} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-ak-accent py-2.5 text-sm font-bold text-white"><PhoneCall className="h-4 w-4" />Programma richiamo</button>}
            {onEdit && <button disabled={busy} onClick={() => onEdit(event)} className="flex items-center justify-center gap-2 rounded-lg bg-ak-accent py-2.5 text-sm font-bold text-white"><Pencil className="h-4 w-4" />Modifica</button>}
            {onDelete && <button disabled={busy} onClick={() => setConfirmDelete(true)} className="flex items-center justify-center gap-2 rounded-lg border border-ak-danger py-2.5 text-sm font-bold text-ak-danger hover:bg-ak-danger-bg"><Trash2 className="h-4 w-4" />Elimina</button>}
          </div>
        </>}
      </footer>}
    </div>
  </div>, document.body)
}