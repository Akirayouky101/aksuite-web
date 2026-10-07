'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { historyDates } from '@/lib/lifecycle'
import { useAuth } from '../hooks/useAuth'

type Scope = { noteId: string } | { workItemId: string; entryId?: string } | { general: true }
type Photo = { id: string; storage_path: string; file_name: string; created_at: string; url: string }
const PAGE_SIZE = 5
const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function PhotoGallery({ scope }: { scope: Scope }) {
  const { user: signedInUser } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)
  const [more, setMore] = useState(false)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [preview, setPreview] = useState<Photo | null>(null)
  const busyRef = useRef(false)
  const previewPanel = useRef<HTMLDivElement>(null)
  const generation = useRef(0)
  const loadedOwner = useRef<string | null>(null)
  const cursor = useRef<{ time: string; id: string } | null>(null)
  const criteria = useRef({ name: '', from: '', until: '' })
  const scopeKey = 'noteId' in scope ? `note:${scope.noteId}` : 'workItemId' in scope ? `work:${scope.workItemId}:${scope.entryId || ''}` : 'general'
  useEffect(() => {
    generation.current++
    setPhotos([]); setStarted(false); setMore(false); setError(''); setPreview(null)
    cursor.current = null
    return () => { generation.current++ }
  }, [scopeKey, signedInUser?.id])
  useEffect(() => {
    if (!preview) return
    const previousFocus = document.activeElement
    const panel = previewPanel.current
    panel?.querySelector<HTMLButtonElement>('button')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setPreview(null) }
      if (event.key !== 'Tab' || !panel) return
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('button,a[href]'))
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); if (previousFocus instanceof HTMLElement) previousFocus.focus() }
  }, [preview])

  async function load(next = false, reset = false) {
    if (!signedInUser) throw new Error('Accedi per consultare le foto.')
    const currentGeneration = generation.current
    const input = next || reset ? criteria.current : { name: name.trim(), from, until }
    const dates = historyDates(input.from, input.until)
    let query = supabase.from('photo_assets').select('id,storage_path,file_name,created_at')
    if ('noteId' in scope) query = query.eq('note_id', scope.noteId)
    if ('workItemId' in scope) {
      query = query.eq('work_item_id', scope.workItemId)
      query = scope.entryId ? query.eq('checklist_entry_id', scope.entryId) : query.is('checklist_entry_id', null)
    }
    if (input.name) query = query.ilike('file_name', `%${input.name.replace(/[%_\\]/g, '\\$&')}%`)
    if (dates.start) query = query.gte('created_at', dates.start)
    if (dates.end) query = query.lte('created_at', dates.end)
    const last = next ? cursor.current : null
    if (last) query = query.or(`created_at.lt.${last.time},and(created_at.eq.${last.time},id.lt.${last.id})`)
    const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE + 1)
    if (error) throw error
    const rows = (data || []).slice(0, PAGE_SIZE)
    const signed = await Promise.all(rows.map(async item => {
      const { data, error } = await supabase.storage.from('photos').createSignedUrl(item.storage_path, 3600)
      if (error) throw error
      return { ...item, url: data.signedUrl }
    }))
    if (generation.current !== currentGeneration) return
    loadedOwner.current = signedInUser.id
    setPhotos(current => next ? [...current, ...signed] : signed)
    setStarted(true); setMore((data?.length || 0) > PAGE_SIZE)
    const tail = rows[rows.length - 1]
    cursor.current = tail ? { time: tail.created_at, id: tail.id } : null
    criteria.current = input
  }

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { await action() }
    catch (cause) { console.error('Photo gallery failed:', cause); setError(cause instanceof Error ? cause.message : 'Operazione foto non riuscita. Riprova.') }
    finally { setBusy(false); busyRef.current = false }
  }
  async function upload(files: File[]) {
    for (const file of files) {
      if (!validTypes.has(file.type)) throw new Error('Usa foto JPEG, PNG o WebP. Converti le foto HEIC prima di caricarle.')
      if (!file.size || file.size > 10485760) throw new Error('Ogni foto deve avere una dimensione tra 1 byte e 10 MB.')
      if (file.name.length > 255) throw new Error('Il nome del file supera 255 caratteri.')
    }
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('Accedi per caricare foto.')
    for (const file of files) {
      const id = crypto.randomUUID()
      const path = `${user.id}/${id}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError
      const { error: metadataError } = await supabase.from('photo_assets').insert({
        id, user_id: user.id, storage_path: path, file_name: file.name, content_type: file.type, size_bytes: file.size,
        note_id: 'noteId' in scope ? scope.noteId : null,
        work_item_id: 'workItemId' in scope ? scope.workItemId : null,
        checklist_entry_id: 'workItemId' in scope ? scope.entryId || null : null,
      })
      if (metadataError) {
        const { error: cleanupError } = await supabase.storage.from('photos').remove([path])
        if (cleanupError) throw new Error(`Salvataggio foto fallito e pulizia non riuscita: ${path}. Contatta l’assistenza.`)
        throw metadataError
      }
    }
    await load(false, true)
  }
  async function remove(photo: Photo) {
    if (!window.confirm(`Eliminare definitivamente la foto "${photo.file_name}"?`)) return
    const { error } = await supabase.storage.from('photos').remove([photo.storage_path])
    if (error) throw error
    const { error: metadataError } = await supabase.from('photo_assets').delete().eq('id', photo.id).select('id').single()
    if (metadataError) throw metadataError
    setPreview(null)
    await load(false, true)
  }

  return <section className="my-4 space-y-3 rounded-xl border border-ak-line p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Galleria foto</h3>
      <label className={`rounded-lg border bg-ak-success-bg px-3 py-2 text-sm font-bold ${busy ? 'opacity-50' : 'cursor-pointer'}`}>
        Aggiungi foto<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} className="hidden" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ''; if (files.length) void run(() => upload(files)) }} />
      </label>
    </div>
    <p className="text-xs text-ak-muted">Foto private su Supabase, JPEG/PNG/WebP, massimo 10 MB. Caricamento su richiesta, 5 alla volta.</p>
    {'general' in scope && <div className="flex flex-wrap gap-2">
      <input aria-label="Nome foto" placeholder="Cerca nome foto" value={name} onChange={event => setName(event.target.value)} className="min-w-0 rounded-lg border p-2" />
      <label className="text-xs">Dal<input type="date" value={from} onChange={event => setFrom(event.target.value)} className="block rounded-lg border p-2" /></label>
      <label className="text-xs">Al<input type="date" value={until} onChange={event => setUntil(event.target.value)} className="block rounded-lg border p-2" /></label>
    </div>}
    <button type="button" disabled={busy} onClick={() => void run(() => load())} className="rounded-lg border px-3 py-2 text-sm">{busy ? 'Caricamento...' : started ? 'Aggiorna / cerca' : 'Carica foto'}</button>
    {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(loadedOwner.current === signedInUser?.id ? photos : []).map(photo => <article key={photo.id} className="min-w-0 rounded-lg border p-2">
      <button type="button" onClick={() => setPreview(photo)} className="w-full"><img loading="lazy" src={photo.url} alt={photo.file_name} className="h-28 w-full rounded-lg object-cover" onError={() => setError('Anteprima non disponibile o scaduta. Aggiorna la galleria.')} /></button>
      <p className="truncate text-xs">{photo.file_name}</p><button type="button" disabled={busy} onClick={() => void run(() => remove(photo))} className="mt-1 text-xs text-ak-danger">Elimina</button>
    </article>)}</div>
    {started && !photos.length && <p className="text-sm">Nessuna foto trovata.</p>}
    {more && <button type="button" disabled={busy} onClick={() => void run(() => load(true))} className="rounded-lg border p-2 text-sm">Carica altre 5</button>}
    {preview && loadedOwner.current === signedInUser?.id && createPortal(<div ref={previewPanel} role="dialog" aria-modal="true" aria-label="Anteprima foto" className="ak-photo-preview fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-black/90 p-5" onClick={() => setPreview(null)}>
      <button type="button" className="rounded-lg bg-ak-panel p-3" onClick={() => setPreview(null)}>Chiudi</button>
      <img src={preview.url} alt={preview.file_name} className="max-h-[75vh] max-w-full object-contain" onClick={event => event.stopPropagation()} />
      <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-white underline">Apri foto originale</a>
    </div>, document.body)}
  </section>
}
