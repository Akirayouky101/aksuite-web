'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Event {
  id: string
  user_id?: string
  client_id: string | null
  work_item_id: string | null
  title: string
  description: string
  start_date: string
  end_date: string | null
  all_day: boolean
  client_confirmed: boolean
  location: string
  color: string
  is_recurring: boolean
  recurring_type: string | null
  reminder_minutes: number
  assigned_to?: string | null
  assigned_to_name?: string | null
  is_shared?: boolean
  created_by?: string | null
  created_by_name?: string | null
  is_completed?: boolean
  completed_at?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export function useEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const owner = useRef(user?.id)
  const request = useRef(0)
  const loadedFor = useRef<string | null>(null)
  owner.current = user?.id
  const loadEvents = useCallback(async () => {
    if (!user) { setEvents([]); setLoading(false); return }
    setLoading(true)
    const ticket = ++request.current
    const userId = user.id
    try {
      const { data, error } = await supabase.from('events').select('*').eq('is_completed', false)
        .is('archived_at', null).order('start_date')
      if (error) throw error
      if (owner.current !== userId || ticket !== request.current) return
      loadedFor.current = userId
      setEvents(data ?? [])
      setErrorMessage(null)
    } catch (cause) {
      console.error('Events loading failed:', cause)
      if (owner.current === userId && ticket === request.current) setErrorMessage('Impossibile caricare il calendario. Riprova.')
    } finally { if (owner.current === userId && ticket === request.current) setLoading(false) }
  }, [user?.id])
  useEffect(() => { setEvents([]); void loadEvents() }, [loadEvents])
  useEffect(() => {
    const reload = () => void loadEvents()
    window.addEventListener('aksuite-events-changed', reload)
    return () => window.removeEventListener('aksuite-events-changed', reload)
  }, [loadEvents])

  function retain(data: Event) {
    const sameOwner = loadedFor.current === user?.id
    loadedFor.current = user?.id || null
    setEvents(current => {
      const others = sameOwner ? current.filter(event => event.id !== data.id) : []
      return data.is_completed || data.archived_at ? others : [...others, data].sort((a, b) => a.start_date.localeCompare(b.start_date))
    })
  }
  const addEvent = async (input: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Accedi per salvare un evento.')
    const { data, error } = await supabase.from('events').insert({ ...input, user_id: user.id, created_by: user.id }).select().single()
    if (error) throw error
    if (owner.current !== user.id) throw new Error('Sessione cambiata. Accedi nuovamente.')
    retain(data)
    return data as Event
  }
  const updateEvent = async (id: string, updates: Partial<Event>) => {
    if (!user) throw new Error('Accedi per modificare un evento.')
    const { data, error } = await supabase.from('events').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    if (owner.current !== user.id) throw new Error('Sessione cambiata. Accedi nuovamente.')
    retain(data)
    return data as Event
  }
  const deleteEvent = async (id: string) => {
    if (!user) throw new Error('Accedi per eliminare un evento.')
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error
    if (owner.current !== user.id) throw new Error('Sessione cambiata. Accedi nuovamente.')
    setEvents(current => current.filter(event => event.id !== id))
  }
  const getEventsForDate = (date: Date) => {
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)
    return visibleEvents.filter(event => new Date(event.start_date) <= end && new Date(event.end_date || event.start_date) >= start)
  }
  const visibleEvents = loadedFor.current === user?.id ? events : []
  return {
    events: visibleEvents, user, loading, errorMessage, addEvent, updateEvent, deleteEvent, getEventsForDate,
    getEventsForMonth: (year: number, month: number) => visibleEvents.filter(event => {
      const date = new Date(event.start_date)
      return date.getFullYear() === year && date.getMonth() === month
    }),
    refreshEvents: loadEvents,
  }
}
