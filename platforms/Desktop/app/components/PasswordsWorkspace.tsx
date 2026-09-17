'use client'

import { Eye, EyeOff, KeyRound, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface PasswordsWorkspaceProps {
  passwords: any[]
  onNew: () => void
  onEdit: (password: any) => void
  onDelete: (id: string) => Promise<void>
}

export default function PasswordsWorkspace({ passwords, onNew, onEdit, onDelete }: PasswordsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState<string | null>(null)
  const filtered = passwords.filter((item) => `${item.title} ${item.username} ${item.category}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="ak-workspace ak-passwords-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Vault personale</p><h2>Password</h2><p>Credenziali ordinate, leggibili e protette.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuova password</button></header>
      <div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca servizio, username o categoria" /></div><span className="ak-count">{filtered.length} credenziali</span></div>
      <div className="ak-password-grid">{filtered.length ? filtered.map((item) => <article key={item.id} className="ak-password-card"><div className="flex items-start justify-between"><span className="ak-password-icon">{item.emoji || <KeyRound className="h-4 w-4" />}</span><div className="flex gap-1"><button onClick={() => onEdit(item)} title="Modifica"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(item.id)} title="Elimina" className="ak-danger"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-5"><div className="flex items-center gap-2"><h3>{item.title}</h3>{item.isFavorite && <Star className="h-3.5 w-3.5 fill-[#e45f4e] text-[#e45f4e]" />}</div><p className="ak-password-category">{item.category}</p></div><div className="ak-secret-row"><span>{item.username}</span><button onClick={() => setVisible(visible === item.id ? null : item.id)} title="Mostra password">{visible === item.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="ak-secret-value">{visible === item.id ? item.password : '••••••••••••'}</p></article>) : <div className="ak-empty"><KeyRound className="h-8 w-8" /><h3>Il vault è vuoto</h3><p>Aggiungi la prima credenziale per iniziare.</p></div>}</div>
    </section>
  )
}
