'use client'

import { Calendar, CreditCard, FileText, KeyRound, Phone, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Result = { type: string; id: string; title: string; detail: string }
const icon = { call: Phone, event: Calendar, note: FileText, payment: CreditCard, client: Users, password: KeyRound }

export default function GlobalSearchModal({ isOpen, onClose, calls, events, notes, payments, clients, passwords, onOpen }: { isOpen: boolean; onClose: () => void; calls: any[]; events: any[]; notes: any[]; payments: any[]; clients: any[]; passwords: any[]; onOpen: (type: string, item: any) => void }) {
  const [query, setQuery] = useState('')
  useEffect(() => { if (!isOpen) setQuery('') }, [isOpen])
  if (!isOpen) return null
  const q = query.trim().toLowerCase()
  const results: Result[] = q ? [
    ...calls.filter(item => `${item.caller_name} ${item.company} ${item.phone} ${item.notes}`.toLowerCase().includes(q)).map(item => ({ type: 'call', id: item.id, title: item.caller_name, detail: item.company || item.phone })),
    ...events.filter(item => `${item.title} ${item.location} ${item.description}`.toLowerCase().includes(q)).map(item => ({ type: 'event', id: item.id, title: item.title, detail: item.location || 'Evento' })),
    ...notes.filter(item => `${item.title} ${item.content} ${(item.tags || []).join(' ')}`.toLowerCase().includes(q)).map(item => ({ type: 'note', id: item.id, title: item.title, detail: item.folder || 'Nota' })),
    ...payments.filter(item => `${item.payment_type} ${item.recipient} ${item.reason}`.toLowerCase().includes(q)).map(item => ({ type: 'payment', id: item.id, title: item.payment_type, detail: item.recipient })),
    ...clients.filter(item => `${item.name} ${item.company} ${item.phone} ${item.email}`.toLowerCase().includes(q)).map(item => ({ type: 'client', id: item.id, title: item.name, detail: item.company || item.phone })),
    ...passwords.filter(item => `${item.title} ${item.username} ${item.website}`.toLowerCase().includes(q)).map(item => ({ type: 'password', id: item.id, title: item.title, detail: item.username }))
  ].slice(0, 30) : []
  const source: Record<string, any[]> = { call: calls, event: events, note: notes, payment: payments, client: clients, password: passwords }
  return <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/35 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Search className="h-5 w-5 text-[#e45f4e]" /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca in tutta AK Suite..." className="min-w-0 flex-1 text-lg outline-none" /><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div><div className="max-h-[60vh] overflow-y-auto p-3">{q && !results.length && <p className="p-6 text-center text-sm text-slate-400">Nessun risultato.</p>}{results.map(result => { const Icon = icon[result.type as keyof typeof icon]; return <button key={`${result.type}-${result.id}`} onClick={() => { onOpen(result.type, source[result.type].find(item => item.id === result.id)); onClose() }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#fff8ed]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8dfb9] text-[#e45f4e]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#2d2754]">{result.title}</strong><small className="block truncate text-xs text-[#716a91]">{result.detail}</small></span><small className="text-xs font-bold uppercase text-[#8a7f9f]">{result.type}</small></button> })}</div></div></div>
}