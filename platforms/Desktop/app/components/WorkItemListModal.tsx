'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronRight, ListChecks, Package, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { checklistProgress, ChecklistEntry, installedQuantity, linkedQuantity, mismatchedQuantity, WorkUnit } from '../hooks/useWorkItems'

interface WorkItemListModalProps {
  kind: 'checklist' | 'materials'
  simple?: boolean
  title: string
  items: ChecklistEntry[]
  materials: ChecklistEntry[]
  checklist: ChecklistEntry[]
  onSave: (items: ChecklistEntry[]) => Promise<unknown> | void
  onClose: () => void
}

export default function WorkItemListModal({ kind, simple = false, title, items, materials, checklist, onSave, onClose }: WorkItemListModalProps) {
  const [draft, setDraft] = useState<ChecklistEntry[]>(items || [])
  const [newEntry, setNewEntry] = useState('')
  const [newStep, setNewStep] = useState('')
  const [activeParentId, setActiveParentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [reorderDraft, setReorderDraft] = useState<ChecklistEntry[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isMaterials = kind === 'materials'
  const heading = isMaterials ? 'Materiali' : 'Checklist'
  const activeParent = draft.find(entry => entry.id === activeParentId)
  const progress = checklistProgress(activeParent ? activeParent.steps : draft)
  const visibleEntries = activeParent ? activeParent.steps || [] : draft
  const currentMaterials = isMaterials ? draft : materials
  const currentChecklist = isMaterials ? checklist : draft
  const hasMaterialLink = (material: ChecklistEntry) =>
    linkedQuantity(currentChecklist, material.id, material.unit || 'pezzi') > 0 || mismatchedQuantity(currentChecklist, material.id, material.unit || 'pezzi') > 0

  const moveEntry = (index: number, offset: number) => {
    setReorderDraft(current => {
      if (!current || index + offset < 0 || index + offset >= current.length) return current
      const reordered = [...current]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(index + offset, 0, moved)
      return reordered
    })
  }

  const saveOrder = async () => {
    if (!reorderDraft || saving) return
    const updated = activeParent
      ? draft.map(entry => entry.id === activeParentId ? { ...entry, steps: reorderDraft } : entry)
      : reorderDraft
    setSaving(true)
    setError('')
    try {
      await onSave(updated)
      setDraft(updated)
      setReorderDraft(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossibile salvare il nuovo ordine.')
    } finally {
      setSaving(false)
    }
  }

  const updateStep = (stepId: string, changes: Partial<ChecklistEntry>) => {
    setDraft(current => current.map(entry => {
      if (entry.id !== activeParentId) return entry
      const steps = (entry.steps || []).map(step => step.id === stepId ? { ...step, ...changes } : step)
      return { ...entry, steps, done: steps.length > 0 && steps.every(step => step.done) }
    }))
  }

  const updateVisibleEntry = (entryId: string, changes: Partial<ChecklistEntry>) => {
    if (activeParent) updateStep(entryId, changes)
    else setDraft(current => current.map(entry => entry.id === entryId ? { ...entry, ...changes } : entry))
  }

  const removeStep = (stepId: string) => {
    setDraft(current => current.map(entry => {
      if (entry.id !== activeParentId) return entry
      const steps = (entry.steps || []).filter(step => step.id !== stepId)
      return { ...entry, steps, done: steps.length > 0 && steps.every(step => step.done) }
    }))
  }

  const addEntry = () => {
    if (activeParent) {
      if (!newStep.trim()) return
      setDraft(current => current.map(entry => entry.id === activeParentId ? { ...entry, done: false, steps: [...(entry.steps || []), { id: crypto.randomUUID(), text: newStep.trim(), done: false, quantity: 1, unit: 'pezzi' }] } : entry))
      setNewStep('')
    } else {
      if (!newEntry.trim()) return
      setDraft(current => [...current, { id: crypto.randomUUID(), text: newEntry.trim(), done: false, quantity: 1, unit: 'pezzi' }])
      setNewEntry('')
    }
  }

  const goBack = () => {
    if (newStep.trim()) addEntry()
    setActiveParentId(null)
    setEditingId(null)
  }

  const save = async () => {
    if (saving) return
    const updated = draft.filter(entry => entry.text.trim()).map(entry => {
      const steps = (entry.steps || []).filter(step => step.text.trim()).map(step => ({ ...step, text: step.text.trim() }))
      if (entry.id === activeParentId && newStep.trim()) steps.push({ id: crypto.randomUUID(), text: newStep.trim(), done: false, quantity: 1, unit: 'pezzi' })
      return { ...entry, text: entry.text.trim(), ...(steps.length ? { steps, done: steps.every(step => step.done) } : entry.steps ? { steps: [] } : {}) }
    })
    if (newEntry.trim()) updated.push({ id: crypto.randomUUID(), text: newEntry.trim(), done: false, quantity: 1, unit: 'pezzi' })
    setSaving(true)
    setError('')
    try {
      await onSave(updated)
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Impossibile salvare ${heading.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-sm sm:p-4" onClick={event => { event.stopPropagation(); if (!saving) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={`${heading} ${title}`} className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#fff8ed] shadow-2xl" onClick={event => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-[#ead8bf] p-5">
          <div className="min-w-0">
            <p className="ak-kicker">{title || 'Nuova lavorazione'}</p>
            {activeParent && !reorderDraft && <button type="button" onClick={goBack} className="mt-2 flex items-center gap-1 text-xs font-bold text-[#257259] hover:underline"><ArrowLeft className="h-3.5 w-3.5" />Checklist</button>}
            <h2 className="mt-1 flex items-center gap-2 break-words text-lg font-black text-[#2d2754]">{isMaterials ? <Package className="h-5 w-5 shrink-0 text-[#257259]" /> : <ListChecks className="h-5 w-5 shrink-0 text-[#257259]" />}{reorderDraft ? `Riordina ${activeParent ? activeParent.text : heading}` : activeParent ? activeParent.text : heading}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} title="Chiudi" className="shrink-0 rounded-lg p-2 text-[#716a91] hover:bg-[#f5dfca] disabled:opacity-50"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {reorderDraft ? <div className="space-y-2">
            {reorderDraft.map((entry, index) => <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-[#f8e8cf] p-2.5">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-[#716a91]">{index + 1}</span>
              <span className={`min-w-0 flex-1 break-words text-sm font-semibold ${entry.done ? 'text-[#716a91]' : 'text-[#2d2754]'}`}>{entry.text}</span>
              <button type="button" title="Sposta su" aria-label={`Sposta ${entry.text} su`} disabled={index === 0 || saving} onClick={() => moveEntry(index, -1)} className="shrink-0 rounded-lg bg-white p-2 text-[#257259] hover:bg-[#d9e8d9] disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" title="Sposta giù" aria-label={`Sposta ${entry.text} giù`} disabled={index === reorderDraft.length - 1 || saving} onClick={() => moveEntry(index, 1)} className="shrink-0 rounded-lg bg-white p-2 text-[#257259] hover:bg-[#d9e8d9] disabled:opacity-35"><ArrowDown className="h-4 w-4" /></button>
            </div>)}
          </div> : <>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-[#716a91]">{progress.done} {isMaterials ? 'utilizzati' : 'fatte'} · {progress.total - progress.done} {isMaterials ? 'da utilizzare' : 'da fare'}</span>
              <div className="flex items-center gap-3"><strong className="text-xl text-[#257259]">{progress.percent}%</strong><button type="button" disabled={visibleEntries.length < 2 || Boolean((activeParent ? newStep : newEntry).trim())} onClick={() => setReorderDraft([...visibleEntries])} className="rounded-lg border border-[#dfcdb1] px-2.5 py-1.5 text-xs font-bold text-[#2d2754] hover:bg-[#f8e8cf] disabled:opacity-40">Riordina</button></div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ead8bf]" role="progressbar" aria-label={`Avanzamento ${heading.toLowerCase()}`} aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-[#257259] transition-[width]" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          {visibleEntries.length ? <div className="space-y-2">
            {visibleEntries.map(entry => <div key={entry.id} className="space-y-2 rounded-lg bg-[#f8e8cf] p-2">
              <div className="flex items-center gap-2">
                  <input type="checkbox" checked={entry.done} disabled={isMaterials && hasMaterialLink(entry)} title={isMaterials && hasMaterialLink(entry) ? 'Utilizzo gestito dalla checklist lavorazione' : undefined} aria-label={`${isMaterials ? 'Utilizzato' : 'Completata'}: ${entry.text}`} onChange={event => activeParent ? updateStep(entry.id, { done: event.target.checked }) : setDraft(current => current.map(item => item.id === entry.id ? { ...item, done: event.target.checked, steps: item.steps?.map(step => ({ ...step, done: event.target.checked })) } : item))} className="h-4 w-4 shrink-0 accent-[#257259] disabled:opacity-70" />
                  {!isMaterials && !activeParent && editingId !== entry.id ? <button type="button" onClick={() => { setActiveParentId(entry.id); setEditingId(null) }} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#2d2754] hover:bg-white">
                    <span className={`min-w-0 break-words ${entry.done ? 'text-[#716a91] line-through' : ''}`}>{entry.text}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[#257259]">{entry.steps?.length ? `${checklistProgress(entry.steps).done}/${checklistProgress(entry.steps).total}` : ''}<ChevronRight className="h-4 w-4" /></span>
                  </button> : <input value={entry.text} aria-label={isMaterials ? 'Nome materiale' : activeParent ? 'Sottoattività' : 'Voce checklist'} onChange={event => activeParent ? updateStep(entry.id, { text: event.target.value }) : setDraft(current => current.map(item => item.id === entry.id ? { ...item, text: event.target.value } : item))} onBlur={() => setEditingId(null)} autoFocus={editingId === entry.id} className={`min-w-0 flex-1 rounded-lg border border-[#dfcdb1] bg-white px-3 py-2 text-sm text-[#2d2754] ${entry.done ? 'text-[#716a91]' : ''}`} />}
                  {!isMaterials && !activeParent && <button type="button" title="Rinomina voce" onClick={() => setEditingId(entry.id)} className="shrink-0 rounded-lg p-2 text-[#716a91] hover:bg-white"><Pencil className="h-4 w-4" /></button>}
                  <button type="button" title="Elimina voce" onClick={() => activeParent ? removeStep(entry.id) : setDraft(current => current.filter(item => item.id !== entry.id))} className="shrink-0 rounded-lg p-2 text-[#a83d35] hover:bg-[#ffd8d2]"><Trash2 className="h-4 w-4" /></button>
              </div>
              {!simple && <div className="flex flex-wrap items-center gap-2 pl-6 text-xs text-[#716a91]">
                <label className="flex items-center gap-1.5">Quantità
                  <input type="number" min={entry.unit === 'metri' ? 0.001 : 1} step={entry.unit === 'metri' ? 'any' : 1} value={entry.quantity || 1} aria-label={`Quantità ${entry.text}`} onChange={event => { const quantity = Number(event.target.value); if (quantity > 0 && (entry.unit === 'metri' ? Number.isFinite(quantity) : Number.isSafeInteger(quantity))) updateVisibleEntry(entry.id, { quantity }) }} className="w-16 rounded-lg border border-[#dfcdb1] bg-white px-2 py-1.5 text-sm text-[#2d2754]" />
                </label>
                <select value={entry.unit || 'pezzi'} aria-label={`Unità ${entry.text}`} onChange={event => { const unit = event.target.value as WorkUnit; updateVisibleEntry(entry.id, { unit, quantity: unit === 'pezzi' && !Number.isInteger(entry.quantity || 1) ? 1 : entry.quantity || 1 }) }} className="rounded-lg border border-[#dfcdb1] bg-white px-2 py-1.5 text-sm text-[#2d2754]">
                  <option value="pezzi">Pezzi</option>
                  <option value="metri">Metri</option>
                </select>
                {!isMaterials && <label className="flex min-w-0 flex-1 items-center gap-1.5">Materiale
                  <select value={entry.materialId || ''} aria-label={`Materiale per ${entry.text}`} onChange={event => { const material = currentMaterials.find(item => item.id === event.target.value); updateVisibleEntry(entry.id, { materialId: material?.id, unit: material?.unit || entry.unit || 'pezzi' }) }} className="min-w-0 flex-1 rounded-lg border border-[#dfcdb1] bg-white px-2 py-1.5 text-sm text-[#2d2754]">
                    <option value="">Nessuno</option>
                    {entry.materialId && !currentMaterials.some(material => material.id === entry.materialId) && <option value={entry.materialId}>Materiale eliminato</option>}
                    {currentMaterials.map(material => <option key={material.id} value={material.id}>{material.text} ({material.unit === 'metri' ? 'Metri' : 'Pezzi'})</option>)}
                  </select>
                </label>}
                {isMaterials ? (() => {
                  const installed = installedQuantity(currentChecklist, entry.id, entry.unit || 'pezzi')
                  const mismatched = mismatchedQuantity(currentChecklist, entry.id, entry.unit || 'pezzi')
                  const quantity = entry.quantity || 1
                  if (mismatched) return <span className="font-semibold text-[#a83d35]">{mismatched} con unità diversa · {installed}/{quantity} installati</span>
                  return Math.abs(installed - quantity) < 0.000001 ? <span className="flex items-center gap-1 font-bold text-[#257259]"><CheckCircle2 className="h-4 w-4" />{installed}/{quantity} installati</span> : <span className="font-semibold text-[#9a5b17]">{installed}/{quantity} installati · {installed < quantity ? `${Math.round((quantity - installed) * 1000) / 1000} da installare` : `${Math.round((installed - quantity) * 1000) / 1000} in eccesso`}</span>
                })() : entry.materialId && (() => {
                  const material = currentMaterials.find(item => item.id === entry.materialId)
                  if (!material) return <span className="font-semibold text-[#a83d35]">Materiale eliminato</span>
                  const installed = installedQuantity(currentChecklist, material.id, material.unit || 'pezzi')
                  const mismatched = mismatchedQuantity(currentChecklist, material.id, material.unit || 'pezzi')
                  const quantity = material.quantity || 1
                  if (mismatched) return <span className="font-semibold text-[#a83d35]">{mismatched} con unità diversa · {installed}/{quantity} installati</span>
                  return Math.abs(installed - quantity) < 0.000001 ? <span className="flex items-center gap-1 font-bold text-[#257259]"><CheckCircle2 className="h-4 w-4" />{installed}/{quantity} installati</span> : <span className="font-semibold text-[#9a5b17]">{installed}/{quantity} installati · {installed < quantity ? `${Math.round((quantity - installed) * 1000) / 1000} da installare` : `${Math.round((installed - quantity) * 1000) / 1000} in eccesso`}</span>
                })()}
              </div>}
            </div>)}
          </div> : <p className="text-sm text-[#716a91]">{isMaterials ? 'Nessun materiale inserito.' : activeParent ? 'Nessuna sottoattività inserita.' : 'Nessuna voce inserita.'}</p>}

          <div className="flex gap-2">
            <input value={activeParent ? newStep : newEntry} onChange={event => activeParent ? setNewStep(event.target.value) : setNewEntry(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addEntry() } }} aria-label={isMaterials ? 'Nuovo materiale' : activeParent ? 'Nuova sottoattività' : 'Nuova voce checklist'} placeholder={isMaterials ? 'Aggiungi un materiale...' : activeParent ? 'Aggiungi una sottoattività...' : 'Aggiungi una voce...'} className="min-w-0 flex-1 rounded-lg border border-[#dfcdb1] bg-white px-3 py-2 text-sm text-[#2d2754]" />
            <button type="button" title="Aggiungi voce" onClick={addEntry} disabled={!(activeParent ? newStep : newEntry).trim()} className="rounded-lg bg-[#257259] p-2 text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button>
          </div>
          </>}
          {error && <p role="alert" className="text-sm font-semibold text-[#a83d35]">{error}</p>}
        </div>

        <footer className="flex gap-3 border-t border-[#ead8bf] p-5">
          <button type="button" onClick={reorderDraft ? () => { setReorderDraft(null); setError('') } : onClose} disabled={saving} className="flex-1 rounded-lg bg-[#f5dfca] py-2.5 text-sm font-bold text-[#716a91] disabled:opacity-50">Annulla</button>
          <button type="button" onClick={() => void (reorderDraft ? saveOrder() : save())} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2d2754] py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Salvataggio...' : 'Salva'}</button>
        </footer>
      </div>
    </div>, document.body
  )
}