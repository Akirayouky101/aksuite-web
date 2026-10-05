'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from './useEvents'
import { Note } from './useNotes'
import { Payment } from './usePayments'
import { Call } from './useCalls'

export type ReminderEvent = Pick<Event, 'id' | 'title' | 'start_date' | 'reminder_minutes'>
export type ReminderNote = Pick<Note, 'id' | 'title' | 'reminder_at'>
export type ReminderPayment = Pick<Payment, 'id' | 'payment_type' | 'recipient' | 'reminder_at'>
export type ReminderCall = Pick<Call, 'id' | 'caller_name' | 'follow_up' | 'follow_up_date' | 'follow_up_time'>
const empty = { events: [] as ReminderEvent[], notes: [] as ReminderNote[], payments: [] as ReminderPayment[], calls: [] as ReminderCall[] }

export function useReminderFeed(userId: string | undefined, revision: string) {
  const [feed, setFeed] = useState(empty)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let running = false
    setFeed(empty); setError('')
    if (!userId) return
    async function load() {
      if (running) return
      running = true
      try {
        const from = new Date(Date.now() - 86400000).toISOString()
        const to = new Date(Date.now() + 86400000).toISOString()
        const results = await Promise.all([
          supabase.from('events').select('id,title,start_date,reminder_minutes').eq('is_completed', false).is('archived_at', null)
            .gt('reminder_minutes', 0).gte('start_date', from).returns<ReminderEvent[]>(),
          supabase.from('notes').select('id,title,reminder_at').gte('reminder_at', from).lte('reminder_at', to).returns<ReminderNote[]>(),
          supabase.from('payments').select('id,payment_type,recipient,reminder_at').gte('reminder_at', from).lte('reminder_at', to).returns<ReminderPayment[]>(),
          supabase.from('calls').select('id,caller_name,follow_up,follow_up_date,follow_up_time').eq('follow_up', true)
            .gte('follow_up_date', from.slice(0, 10)).lte('follow_up_date', to.slice(0, 10)).returns<ReminderCall[]>(),
        ])
        for (const result of results) if (result.error) throw result.error
        if (active) {
          setFeed({ events: results[0].data || [], notes: results[1].data || [], payments: results[2].data || [], calls: results[3].data || [] })
          setError('')
        }
      } catch (cause) {
        console.error('Reminder feed loading failed:', cause)
        if (active) setError('Impossibile aggiornare i promemoria della pagina. Nuovo tentativo automatico tra un minuto.')
      } finally { running = false }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [userId, revision])
  return { ...feed, error }
}
