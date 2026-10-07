'use client'

import { useState } from 'react'
import { ArrowLeft, Briefcase, Building2, CalendarDays, ClipboardList, Mail, Pencil, Phone, Plus, Trash2, X } from 'lucide-react'
import { WorkItem } from '../hooks/useWorkItems'
import { Event } from '../hooks/useEvents'
import EventDetailModal from './EventDetailModal'

export default function ClientDetailModal({ client, clients, calls, events, workItems, onOpenWorkItems, onOpenTodos, onNewAppointment, onEditEvent, onDeleteEvent, onScheduleFollowUp, onClose, onSelectClient, onEdit, onDelete }: { client: any | null; clients: any[]; calls: any[]; events: Event[]; workItems: WorkItem[]; onOpenWorkItems: (client: any) => void; onOpenTodos: (client: any) => void; onNewAppointment: (client: any) => void; onEditEvent: (event: Event) => void; onDeleteEvent: (id: string) => void | Promise<void>; onScheduleFollowUp: (event: Event) => void; onClose: () => void; onSelectClient: (client: any) => void; onEdit: (client: any) => void; onDelete: (id: string) => Promise<void> }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [appointmentFilter, setAppointmentFilter] = useState<'upcoming' | 'past'>('upcoming')
  if (!client) return null
  const parent = clients.find(item => item.id === client.parent_client_id)
  const children = clients.filter(item => item.parent_client_id === client.id)
  const directWorkCount = workItems.filter(item => item.client_id === client.id && item.kind !== 'todo').length
  const directTodoCount = workItems.filter(item => item.client_id === client.id && item.kind === 'todo').length
  const normalize = (value?: string) => (value || '').replace(/\D/g, '')
  const matchedCalls = calls.filter(call => (normalize(call.phone) && normalize(call.phone) === normalize(client.phone)) || call.caller_name?.toLowerCase() === client.name?.toLowerCase())
  const clientEvents = events.filter(event => event.client_id === client.id)
  const isPastEvent = (event: Event) => {
    const end = new Date(event.end_date || event.start_date)
    if (event.all_day) end.setHours(23, 59, 59, 999)
    return end.getTime() < Date.now()
  }
  const upcomingEvents = clientEvents.filter(event => !isPastEvent(event)).sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())
  const pastEvents = clientEvents.filter(isPastEvent).sort((first, second) => new Date(second.start_date).getTime() - new Date(first.start_date).getTime())
  const visibleEvents = appointmentFilter === 'upcoming' ? upcomingEvents : pastEvents
  const selectedEvent = clientEvents.find(event => event.id === selectedEventId)
  const contactName = [client.contact_first_name, client.contact_last_name].filter(Boolean).join(' ')
  return <div className="ak-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-ak-inset/35 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ak-panel p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">{parent && <button onClick={() => onSelectClient(parent)} className="flex items-center gap-1 text-xs font-bold text-ak-success hover:underline"><ArrowLeft className="h-3.5 w-3.5" />{parent.name}</button>}<p className="ak-kicker mt-1">Contatto</p><h2 className="mt-2 break-words text-2xl font-black text-ak-text">{client.name}</h2><p className="mt-1 text-sm text-ak-muted">{client.category === 'azienda' ? 'Azienda' : client.company || 'Contatto privato'}</p></div>
        <button onClick={onClose} title="Chiudi" className="rounded-lg p-2 text-ak-muted hover:bg-ak-inset"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info icon={<Phone className="h-4 w-4" />} label="Telefono" value={client.phone || 'Non disponibile'} />
        <Info icon={<Mail className="h-4 w-4" />} label="Email" value={client.email || 'Non disponibile'} />
      </div>
      {client.category === 'azienda' && (contactName || client.contact_phone || client.contact_email) && <section className="mt-6">
        <h3 className="font-black text-ak-text">Referente aziendale</h3>
        {contactName && <p className="mt-2 text-sm font-semibold text-ak-text">{contactName}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {client.contact_phone && <Info icon={<Phone className="h-4 w-4" />} label="Telefono referente" value={client.contact_phone} />}
          {client.contact_email && <Info icon={<Mail className="h-4 w-4" />} label="Email referente" value={client.contact_email} />}
        </div>
      </section>}
      {children.length > 0 && <section className="mt-6 border-t border-ak-line pt-5">
        <div className="flex items-center justify-between"><h3 className="font-black text-ak-text">Strutture collegate</h3><span className="text-xs font-bold text-ak-muted">{children.length}</span></div>
        <div className="mt-3 space-y-2">{children.map(child => <button key={child.id} onClick={() => onSelectClient(child)} className="flex w-full items-center gap-3 rounded-lg bg-ak-panel p-3 text-left hover:bg-ak-inset">
          <Building2 className="h-4 w-4 shrink-0 text-ak-success" />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ak-text">{child.name}</span><span className="block truncate text-xs text-ak-muted">{[child.city, child.phone, child.email].filter(Boolean).join(' · ') || 'Nessun recapito'}</span></span>
          <span className="text-xs font-bold text-ak-success">Apri</span>
        </button>)}</div>
      </section>}
      {(parent || directWorkCount > 0) && <button onClick={() => onOpenWorkItems(client)} className="mt-6 flex w-full items-center gap-3 rounded-lg border border-ak-line bg-ak-success-bg p-4 text-left hover:bg-ak-success-bg">
        <Briefcase className="h-5 w-5 shrink-0 text-ak-success" />
        <span className="flex-1 text-sm font-bold text-ak-text">Lavorazioni</span>
        <span className="text-xs font-bold text-ak-success">{directWorkCount} · Apri</span>
      </button>}
      {(parent || directTodoCount > 0) && <button onClick={() => onOpenTodos(client)} className="mt-2 flex w-full items-center gap-3 rounded-lg border border-ak-line bg-ak-warning-bg p-4 text-left hover:bg-ak-warning-bg">
        <ClipboardList className="h-5 w-5 shrink-0 text-ak-warning" />
        <span className="flex-1 text-sm font-bold text-ak-text">Cose da fare</span>
        <span className="text-xs font-bold text-ak-warning">{directTodoCount} · Apri</span>
      </button>}
      <section className="mt-6 border-t border-ak-line pt-5">
        <div className="flex items-center justify-between gap-2"><h3 className="font-black text-ak-text">Appuntamenti</h3><button onClick={() => onNewAppointment(client)} className="flex items-center gap-1.5 rounded-lg bg-ak-accent px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Nuovo</button></div>
        <div className="mt-3 flex gap-1 rounded-lg bg-ak-inset p-1">
          <button onClick={() => setAppointmentFilter('upcoming')} aria-pressed={appointmentFilter === 'upcoming'} className={`flex-1 rounded-md px-2 py-2 text-xs font-bold ${appointmentFilter === 'upcoming' ? 'bg-ak-panel text-ak-success shadow-sm' : 'text-ak-muted'}`}>Prossimi · {upcomingEvents.length}</button>
          <button onClick={() => setAppointmentFilter('past')} aria-pressed={appointmentFilter === 'past'} className={`flex-1 rounded-md px-2 py-2 text-xs font-bold ${appointmentFilter === 'past' ? 'bg-ak-panel text-ak-success shadow-sm' : 'text-ak-muted'}`}>Passati · {pastEvents.length}</button>
        </div>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{visibleEvents.length ? visibleEvents.map(event => {
          const start = new Date(event.start_date)
          const elapsed = isPastEvent(event)
          return <button key={event.id} onClick={() => setSelectedEventId(event.id)} className="flex w-full items-start gap-3 rounded-xl bg-ak-panel p-3 text-left hover:bg-ak-inset">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ak-success" />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold text-ak-text">{event.title}</span><span className="mt-1 block text-xs text-ak-muted">{Number.isNaN(start.getTime()) ? event.start_date : start.toLocaleString('it-IT', event.all_day ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })}{event.location ? ` · ${event.location}` : ''}</span></span>
            <span className={`shrink-0 text-[10px] font-bold ${elapsed ? 'text-ak-muted' : 'text-ak-success'}`}>{elapsed ? 'Passato' : 'In programma'}</span>
          </button>
        }) : <p className="rounded-xl bg-ak-panel p-4 text-sm text-ak-muted">{appointmentFilter === 'upcoming' ? 'Nessun appuntamento in programma.' : 'Nessun appuntamento passato.'}</p>}</div>
      </section>
      <section className="mt-6">
        <div className="flex items-center justify-between"><h3 className="font-black text-ak-text">Cronologia chiamate</h3><span className="text-xs font-bold text-ak-muted">{matchedCalls.length}</span></div>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{matchedCalls.length ? matchedCalls.map(call => <div key={call.id} className="rounded-xl bg-ak-panel p-3"><p className="font-bold text-ak-text">{call.caller_name}</p><p className="mt-1 text-xs text-ak-muted">{call.notes || call.call_type || 'Chiamata registrata'}</p></div>) : <p className="rounded-xl bg-ak-panel p-4 text-sm text-ak-muted">Nessuna chiamata collegata a questo contatto.</p>}</div>
      </section>
      <div className="mt-6 flex gap-2"><button onClick={() => onEdit(client)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ak-accent py-3 text-sm font-bold text-white"><Pencil className="h-4 w-4" />Modifica contatto</button>{parent && <button onClick={() => { if (window.confirm(`Eliminare ${client.name}?`)) { void onDelete(client.id).then(() => onSelectClient(parent)) } }} title="Elimina struttura" className="rounded-lg border border-ak-danger px-3 text-ak-danger hover:bg-ak-danger-bg"><Trash2 className="h-4 w-4" /></button>}</div>
    </div>
    {selectedEvent && <EventDetailModal event={selectedEvent} clientName={client.name} workItemName={workItems.find(item => item.id === selectedEvent.work_item_id)?.title} onClose={() => setSelectedEventId(null)} onEdit={event => { setSelectedEventId(null); onEditEvent(event) }} onDelete={onDeleteEvent} onScheduleFollowUp={event => { setSelectedEventId(null); onScheduleFollowUp(event) }} />}
  </div>
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl bg-ak-panel p-3"><span className="flex items-center gap-2 text-xs font-bold text-ak-muted">{icon}{label}</span><p className="mt-2 truncate text-sm font-semibold text-ak-text">{value}</p></div> }