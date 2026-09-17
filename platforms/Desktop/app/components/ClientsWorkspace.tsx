'use client'

import { Mail, MapPin, Pencil, Phone, Plus, Search, Star, Trash2, User } from 'lucide-react'
import { useState } from 'react'

interface ClientsWorkspaceProps {
  clients: any[]
  onNew: () => void
  onEdit: (client: any) => void
  onDelete: (id: string) => Promise<void>
  onToggleFavorite: (id: string) => void
}

export default function ClientsWorkspace({ clients, onNew, onEdit, onDelete, onToggleFavorite }: ClientsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const filtered = clients.filter((item) => `${item.name} ${item.company || ''} ${item.phone || ''} ${item.city || ''} ${item.email || ''}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="ak-workspace ak-clients-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Directory personale</p><h2>Rubrica clienti</h2><p>Contatti, riferimenti e preferiti in una vista pulita.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuovo cliente</button></header>
      <div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca nome, azienda, città o email" /></div><span className="ak-count">{filtered.length} contatti</span></div>
      <div className="ak-client-grid">{filtered.length ? filtered.map((client) => <article key={client.id} className="ak-client-card"><div className="flex items-start justify-between"><div className="ak-client-avatar"><User className="h-5 w-5" /></div><div className="flex gap-1"><button onClick={() => onToggleFavorite(client.id)} title="Preferito" className={client.is_favorite ? 'ak-favorite active' : 'ak-favorite'}><Star className="h-4 w-4" /></button><button onClick={() => onEdit(client)} title="Modifica"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(client.id)} title="Elimina" className="ak-danger"><Trash2 className="h-4 w-4" /></button></div></div><h3 className="mt-5">{client.name}</h3><p className="ak-client-company">{client.company || 'Contatto privato'}</p><div className="ak-client-details"><span><Phone className="h-3.5 w-3.5" />{client.phone || 'Nessun telefono'}</span><span><Mail className="h-3.5 w-3.5" />{client.email || 'Nessuna email'}</span>{client.city && <span><MapPin className="h-3.5 w-3.5" />{client.city}</span>}</div></article>) : <div className="ak-empty"><User className="h-8 w-8" /><h3>Rubrica vuota</h3><p>Aggiungi il primo cliente per creare il tuo archivio.</p></div>}</div>
    </section>
  )
}
