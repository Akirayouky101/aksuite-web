'use client'

import { X } from 'lucide-react'

export default function SearchResultSummaryModal({ result, onClose, onOpen }: { result: { type: string; item: any } | null; onClose: () => void; onOpen: () => void }) {
  if (!result) return null
  const { type, item } = result
  const title = type === 'call' ? item.caller_name : type === 'payment' ? item.payment_type : type === 'client' ? item.name : item.title
  const detail = type === 'todo' ? item.description || item.notes || 'Attività completata' : type === 'call' ? item.notes || item.phone : type === 'payment' ? `${item.recipient} · ${item.reason || 'Nessuna causale'}` : type === 'client' ? `${item.company || 'Contatto privato'} · ${item.phone || item.email || ''}` : type === 'note' ? item.content || 'Nessun contenuto' : type === 'event' ? item.description || item.location || 'Nessun dettaglio' : item.username || item.website || ''
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="ak-kicker">Riepilogo {type}</p><h2 className="mt-2 text-2xl font-black text-[#2d2754]">{title}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-[#716a91]"><X className="h-4 w-4" /></button></div><p className="mt-5 rounded-xl bg-[#fff8ed] p-4 text-sm leading-6 text-[#514b70]">{detail}</p><button onClick={onOpen} className="mt-5 w-full rounded-xl bg-[#2d2754] py-3 text-sm font-bold text-white">Apri versione completa</button></div></div>
}