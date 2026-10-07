'use client'

import { Bell, Briefcase, Calendar, CheckCircle2, CreditCard, FileText, Phone } from 'lucide-react'
import { Client } from '../hooks/useClients'
import { WorkItem } from '../hooks/useWorkItems'
import { paymentRemainingAmount } from '../hooks/usePayments'

type TodayItem = { id: string; type: 'call' | 'event' | 'note' | 'payment' | 'work_item'; title: string; detail: string; at: Date }

export default function TodayWorkspace({ calls, events, notes, payments, workItems, clients, onOpen }: { calls: any[]; events: any[]; notes: any[]; payments: any[]; workItems: WorkItem[]; clients: Client[]; onOpen: (type: string, item: any) => void }) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(start); end.setDate(end.getDate() + 1); end.setHours(23, 59, 59, 999)
  const within = (value?: string | null) => Boolean(value && new Date(value) >= start && new Date(value) <= end)
  const activeWorkItems = workItems.filter(item => item.status !== 'completed')
  const workToday = activeWorkItems.flatMap(item => {
    const scheduledToday = within(item.scheduled_at)
    const dueToday = within(item.due_date)
    if (!scheduledToday && !dueToday) return []
    const client = clients.find(value => value.id === item.client_id)
    const at = scheduledToday ? new Date(item.scheduled_at!) : new Date(`${item.due_date}T09:00:00`)
    return [{ id: item.id, type: 'work_item' as const, title: item.title, detail: [client?.name, item.next_action || 'Lavorazione in scadenza'].filter(Boolean).join(' · '), at }]
  })
  const items: TodayItem[] = [
    ...calls.filter(call => (call.status === 'pending' || call.status === 'in_corso') && call.follow_up && within(call.follow_up_date)).map(call => ({ id: call.id, type: 'call' as const, title: `Richiamare ${call.caller_name}`, detail: call.follow_up_time || 'Oggi', at: new Date(`${call.follow_up_date}T${call.follow_up_time || '09:00'}`) })),
    ...events.filter(event => within(event.start_date) && (event.all_day || new Date(event.end_date || event.start_date) >= new Date())).map(event => ({ id: event.id, type: 'event' as const, title: event.title, detail: event.location || 'Calendario', at: new Date(event.start_date) })),
    ...notes.filter(note => within(note.reminder_at)).map(note => ({ id: note.id, type: 'note' as const, title: note.title, detail: 'Promemoria nota', at: new Date(note.reminder_at) })),
    ...payments.filter(payment => paymentRemainingAmount(payment) > 0 && within(payment.reminder_at)).map(payment => ({ id: payment.id, type: 'payment' as const, title: payment.payment_type, detail: payment.recipient, at: new Date(payment.reminder_at) })),
    ...workToday,
  ].sort((a, b) => a.at.getTime() - b.at.getTime())
  const source = { call: calls, event: events, note: notes, payment: payments, work_item: workItems }
  const icons = { call: Phone, event: Calendar, note: FileText, payment: CreditCard, work_item: Briefcase }

  return (
    <section className="ak-workspace">
      <header className="ak-workspace-head"><div><p className="ak-kicker">Piano quotidiano</p><h2>Oggi</h2><p>Scadenze, appuntamenti e prossime azioni di oggi.</p></div><Bell className="h-7 w-7 text-ak-danger" /></header>
      <div className="mt-5 space-y-3">
        {items.length ? items.map(item => {
          const Icon = icons[item.type]
          return <button key={`${item.type}-${item.id}`} onClick={() => onOpen(item.type, source[item.type].find((entry: any) => entry.id === item.id))} className="flex w-full items-center gap-4 rounded-2xl border border-ak-line bg-ak-panel p-4 text-left transition hover:bg-ak-panel">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ak-warning-bg text-ak-danger"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-ak-text">{item.title}</strong><small className="text-ak-muted">{item.detail}</small></span>
            <time className="text-sm font-black text-ak-text">{item.at.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</time>
          </button>
        }) : <div className="ak-empty"><CheckCircle2 className="h-8 w-8" /><h3>Nessuna scadenza oggi</h3><p>Hai spazio per occuparti di ciò che conta.</p></div>}
      </div>
    </section>
  )
}