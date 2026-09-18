'use client'

import { ChevronRight, Eye, EyeOff, Folder, KeyRound, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PasswordCategory } from '../hooks/usePasswords'
import PasswordCategoryModal from './PasswordCategoryModal'

interface PasswordsWorkspaceProps {
  passwords: any[]
  onNew: () => void
  onEdit: (password: any) => void
  onDetail: (password: any) => void
  onDelete: (id: string) => Promise<void>
  categories?: PasswordCategory[]
  onCreateCategory?: (name: string, parentId: string | null) => Promise<PasswordCategory | null>
}

export default function PasswordsWorkspace({ passwords, onNew, onEdit, onDetail, onDelete, categories = [], onCreateCategory }: PasswordsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string[]>([])
  const [categoryParentId, setCategoryParentId] = useState<string | null | undefined>(undefined)
  const explicitPaths = categories.map((category) => {
    const path: string[] = []
    let current: PasswordCategory | undefined = category
    while (current) {
      path.unshift(current.name)
      current = current.parent_id ? categories.find(item => item.id === current?.parent_id) : undefined
    }
    return path.join(' / ')
  })
  const allPaths = Array.from(new Set(explicitPaths.filter(Boolean)))
  const prefix = selectedPath.join(' / ')
  const uncategorizedCount = passwords.filter(item => !String(item.category || '').trim()).length
  const folders = allPaths.filter(path => {
    const parts = path.split(' / ')
    return parts.length === selectedPath.length + 1 && parts.slice(0, selectedPath.length).join(' / ') === prefix
  })
  const filtered = passwords.filter((item) => {
    const category = String(item.category || '')
    const inFolder = selectedPath.join('/') === '__uncategorized__'
      ? !category.trim()
      : selectedPath.length > 0 && category === prefix
    const matchesSearch = `${item.title} ${item.username} ${category}`.toLowerCase().includes(query.toLowerCase())
    return inFolder && matchesSearch
  })
  const visibleCount = selectedPath.length === 0 ? passwords.length : filtered.length
  const getCategoryPath = (categoryId: string | null) => {
    const path: string[] = []
    let current = categories.find(category => category.id === categoryId)
    while (current) {
      path.unshift(current.name)
      current = current.parent_id ? categories.find(category => category.id === current?.parent_id) : undefined
    }
    return path.join(' / ')
  }
  const getCategoryIdByPath = (path: string) => {
    const category = categories.find(item => getCategoryPath(item.id) === path)
    return category?.id || null
  }

  return (
    <section className="ak-workspace ak-passwords-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Vault personale</p><h2>Password</h2><p>Credenziali ordinate, leggibili e protette.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setCategoryParentId(null)} className="ak-secondary-action"><Folder className="h-4 w-4" />Crea categoria</button><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuova password</button></div></header>
      <div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca servizio, username o categoria" /></div><span className="ak-count">{visibleCount} credenziali</span></div>
      {selectedPath.length > 0 && <div className="mb-5 flex items-center gap-1 text-sm text-slate-500"><button onClick={() => setSelectedPath([])} className="font-semibold text-indigo-600 hover:text-indigo-700">Categorie</button>{selectedPath.map((part, index) => <span key={`${part}-${index}`} className="flex items-center gap-1"><ChevronRight className="h-4 w-4" /><button onClick={() => setSelectedPath(selectedPath.slice(0, index + 1))} className={index === selectedPath.length - 1 ? 'font-semibold text-slate-700' : 'hover:text-indigo-600'}>{part === '__uncategorized__' ? 'Senza Categoria' : part}</button></span>)}</div>}
      {folders.length > 0 && <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{folders.map(path => { const name = path.split(' / ').pop() || path; return <div key={path} className="ak-bento flex items-center gap-3"><button onClick={() => setSelectedPath(path.split(' / '))} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ddd7ff] text-[#4b3ba5]"><Folder className="h-5 w-5" /></span><span className="min-w-0"><strong className="block truncate text-[#2d2754]">{name}</strong><small className="text-slate-400">{passwords.filter(item => String(item.category || '').startsWith(path)).length} credenziali</small></span></button><button onClick={() => setCategoryParentId(getCategoryIdByPath(path))} title={`Crea sottocategoria in ${name}`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-lg leading-none text-indigo-600 transition hover:bg-indigo-100">+</button><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></div> })}</div>}
      {selectedPath.length === 0 && uncategorizedCount > 0 && <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><button onClick={() => setSelectedPath(['__uncategorized__'])} className="ak-bento flex items-center gap-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><KeyRound className="h-5 w-5" /></span><span><strong className="block text-[#2d2754]">Senza Categoria</strong><small className="text-slate-400">{uncategorizedCount} credenziali</small></span><ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></button></div>}
      {selectedPath.length > 0 && <div className="ak-password-grid">{filtered.length ? filtered.map((item) => <article key={item.id} className="ak-password-card" onClick={() => onDetail(item)}><div className="flex items-start justify-between"><span className="ak-password-icon">{item.emoji || <KeyRound className="h-4 w-4" />}</span><div className="flex gap-1" onClick={(event) => event.stopPropagation()}><button onClick={() => onEdit(item)} title="Modifica"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(item.id)} title="Elimina" className="ak-danger"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-5"><div className="flex items-center gap-2"><h3>{item.title}</h3>{item.isFavorite && <Star className="h-3.5 w-3.5 fill-[#e45f4e] text-[#e45f4e]" />}</div><p className="ak-password-category">{item.category}</p></div><div className="ak-secret-row"><span>{item.username}</span><button onClick={(event) => { event.stopPropagation(); setVisible(visible === item.id ? null : item.id) }} title="Mostra password">{visible === item.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="ak-secret-value">{visible === item.id ? item.password : '••••••••••••'}</p></article>) : <div className="ak-empty"><KeyRound className="h-8 w-8" /><h3>Nessuna credenziale qui</h3><p>Aggiungi o cerca una password in questa categoria.</p></div>}</div>}
      {selectedPath.length === 0 && folders.length === 0 && uncategorizedCount === 0 && <div className="ak-empty"><Folder className="h-8 w-8" /><h3>Nessuna categoria</h3><p>Crea la prima categoria dal pulsante qui sopra.</p></div>}
      <PasswordCategoryModal
        isOpen={categoryParentId !== undefined}
        parentName={categoryParentId ? getCategoryPath(categoryParentId) : undefined}
        onClose={() => setCategoryParentId(undefined)}
        onSave={async (name) => { await onCreateCategory?.(name, categoryParentId ?? null); setCategoryParentId(undefined) }}
      />
    </section>
  )
}
