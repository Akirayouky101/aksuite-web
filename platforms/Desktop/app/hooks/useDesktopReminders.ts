'use client'

import { useEffect } from 'react'
import { Event } from './useEvents'
import { Note } from './useNotes'
import { Payment } from './usePayments'
import { Call } from './useCalls'

const notifiedKey = 'aksuite-desktop-reminders'

function callReminderTimestamp(date: string, time?: string | null) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  const [hour, minute] = (time || '09:00').split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return new Date(date).getTime()
  return new Date(year, month - 1, day, hour, minute).getTime()
}

export function useDesktopReminders(events: Event[], notes: Note[], payments: Payment[], calls: Call[]) {
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const notifyDue = () => {
      const now = Date.now()
      const reminders = [
        ...events.filter(event => event.reminder_minutes > 0).map(event => ({ id: `event:${event.id}:${event.start_date}`, at: new Date(event.start_date).getTime() - event.reminder_minutes * 60_000, title: 'Evento in programma', body: event.title })),
        ...notes.filter(note => note.reminder_at).map(note => ({ id: `note:${note.id}:${note.reminder_at}`, at: new Date(note.reminder_at!).getTime(), title: 'Nota', body: note.title })),
        ...payments.filter(payment => payment.reminder_at).map(payment => ({ id: `payment:${payment.id}:${payment.reminder_at}`, at: new Date(payment.reminder_at!).getTime(), title: 'Pagamento in scadenza', body: `${payment.payment_type} · ${payment.recipient}` })),
        ...calls.filter(call => call.follow_up && call.follow_up_date).map(call => ({ id: `call:${call.id}:${call.follow_up_date}:${call.follow_up_time || '09:00'}`, at: callReminderTimestamp(call.follow_up_date!, call.follow_up_time) - 15 * 60_000, title: 'Richiamo tra 15 minuti', body: `Preparati a richiamare ${call.caller_name}` })),
      ]
      const sent = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) || '[]'))
      reminders.filter(reminder => reminder.at <= now && reminder.at > now - 60_000 && !sent.has(reminder.id)).forEach(reminder => {
        new Notification(reminder.title, { body: reminder.body })
        sent.add(reminder.id)
      })
      localStorage.setItem(notifiedKey, JSON.stringify(Array.from(sent).slice(-200)))
    }
    notifyDue()
    const interval = window.setInterval(notifyDue, 15_000)
    return () => window.clearInterval(interval)
  }, [events, notes, payments, calls])

  return { requestPermission: () => 'Notification' in window ? Notification.requestPermission() : Promise.resolve('denied' as NotificationPermission) }
}