'use client'

import { Eye, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface CallsWorkspaceProps {
  calls: any[]
  onNew: () => void
  onEdit: (call: any) => void
  onDetail: (call: any) => void
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: any) => Promise<void>
}

export default function CallsWorkspace({ calls, onNew, onEdit, onDetail, onDelete, onStatusChange }: CallsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const filtered = calls.filter((call) => `${call.caller_name} ${call.company || ''} ${call.phone || ''} ${call.notes || ''}`.toLowerCase().includes(query.toLowerCase()))
  const statusLabel: Record<string, string> = { pending: 'In attesa', in_corso: 'In corso', completed: 'Completata', cancelled: 'Annullata' }

  return (
    <section className="ak-workspace ak-calls-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Registro personale</p><h2>Chiamate</h2><p>Ogni contatto, con il suo riepilogo e il prossimo passo.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuova chiamata</button></header>
      <div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca nome, azienda o telefono" /></div><span className="ak-count">{filtered.length} registrate</span></div>
      <div className="ak-call-list">{filtered.length ? filtered.map((call) => <article key={call.id} className="ak-call-row" onClick={() => onDetail(call)}><div className="ak-call-avatar"><Phone className="h-4 w-4" /></div><div className="ak-call-body"><div className="ak-call-head"><h3>{call.caller_name}</h3><span className={`ak-status ak-status-${call.status}`}>{statusLabel[call.status] || call.status}</span></div><p>{call.company || 'Contatto personale'} · {call.phone}</p><p className="ak-call-note">{call.notes || 'Nessuna nota aggiunta.'}</p></div><div className="ak-call-actions" onClick={(event) => event.stopPropagation()}><button onClick={() => onDetail(call)} title="Riepilogo"><Eye className="h-4 w-4" /></button><button onClick={() => onEdit(call)} title="Modifica">Modifica</button><button onClick={() => onDelete(call.id)} title="Elimina" className="ak-danger"><Trash2 className="h-4 w-4" /></button></div></article>) : <div className="ak-empty"><Phone className="h-8 w-8" /><h3>Nessuna chiamata trovata</h3><p>Registra il primo contatto per iniziare il registro.</p></div>}</div>
    </section>
  )
}
