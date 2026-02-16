'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Event {
  id: string
  user_id?: string
  title: string
  description: string
  start_date: string
  end_date: string | null
  all_day: boolean
  location: string
  color: string
  is_recurring: boolean
  recurring_type: string | null
  reminder_minutes: number
  created_at: string
  updated_at: string
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [user?.id])

  const loadEvents = async () => {
    try {
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true })

        if (error) {
          console.error('Error loading events from Supabase:', error)
          loadFromLocalStorage()
        } else {
          setEvents(data || [])
        }
      } else {
        // Load from localStorage if not logged in
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error in loadEvents:', error)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('events')
    if (stored) {
      setEvents(JSON.parse(stored))
    }
  }

  const saveToLocalStorage = (updatedEvents: Event[]) => {
    localStorage.setItem('events', JSON.stringify(updatedEvents))
  }

  const addEvent = async (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('events')
          .insert([{
            ...eventData,
            user_id: user.id
          }])
          .select()
          .single()

        if (error) {
          console.error('Error adding event to Supabase:', error)
          addEventLocally(eventData)
        } else {
          setEvents(prev => [...prev, data].sort((a, b) => 
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          ))
        }
      } else {
        addEventLocally(eventData)
      }
    } catch (error) {
      console.error('Error in addEvent:', error)
      addEventLocally(eventData)
    }
  }

  const addEventLocally = (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const updatedEvents = [...events, newEvent].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    setEvents(updatedEvents)
    saveToLocalStorage(updatedEvents)
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from('events')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('Error updating event in Supabase:', error)
          updateEventLocally(id, updates)
        } else {
          setEvents(prev => prev.map(event => 
            event.id === id 
              ? { ...event, ...updates, updated_at: new Date().toISOString() }
              : event
          ).sort((a, b) => 
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          ))
        }
      } else {
        updateEventLocally(id, updates)
      }
    } catch (error) {
      console.error('Error in updateEvent:', error)
      updateEventLocally(id, updates)
    }
  }

  const updateEventLocally = (id: string, updates: Partial<Event>) => {
    const updatedEvents = events.map(event =>
      event.id === id 
        ? { ...event, ...updates, updated_at: new Date().toISOString() }
        : event
    ).sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    setEvents(updatedEvents)
    saveToLocalStorage(updatedEvents)
  }

  const deleteEvent = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Delete from Supabase
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting event from Supabase:', error)
          deleteEventLocally(id)
        } else {
          setEvents(prev => prev.filter(event => event.id !== id))
        }
      } else {
        deleteEventLocally(id)
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error)
      deleteEventLocally(id)
    }
  }

  const deleteEventLocally = (id: string) => {
    const updatedEvents = events.filter(event => event.id !== id)
    setEvents(updatedEvents)
    saveToLocalStorage(updatedEvents)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)

      return (
        (eventStart >= dateStart && eventStart <= dateEnd) ||
        (eventEnd >= dateStart && eventEnd <= dateEnd) ||
        (eventStart <= dateStart && eventEnd >= dateEnd)
      )
    })
  }

  const getEventsForMonth = (year: number, month: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
  }

  return {
    events,
    user,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    refreshEvents: loadEvents
  }
}
