'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Download, Loader2, Pencil, Plus, Share2, ShoppingCart, Trash2, X } from 'lucide-react'
import { ShoppingItem, ShoppingItemInput, isShoppingUnit, shoppingPdfFilename, shoppingProgress, shoppingQuantity } from '@/lib/shopping'
import { useShopping } from '../hooks/useShopping'
import { createShoppingPdf } from './shoppingPdf'

type ShoppingData = ReturnType<typeof useShopping>
type ListEditor = { id: string | null; title: string }
type ProductEditor = { id: string | null; listId: string; input: ShoppingItemInput }
type DeleteTarget = { kind: 'list' | 'item'; id: string; title: string }
const inputClass = 'w-full rounded-xl border border-[#ead8bf] bg-white px-3 py-2.5 text-sm text-[#2d2754] focus:border-[#257259] focus:outline-none'
const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#ead8bf] px-3 py-2.5 text-sm font-bold disabled:opacity-50'

export default function ShoppingWorkspace({ data }: { data: ShoppingData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listEditor, setListEditor] = useState<ListEditor | null>(null)
  const [productEditor, setProductEditor] = useState<ProductEditor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const operationInFlight = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!deleteTarget) return
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLButtonElement>('button')?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !operationInFlight.current) setDeleteTarget(null)
      if (event.key !== 'Tab') return
      const buttons = dialog?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      if (!buttons?.length) { event.preventDefault(); return }
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [deleteTarget])
  const selected = data.lists.find(list => list.id === selectedId) ?? data.lists[0]
  const listItems = data.items.filter(item => item.list_id === selected?.id)
  const progress = shoppingProgress(listItems)
  const unavailable = busy || data.loading || !!data.errorMessage
  const filtered = [...listItems]
    .filter(item => filter === 'all' || (filter === 'purchased' ? item.purchased : !item.purchased))
    .filter(item => `${item.name} ${shoppingQuantity(item)} ${item.notes}`.toLocaleLowerCase('it').includes(query.trim().toLocaleLowerCase('it')))
    .sort((a, b) => Number(a.purchased) - Number(b.purchased))

  async function perform(action: () => Promise<void>) {
    if (operationInFlight.current) return
    operationInFlight.current = true
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (cause) {
      console.error('Shopping action failed:', cause)
      setError(cause instanceof Error ? cause.message : 'Operazione non riuscita. Verifica la connessione e riprova.')
    } finally {
      operationInFlight.current = false
      setBusy(false)
    }
  }

  function selectList(id: string) {
    setSelectedId(id)
    setProductEditor(null)
    setListEditor(null)
    setQuery('')
    setFilter('all')
    setError(null)
    setNotice(null)
  }

  function editProduct(item?: ShoppingItem) {
    if (!selected) return
    setProductEditor({
      id: item?.id ?? null,
      listId: selected.id,
      input: { name: item?.name ?? '', quantity_value: item ? item.quantity_value : 1, quantity_unit: item?.quantity_unit ?? 'pezzi', notes: item?.notes ?? '' },
    })
    setListEditor(null)
    setError(null)
  }

  function download(file: File) {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Allow the browser to start the download before releasing the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  function exportPdf(share: boolean) {
    if (!selected) return
    void perform(async () => {
      const file = new File([createShoppingPdf(selected, listItems)], shoppingPdfFilename(selected.title), { type: 'application/pdf' })
      if (share && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setNotice('PDF condiviso.')
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === 'AbortError') {
            setNotice('Condivisione annullata.')
            return
          }
          throw cause
        }
      } else {
        download(file)
        setNotice(share
          ? 'Condivisione diretta non disponibile in questo browser. PDF scaricato: allegalo a WhatsApp, Telegram o email.'
          : 'PDF scaricato: puoi allegarlo a WhatsApp, Telegram o email.')
      }
    })
  }

  return (
    <section className="ak-workspace" aria-label="Lista della spesa" aria-busy={busy || data.loading}>
      <header className="ak-workspace-head">
        <div>
          <p className="ak-kicker">Le tue liste personali</p>
          <h2>Spesa</h2>
          <p>Prodotti, quantità e note. Condividi una copia PDF quando vuoi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || data.loading || !!listEditor || !!productEditor} onClick={data.reload} className={secondaryClass}>Aggiorna</button>
          <button disabled={unavailable} onClick={() => { setListEditor({ id: null, title: '' }); setProductEditor(null) }} className="ak-primary-action disabled:opacity-50"><Plus className="h-4 w-4" />Nuova lista</button>
        </div>
      </header>

      {(error || data.errorMessage) && <div role="alert" className="my-4 rounded-xl border border-[#f0c7b5] bg-[#fff0e9] p-3 text-sm text-[#a83d35]">{error || data.errorMessage}{data.errorMessage && <button disabled={busy || data.loading} onClick={data.reload} className="ml-3 font-bold underline">Riprova</button>}</div>}
      {notice && <p role="status" className="my-4 rounded-xl bg-[#d9e8d9] p-3 text-sm text-[#257259]">{notice}</p>}

      {listEditor && (
        <form onSubmit={event => {
          event.preventDefault()
          const editor = listEditor
          void perform(async () => {
            if (editor.id) await data.renameList(editor.id, editor.title)
            else {
              const list = await data.createList(editor.title)
              setSelectedId(list.id)
              setQuery('')
              setFilter('all')
            }
            setListEditor(null)
          })
        }} className="my-4 rounded-2xl border border-[#ead8bf] bg-[#fff8ed] p-4">
          <label className="block text-sm font-bold" htmlFor="shopping-list-title">{listEditor.id ? 'Rinomina lista' : 'Nome della nuova lista'}</label>
          <input id="shopping-list-title" autoFocus required maxLength={120} disabled={busy} value={listEditor.title} onChange={event => setListEditor({ ...listEditor, title: event.target.value })} placeholder="Es. Spesa della settimana" className={`${inputClass} mt-2`} />
          <div className="mt-3 flex gap-2"><button disabled={unavailable} className="ak-primary-action disabled:opacity-50">Salva lista</button><button type="button" disabled={busy} onClick={() => setListEditor(null)} className={secondaryClass}>Annulla</button></div>
        </form>
      )}

      {data.loading ? <p role="status" className="py-12 text-center text-[#716a91]">Caricamento spesa...</p> : !data.lists.length ? (
        !data.errorMessage && <div className="py-12 text-center"><ShoppingCart className="mx-auto mb-4 h-10 w-10 text-[#257259]" /><h3 className="text-xl font-black">La tua spesa, in ordine</h3><p className="mt-2 text-sm text-[#716a91]">Crea una lista e aggiungi i primi prodotti. Le checklist esistenti rimangono in Cose da fare.</p></div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Le tue liste della spesa" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col">
            {data.lists.map(list => {
              const count = shoppingProgress(data.items.filter(item => item.list_id === list.id))
              return <button key={list.id} disabled={busy} onClick={() => selectList(list.id)} aria-current={selected?.id === list.id ? 'true' : undefined} className={`min-w-[170px] rounded-xl border p-3 text-left disabled:opacity-50 ${selected?.id === list.id ? 'border-[#257259] bg-[#d9e8d9]' : 'border-[#ead8bf] bg-[#fff8ed]'}`}><span className="block break-words font-bold">{list.title}</span><span className="mt-1 block text-xs text-[#716a91]">{count.remaining} da acquistare · {count.purchased}/{count.total}</span></button>
            })}
          </nav>

          {selected && <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="break-words text-2xl font-black">{selected.title}</h3><p className="mt-1 text-sm text-[#716a91]">{progress.purchased} di {progress.total} acquistati{progress.total > 0 && progress.remaining === 0 ? ' · Spesa completata!' : ''}</p></div>
              <div className="flex flex-wrap gap-2">
                <button disabled={unavailable} onClick={() => { setListEditor({ id: selected.id, title: selected.title }); setProductEditor(null) }} aria-label="Rinomina lista" className={secondaryClass}><Pencil className="h-4 w-4" /></button>
                <button disabled={unavailable} onClick={() => setDeleteTarget({ kind: 'list', id: selected.id, title: selected.title })} aria-label="Elimina lista" className={secondaryClass}><Trash2 className="h-4 w-4" /></button>
                <button disabled={unavailable} onClick={() => exportPdf(false)} className={secondaryClass}><Download className="h-4 w-4" />PDF</button>
                <button disabled={unavailable} onClick={() => exportPdf(true)} className={secondaryClass}><Share2 className="h-4 w-4" />Condividi PDF</button>
              </div>
            </div>
            <div role="progressbar" aria-label="Prodotti acquistati" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} className="mt-3 h-2 overflow-hidden rounded-full bg-[#ead8bf]"><div className="h-full bg-[#257259] transition-all" style={{ width: `${progress.percent}%` }} /></div>
            <div className="my-4 flex flex-wrap gap-2">
              <button disabled={unavailable} onClick={() => editProduct()} className="ak-primary-action disabled:opacity-50"><Plus className="h-4 w-4" />Aggiungi prodotto</button>
              {(['all', 'pending', 'purchased'] as const).map(value => <button key={value} disabled={busy} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${secondaryClass} ${filter === value ? 'bg-[#d9e8d9]' : ''}`}>{value === 'all' ? 'Tutti' : value === 'pending' ? 'Da acquistare' : 'Acquistati'}</button>)}
            </div>
            <label className="sr-only" htmlFor="shopping-search">Cerca prodotti nella lista</label>
            <input id="shopping-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca prodotti o note" className={inputClass} />

            {productEditor?.listId === selected.id && <form onSubmit={event => {
              event.preventDefault()
              const editor = productEditor
              void perform(async () => {
                if (editor.id) await data.updateItem(editor.id, editor.input)
                else await data.addItem(editor.listId, editor.input)
                setProductEditor(null)
              })
            }} className="mt-4 rounded-xl border border-[#9aba9c] bg-[#fff8ed] p-4">
              <div className="mb-3 flex items-center justify-between"><h4 className="font-bold">{productEditor.id ? 'Modifica prodotto' : 'Nuovo prodotto'}</h4><button type="button" disabled={busy} aria-label="Chiudi modulo prodotto" onClick={() => setProductEditor(null)}><X className="h-5 w-5" /></button></div>
              <label className="block text-sm font-bold" htmlFor="shopping-product-name">Prodotto</label>
              <input id="shopping-product-name" autoFocus required maxLength={160} disabled={busy} value={productEditor.input.name} onChange={event => setProductEditor({ ...productEditor, input: { ...productEditor.input, name: event.target.value } })} className={`${inputClass} mt-1`} placeholder="Es. Latte" />
              {productEditor.id && listItems.find(item => item.id === productEditor.id)?.quantity_value == null && <p className="mt-3 text-sm text-[#716a91]">Quantità precedente: {listItems.find(item => item.id === productEditor.id)?.quantity || 'non indicata'}. Inserisci il numero e scegli l&apos;unità prima di salvare.</p>}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold" htmlFor="shopping-product-quantity">Quantità</label>
                  <input id="shopping-product-quantity" type="number" inputMode="decimal" required min="0.001" max="999999999" step="0.001" disabled={busy} value={productEditor.input.quantity_value ?? ''} onChange={event => setProductEditor({ ...productEditor, input: { ...productEditor.input, quantity_value: event.target.value === '' ? null : event.target.valueAsNumber } })} className={`${inputClass} mt-1`} placeholder="Es. 500" />
                </div>
                <div>
                  <label className="block text-sm font-bold" htmlFor="shopping-product-unit">Unità</label>
                  <select id="shopping-product-unit" disabled={busy} value={productEditor.input.quantity_unit} onChange={event => { const unit = event.target.value; if (isShoppingUnit(unit)) setProductEditor({ ...productEditor, input: { ...productEditor.input, quantity_unit: unit } }) }} className={`${inputClass} mt-1`}>
                    <option value="pezzi">Pezzi</option><option value="g">Grammi (g)</option><option value="kg">Chilogrammi (kg)</option><option value="ml">Millilitri (ml)</option><option value="l">Litri (l)</option>
                  </select>
                </div>
              </div>
              <label className="mt-3 block text-sm font-bold" htmlFor="shopping-product-notes">Note (facoltative)</label>
              <textarea id="shopping-product-notes" maxLength={1000} rows={3} disabled={busy} value={productEditor.input.notes} onChange={event => setProductEditor({ ...productEditor, input: { ...productEditor.input, notes: event.target.value } })} className={`${inputClass} mt-1`} placeholder="Marca, alternativa o dettagli" />
              <div className="mt-3 flex gap-2"><button disabled={unavailable} className="ak-primary-action disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Salva prodotto</button><button type="button" disabled={busy} onClick={() => setProductEditor(null)} className={secondaryClass}>Annulla</button></div>
            </form>}

            <div className="mt-4 space-y-2">
              {filtered.map(item => <article key={item.id} className={`flex items-start gap-3 rounded-xl border border-[#ead8bf] p-3 ${item.purchased ? 'bg-[#eef3e9]' : 'bg-[#fff8ed]'}`}>
                <label className="mt-1 flex shrink-0 cursor-pointer items-center"><input type="checkbox" disabled={unavailable} checked={item.purchased} onChange={event => { const purchased = event.target.checked; void perform(() => data.updateItem(item.id, { purchased })) }} aria-label={`${item.purchased ? 'Segna da acquistare' : 'Segna acquistato'}: ${item.name}`} className="h-5 w-5 accent-[#257259]" /></label>
                <div className="min-w-0 flex-1"><h4 className={`break-words font-bold ${item.purchased ? 'text-[#716a91] line-through' : ''}`}>{item.name}</h4>{shoppingQuantity(item) && <p className="mt-1 break-words text-sm font-semibold text-[#257259]">{shoppingQuantity(item)}</p>}{item.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#716a91]">{item.notes}</p>}{item.purchased && <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#257259]"><Check className="h-3 w-3" />Acquistato</span>}</div>
                <button disabled={unavailable} onClick={() => editProduct(item)} aria-label={`Modifica ${item.name}`} className="rounded-lg p-2 hover:bg-[#f5dfca] disabled:opacity-50"><Pencil className="h-4 w-4" /></button>
                <button disabled={unavailable} onClick={() => setDeleteTarget({ kind: 'item', id: item.id, title: item.name })} aria-label={`Elimina ${item.name}`} className="rounded-lg p-2 hover:bg-[#ffd8d2] disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
              </article>)}
              {!filtered.length && <p className="py-8 text-center text-sm text-[#716a91]">{!listItems.length ? 'La lista è vuota. Aggiungi il primo prodotto.' : 'Nessun prodotto corrisponde ai filtri.'}</p>}
            </div>
          </div>}
        </div>
      )}

      {deleteTarget && <div role="alertdialog" aria-modal="true" aria-labelledby="shopping-delete-title" aria-describedby="shopping-delete-description" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2d2754]/40 p-4">
        <div ref={dialogRef} className="w-full max-w-md rounded-2xl bg-[#fff8ed] p-6 shadow-xl">
          <h3 id="shopping-delete-title" className="text-xl font-black">Elimina {deleteTarget.kind === 'list' ? 'lista' : 'prodotto'}</h3>
          <p id="shopping-delete-description" className="mt-3 break-words text-sm text-[#716a91]">Eliminare «{deleteTarget.title}»? {deleteTarget.kind === 'list' ? 'Verranno eliminati anche tutti i suoi prodotti. ' : ''}L&apos;operazione non può essere annullata.</p>
          {error && <p role="alert" className="mt-3 text-sm text-[#a83d35]">{error}</p>}
          <div className="mt-5 flex gap-2"><button autoFocus disabled={busy} onClick={() => setDeleteTarget(null)} className={secondaryClass}>Annulla</button><button disabled={unavailable} onClick={() => {
            const target = deleteTarget
            void perform(async () => {
              if (target.kind === 'list') await data.deleteList(target.id)
              else await data.deleteItem(target.id)
              setDeleteTarget(null)
              setProductEditor(null)
              setListEditor(null)
            })
          }} className="rounded-xl bg-[#a83d35] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Eliminazione...' : 'Elimina'}</button></div>
        </div>
      </div>}
    </section>
  )
}
