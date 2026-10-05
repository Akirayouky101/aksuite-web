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
  onDelete?: (id: string) => void
  onScheduleFollowUp?: (event: Event) => void
}

export default function EventDetailModal({ event, clientName, workItemName, onClose, onEdit, onReschedule, onDelete, onScheduleFollowUp }: EventDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const date = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const startLabel = Number.isNaN(date.getTime()) ? event.start_date : date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeLabel = event.all_day ? 'Tutto il giorno' : `${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}${endDate ? ` – ${endDate.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`

  return createPortal(<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5" onClick={e => { e.stopPropagation(); onClose() }}>
    <div role="dialog" aria-modal="true" aria-label={`Intervento ${event.title}`} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
      <header className="flex items-start justify-between gap-3 border-b border-[#ead8bf] px-5 py-5 sm:px-6">
        <div className="min-w-0"><p className="ak-kicker">Intervento programmato</p><h2 className="mt-1 break-words text-xl font-black text-[#2d2754]">{event.title}</h2></div>
        <button onClick={onClose} title="Chiudi" className="shrink-0 rounded-lg p-2 text-[#716a91] hover:bg-[#f5dfca]"><X className="h-4 w-4" /></button>
      </header>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <EventCompletionActions event={event} onDone={onClose} onReschedule={onReschedule || onEdit ? () => (onReschedule || onEdit)?.(event) : undefined} />
        <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">DATA</p><p className="mt-1 text-sm font-bold capitalize text-[#2d2754]">{startLabel}</p></div></div>
        <div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">ORARIO</p><p className="mt-1 text-sm text-[#2d2754]">{timeLabel}</p></div></div>
        {event.location && <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">LUOGO</p><a href={`https://maps.apple.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex break-words text-sm font-semibold text-[#257259] underline">{event.location} · Apri in Mappe</a></div></div>}
        {clientName && <div className="flex gap-3"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">CLIENTE / STRUTTURA</p><p className="mt-1 text-sm text-[#2d2754]">{clientName}</p></div></div>}
        {clientName && <div className="flex gap-3"><Users className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">CONFERMA CLIENTE</p><p className={`mt-1 text-sm font-bold ${event.client_confirmed ? 'text-[#257259]' : 'text-amber-700'}`}>{event.client_confirmed ? 'Confermato' : 'In attesa'}</p></div></div>}
        {workItemName && <div className="flex gap-3"><Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#257259]" /><div><p className="text-xs font-bold text-[#716a91]">LAVORAZIONE</p><p className="mt-1 text-sm text-[#2d2754]">{workItemName}</p></div></div>}
        {event.description && <section className="border-t border-[#ead8bf] pt-4"><p className="text-xs font-bold text-[#716a91]">DESCRIZIONE</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#2d2754]">{event.description}</p></section>}
        {(event.assigned_to || event.is_recurring || event.is_shared) && <div className="flex flex-wrap gap-3 border-t border-[#ead8bf] pt-4 text-xs font-semibold text-[#716a91]">
          {event.assigned_to && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{event.assigned_to_name || 'Utente'}</span>}
          {event.is_recurring && <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" />Ricorrente</span>}
          {event.is_shared && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Visibile a tutti</span>}
        </div>}
      </div>
      {(onEdit || onDelete || (event.client_id && onScheduleFollowUp)) && <footer className="border-t border-[#ead8bf] px-5 py-4 sm:px-6">
        {confirmDelete ? <><p className="flex-1 self-center text-sm font-semibold text-[#a83d35]">Eliminare questo evento?</p><button onClick={() => setConfirmDelete(false)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-[#2d2754]">Annulla</button><button onClick={() => onDelete?.(event.id)} className="rounded-lg bg-[#a83d35] px-3 py-2 text-sm font-bold text-white">Elimina</button></> : <>
          <div className="grid grid-cols-2 gap-2">
            {event.client_id && onScheduleFollowUp && <button onClick={() => onScheduleFollowUp(event)} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-[#257259] py-2.5 text-sm font-bold text-white"><PhoneCall className="h-4 w-4" />Programma richiamo</button>}
            {onEdit && <button onClick={() => onEdit(event)} className="flex items-center justify-center gap-2 rounded-lg bg-[#2d2754] py-2.5 text-sm font-bold text-white"><Pencil className="h-4 w-4" />Modifica</button>}
            {onDelete && <button onClick={() => setConfirmDelete(true)} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-bold text-[#a83d35] hover:bg-red-50"><Trash2 className="h-4 w-4" />Elimina</button>}
          </div>
        </>}
      </footer>}
    </div>
  </div>, document.body)
}