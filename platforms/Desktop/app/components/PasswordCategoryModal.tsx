'use client'

import { useEffect, useState } from 'react'
import { FolderPlus, Trash2, X } from 'lucide-react'

interface PasswordCategoryModalProps {
  isOpen: boolean
  parentName?: string
  initialName?: string
  mode?: 'create' | 'edit'
  onClose: () => void
  onSave: (name: string) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function PasswordCategoryModal({ isOpen, parentName, initialName = '', mode = 'create', onClose, onSave, onDelete }: PasswordCategoryModalProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (isOpen) setName(initialName) }, [initialName, isOpen])
  if (!isOpen) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(name)
    setName('')
    setSaving(false)
    onClose()
  }

  return (
    <div className="ak-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-ak-inset/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-ak-line/60 bg-ak-panel/95 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ak-purple-bg text-ak-purple"><FolderPlus className="h-5 w-5" /></span><div><h2 className="font-bold text-ak-text">{mode === 'edit' ? 'Modifica categoria' : 'Nuova categoria'}</h2><p className="text-xs text-ak-subtle">{parentName ? `Dentro ${parentName}` : 'Categoria principale'}</p></div></div>
          <button type="button" onClick={onClose} title="Chiudi" className="rounded-lg bg-ak-inset p-2 text-ak-subtle hover:text-ak-danger"><X className="h-4 w-4" /></button>
        </div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ak-muted">Nome categoria</label>
        <input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. NVR" className="w-full rounded-xl border border-ak-line bg-ak-panel px-3.5 py-2.5 text-sm text-ak-text outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
        <div className="mt-5 flex gap-2">
          {mode === 'edit' && onDelete && <button type="button" disabled={saving} onClick={async () => { setSaving(true); await onDelete(); setSaving(false) }} title="Elimina categoria" className="rounded-xl border border-ak-danger bg-ak-danger-bg px-4 text-ak-danger hover:bg-ak-danger-bg"><Trash2 className="h-4 w-4" /></button>}
          <button disabled={saving} className="flex-1 rounded-xl bg-ak-accent px-4 py-3 text-sm font-bold text-ak-text transition hover:bg-ak-accent-hover disabled:opacity-50">{saving ? 'Salvataggio...' : mode === 'edit' ? 'Salva modifiche' : 'Salva categoria'}</button>
        </div>
      </form>
    </div>
  )
}