'use client'

import { CalendarClock, CreditCard, Phone, X } from 'lucide-react'

export interface AgendaItem {
  kind: 'call' | 'event' | 'payment' | 'advance'
  item: any
  date?: string
  detail?: string
}

interface AgendaSummaryModalProps {
  item: AgendaItem | null
  onClose: () => void
  onOpenFull: (item: AgendaItem) => void
}

const iconByKind = { call: Phone, event: CalendarClock, payment: CreditCard, advance: CreditCard }
const labelByKind = { call: 'Richiamo', event: 'Evento calendario', payment: 'Pagamento', advance: 'Anticipo da recuperare' }

export default function AgendaSummaryModal({ item, onClose, onOpenFull }: AgendaSummaryModalProps) {
  if (!item) return null
  const Icon = iconByKind[item.kind]
  const title = item.kind === 'call' ? item.item.caller_name : item.item.payment_type || item.item.title
  const date = item.date ? new Date(item.date).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  const description = item.kind === 'call' ? item.item.notes || item.item.company || 'Nessuna nota aggiunta.' : item.kind === 'event' ? item.item.description || item.item.location || 'Nessun dettaglio aggiunto.' : item.kind === 'advance' ? `${item.item.payer} deve restituire ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.item.amount)}` : item.item.reason || `A ${item.item.recipient}`

  return <div className="ak-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-ak-inset/35 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-md rounded-2xl bg-ak-panel p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ak-inset text-ak-danger"><Icon className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-ak-subtle">{labelByKind[item.kind]}</p><h2 className="mt-1 text-xl font-black text-ak-text">{title}</h2></div></div><button onClick={onClose} title="Chiudi" className="rounded-lg p-2 text-ak-muted hover:bg-ak-inset"><X className="h-4 w-4" /></button></div>
      <div className="mt-5 space-y-3 rounded-xl bg-ak-panel p-4"><p className="text-sm leading-6 text-ak-muted">{description}</p>{item.detail && <p className="text-xs font-bold text-ak-muted">{item.detail}</p>}{date && <p className="text-xs font-bold text-ak-danger">{date}</p>}</div>
      <button onClick={() => onOpenFull(item)} className="mt-5 w-full rounded-xl bg-ak-accent py-3 text-sm font-bold text-white">Apri versione completa</button>
    </div>
  </div>
}