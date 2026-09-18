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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ddd7ff] text-[#4b3ba5]"><FolderPlus className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-800">{mode === 'edit' ? 'Modifica categoria' : 'Nuova categoria'}</h2><p className="text-xs text-slate-400">{parentName ? `Dentro ${parentName}` : 'Categoria principale'}</p></div></div>
          <button type="button" onClick={onClose} title="Chiudi" className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
        </div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">Nome categoria</label>
        <input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. NVR" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
        <div className="mt-5 flex gap-2">
          {mode === 'edit' && onDelete && <button type="button" disabled={saving} onClick={async () => { setSaving(true); await onDelete(); setSaving(false) }} title="Elimina categoria" className="rounded-xl border border-red-200 bg-red-50 px-4 text-red-500 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>}
          <button disabled={saving} className="flex-1 rounded-xl bg-[#2d2754] px-4 py-3 text-sm font-bold text-[#fff6df] transition hover:bg-[#40376f] disabled:opacity-50">{saving ? 'Salvataggio...' : mode === 'edit' ? 'Salva modifiche' : 'Salva categoria'}</button>
        </div>
      </form>
    </div>
  )
}