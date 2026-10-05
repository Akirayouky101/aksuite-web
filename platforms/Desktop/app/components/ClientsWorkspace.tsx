'use client'

import { Mail, MapPin, Pencil, Phone, Plus, Search, Star, Trash2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { WorkItem } from '../hooks/useWorkItems'
import { Event } from '../hooks/useEvents'
import ClientDetailModal from './ClientDetailModal'

interface ClientsWorkspaceProps {
  clients: any[]
  calls: any[]
  events: Event[]
  workItems: WorkItem[]
  initialSelectedClientId?: string | null
  onOpenWorkItems: (client: any) => void
  onOpenTodos: (client: any) => void
  onNewAppointment: (client: any) => void
  onEditEvent: (event: Event) => void
  onDeleteEvent: (id: string) => void
  onScheduleFollowUp: (event: Event) => void
  onNew: () => void
  onEdit: (client: any) => void
  onDelete: (id: string) => Promise<void>
  onToggleFavorite: (id: string) => void
}

export default function ClientsWorkspace({ clients, calls, events, workItems, initialSelectedClientId, onOpenWorkItems, onOpenTodos, onNewAppointment, onEditEvent, onDeleteEvent, onScheduleFollowUp, onNew, onEdit, onDelete, onToggleFavorite }: ClientsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedClientId || null)
  const selected = clients.find(client => client.id === selectedId) || null
  useEffect(() => {
    if (initialSelectedClientId) setSelectedId(initialSelectedClientId)
  }, [initialSelectedClientId])
  const filtered = clients.filter(item => {
    if (item.parent_client_id && clients.some(client => client.id === item.parent_client_id)) return false
    const related = clients.filter(client => client.parent_client_id === item.id)
    return [item, ...related].some(client => `${client.name} ${client.company || ''} ${client.phone || ''} ${client.city || ''} ${client.email || ''}`.toLowerCase().includes(query.toLowerCase()))
  })

  return (
    <section className="ak-workspace ak-clients-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Directory personale</p><h2>Rubrica clienti</h2><p>Contatti, riferimenti e preferiti in una vista pulita.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuovo cliente</button></header>
      <div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca nome, azienda, città o email" /></div><span className="ak-count">{filtered.length} contatti</span></div>
      <div className="ak-client-grid">
        {filtered.length ? filtered.map(client => {
          const parent = clients.find(item => item.id === client.parent_client_id)
          const children = clients.filter(item => item.parent_client_id === client.id).length
          return <article key={client.id} className="ak-client-card cursor-pointer" onClick={() => setSelectedId(client.id)}>
            <div className="flex items-start justify-between">
              <div className="ak-client-avatar"><User className="h-5 w-5" /></div>
              <div className="flex gap-1" onClick={event => event.stopPropagation()}>
                <button onClick={() => onToggleFavorite(client.id)} title="Preferito" className={client.is_favorite ? 'ak-favorite active' : 'ak-favorite'}><Star className="h-4 w-4" /></button>
                <button onClick={() => onEdit(client)} title="Modifica"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(client.id)} title="Elimina" className="ak-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="mt-5">{client.name}</h3>
            <p className="ak-client-company">{client.category === 'azienda' ? 'Azienda' : client.company || 'Contatto privato'}</p>
            {parent && <p className="mt-1 text-xs font-bold text-[#376db5]">Sotto: {parent.name}</p>}
            {children > 0 && <p className="mt-1 text-xs font-bold text-[#257259]">{children} clienti collegati</p>}
            <div className="ak-client-details">
              <span><Phone className="h-3.5 w-3.5" />{client.phone || 'Nessun telefono'}</span>
              <span><Mail className="h-3.5 w-3.5" />{client.email || 'Nessuna email'}</span>
              {client.city && <span><MapPin className="h-3.5 w-3.5" />{client.city}</span>}
            </div>
          </article>
        }) : <div className="ak-empty"><User className="h-8 w-8" /><h3>Rubrica vuota</h3><p>Aggiungi il primo cliente per creare il tuo archivio.</p></div>}
      </div>
      <ClientDetailModal client={selected} clients={clients} calls={calls} events={events} workItems={workItems} onOpenWorkItems={onOpenWorkItems} onOpenTodos={onOpenTodos} onNewAppointment={client => { setSelectedId(null); onNewAppointment(client) }} onEditEvent={event => { setSelectedId(null); onEditEvent(event) }} onDeleteEvent={onDeleteEvent} onScheduleFollowUp={event => { setSelectedId(null); onScheduleFollowUp(event) }} onClose={() => setSelectedId(null)} onSelectClient={client => setSelectedId(client.id)} onEdit={client => { setSelectedId(null); onEdit(client) }} onDelete={onDelete} />
    </section>
  )
}
