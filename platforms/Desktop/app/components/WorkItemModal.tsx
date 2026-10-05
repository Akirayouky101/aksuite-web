'use client'

import { useEffect, useState } from 'react'
import { Briefcase, ListChecks, Package, Save, X } from 'lucide-react'
import { Client } from '../hooks/useClients'
import { checklistProgress, synchronizeMaterialUsage, WorkItem, WorkItemInput, WorkKind, WorkPriority, WorkStatus } from '../hooks/useWorkItems'
import DateTimePicker, { localDateTimeToIso } from './DateTimePicker'
import WorkItemListModal from './WorkItemListModal'
import DictationButton from './DictationButton'

interface WorkItemModalProps {
  isOpen: boolean
  clients: Client[]
  mode?: WorkKind
  defaultClientId?: string | null
  editingWorkItem?: WorkItem | null
  onClose: () => void
  onSave: (data: WorkItemInput) => Promise<unknown>
}

const emptyForm: WorkItemInput = {
  kind: 'work',
  client_id: null,
  title: '',
  description: '',
  status: 'planned',
  priority: 'normal',
  scheduled_at: null,
  due_date: null,
  next_action: '',
  notes: '',
  checklist: [],
  materials: [],
}

export default function WorkItemModal({ isOpen, clients, mode = 'work', defaultClientId, editingWorkItem, onClose, onSave }: WorkItemModalProps) {
  const [form, setForm] = useState<WorkItemInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeList, setActiveList] = useState<'checklist' | 'materials' | null>(null)
  const setValue = <K extends keyof WorkItemInput>(key: K, value: WorkItemInput[K]) => setForm(current => ({ ...current, [key]: value }))

  useEffect(() => {
    setError('')
    setActiveList(null)
    setForm(editingWorkItem ? {
      kind: editingWorkItem.kind || mode,
      client_id: editingWorkItem.client_id,
      title: editingWorkItem.title,
      description: editingWorkItem.description,
      status: editingWorkItem.status,
      priority: editingWorkItem.priority,
      scheduled_at: editingWorkItem.scheduled_at,
      due_date: editingWorkItem.due_date,
      next_action: editingWorkItem.next_action,
      notes: editingWorkItem.notes,
      checklist: editingWorkItem.checklist || [],
      materials: editingWorkItem.materials || [],
    } : { ...emptyForm, kind: mode, client_id: defaultClientId || null })
  }, [editingWorkItem, isOpen, defaultClientId, mode])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, title: form.title.trim() })
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossibile salvare la lavorazione.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-2 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-[#fff8ed] shadow-2xl" onClick={event => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[#ead8bf] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9e8d9] text-[#257259]"><Briefcase className="h-5 w-5" /></span>
            <div><h2 className="font-black text-[#2d2754]">{mode === 'todo' ? editingWorkItem ? 'Modifica cosa da fare' : 'Nuova cosa da fare' : editingWorkItem ? 'Modifica lavorazione' : 'Nuova lavorazione'}</h2><p className="text-xs text-[#716a91]">{mode === 'todo' ? 'Attività personali e checklist' : 'Cliente, stato e prossimo passo'}</p></div>
          </div>
          <button onClick={onClose} title="Chiudi" className="rounded-lg p-2 text-[#716a91] hover:bg-[#f5dfca]"><X className="h-4 w-4" /></button>
        </header>

        <form onSubmit={submit} className="max-h-[78vh] space-y-4 overflow-y-auto p-5">
          <Field label={mode === 'todo' ? 'Cosa devi fare *' : 'Nome del lavoro *'} value={form.title} onChange={value => setValue('title', value)} placeholder={mode === 'todo' ? 'Es. Contattare Pietro' : 'Es. Ristrutturazione cucina'} />
          <label className="block text-xs font-semibold text-[#716a91]">Cliente
            <select value={form.client_id || ''} onChange={event => setValue('client_id', event.target.value || null)} className="mt-1 w-full rounded-xl border border-[#dfcdb1] bg-[#f8e8cf] px-3.5 py-3 text-sm text-[#2d2754]">
              <option value="">Nessun cliente collegato</option>
              {clients.map(client => {
                const parent = clients.find(candidate => candidate.id === client.parent_client_id)
                const company = client.company?.trim()
                return <option key={client.id} value={client.id}>{parent ? `${parent.name} › ` : ''}{client.name}{company && company.localeCompare(client.name.trim(), 'it', { sensitivity: 'base' }) !== 0 ? ` · ${company}` : ''}</option>
              })}
            </select>
          </label>
          <Field label="Descrizione" value={form.description} onChange={value => setValue('description', value)} placeholder="Cosa c'è da fare?" />

          <div className={`grid gap-3 border-y border-[#ead8bf] py-3 ${mode === 'todo' ? '' : 'grid-cols-2'}`}>
            <button type="button" onClick={() => setActiveList('checklist')} className="flex min-w-0 items-center gap-2 rounded-lg border border-[#dfcdb1] bg-[#f8e8cf] px-3 py-3 text-left text-sm font-bold text-[#2d2754] hover:border-[#257259]">
              <ListChecks className="h-4 w-4 shrink-0 text-[#257259]" /><span className="min-w-0 flex-1">Checklist</span><span className="text-xs text-[#257259]">{checklistProgress(form.checklist).percent}%</span>
            </button>
            {mode !== 'todo' && <button type="button" onClick={() => setActiveList('materials')} className="flex min-w-0 items-center gap-2 rounded-lg border border-[#dfcdb1] bg-[#f8e8cf] px-3 py-3 text-left text-sm font-bold text-[#2d2754] hover:border-[#257259]">
              <Package className="h-4 w-4 shrink-0 text-[#257259]" /><span className="min-w-0 flex-1">Materiali</span><span className="text-xs text-[#257259]">{checklistProgress(form.materials).total}</span>
            </button>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#716a91]">Stato
              <select value={form.status} onChange={event => setValue('status', event.target.value as WorkStatus)} className="mt-1 w-full rounded-xl border border-[#dfcdb1] bg-[#f8e8cf] px-3.5 py-3 text-sm text-[#2d2754]">
                <option value="planned">{mode === 'todo' ? 'Da fare' : 'Da pianificare'}</option>{mode !== 'todo' && <><option value="in_progress">In corso</option><option value="waiting">In attesa</option></>}<option value="completed">Completata</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#716a91]">Priorità
              <select value={form.priority} onChange={event => setValue('priority', event.target.value as WorkPriority)} className="mt-1 w-full rounded-xl border border-[#dfcdb1] bg-[#f8e8cf] px-3.5 py-3 text-sm text-[#2d2754]">
                <option value="low">Bassa</option><option value="normal">Normale</option><option value="high">Alta</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#716a91]">Scadenza
              <DateTimePicker mode="date" value={form.due_date || ''} onChange={value => setValue('due_date', value || null)} placeholder="Nessuna scadenza" clearable />
            </label>
            <label className="block text-xs font-semibold text-[#716a91]">Appuntamento
              <DateTimePicker mode="datetime" value={form.scheduled_at || ''} onChange={value => setValue('scheduled_at', value ? localDateTimeToIso(value) : null)} placeholder="Nessun appuntamento" clearable />
            </label>
          </div>

          <Field label="Prossima azione" value={form.next_action} onChange={value => setValue('next_action', value)} placeholder="Es. richiamare il cliente per confermare" />
          <label className="block text-xs font-semibold text-[#716a91]">Note
            <textarea value={form.notes} onChange={event => setValue('notes', event.target.value)} rows={3} placeholder="Dettagli utili da ritrovare al volo" className="mt-1 w-full resize-y rounded-xl border border-[#dfcdb1] bg-[#f8e8cf] px-3.5 py-3 text-sm text-[#2d2754]" />
          </label>
          <DictationButton label="Detta note lavorazione" onText={text => setForm(current => ({ ...current, notes: `${current.notes}${current.notes ? ' ' : ''}${text}` }))} />
          {error && <p role="alert" className="text-sm font-semibold text-[#a83d35]">{error}</p>}
          <footer className="flex gap-3 border-t border-[#ead8bf] pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-[#f5dfca] py-3 text-sm font-bold text-[#716a91]">Annulla</button>
            <button type="submit" disabled={saving || !form.title.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2d2754] py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Salvataggio...' : mode === 'todo' ? 'Salva attività' : 'Salva lavorazione'}</button>
          </footer>
        </form>
      </div>
      {activeList && <WorkItemListModal key={activeList} kind={activeList} simple={mode === 'todo'} title={form.title} items={form[activeList]} materials={form.materials} checklist={form.checklist} onSave={items => setForm(current => {
        const checklist = activeList === 'checklist' ? items : current.checklist
        const materials = activeList === 'materials' ? items : current.materials
        return { ...current, checklist, materials: synchronizeMaterialUsage(materials, checklist, current.checklist) }
      })} onClose={() => setActiveList(null)} />}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block text-xs font-semibold text-[#716a91]">{label}<input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-[#dfcdb1] bg-[#f8e8cf] px-3.5 py-3 text-sm text-[#2d2754]" /></label>
}