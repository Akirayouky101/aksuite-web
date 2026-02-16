'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Note {
  id: string
  user_id?: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  folder: string
  color: string
  created_at: string
  updated_at: string
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [user?.id])

  const loadNotes = async () => {
    try {
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('Error loading notes from Supabase:', error)
          loadFromLocalStorage()
        } else {
          setNotes(data || [])
        }
      } else {
        // Load from localStorage if not logged in
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error in loadNotes:', error)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('notes')
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }

  const saveToLocalStorage = (updatedNotes: Note[]) => {
    localStorage.setItem('notes', JSON.stringify(updatedNotes))
  }

  const addNote = async (noteData: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('notes')
          .insert([{
            ...noteData,
            user_id: user.id
          }])
          .select()
          .single()

        if (error) {
          console.error('Error adding note to Supabase:', error)
          addNoteLocally(noteData)
        } else {
          setNotes(prev => [data, ...prev])
        }
      } else {
        addNoteLocally(noteData)
      }
    } catch (error) {
      console.error('Error in addNote:', error)
      addNoteLocally(noteData)
    }
  }

  const addNoteLocally = (noteData: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const updatedNotes = [newNote, ...notes]
    setNotes(updatedNotes)
    saveToLocalStorage(updatedNotes)
  }

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from('notes')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('Error updating note in Supabase:', error)
          updateNoteLocally(id, updates)
        } else {
          setNotes(prev => prev.map(note => 
            note.id === id 
              ? { ...note, ...updates, updated_at: new Date().toISOString() }
              : note
          ))
        }
      } else {
        updateNoteLocally(id, updates)
      }
    } catch (error) {
      console.error('Error in updateNote:', error)
      updateNoteLocally(id, updates)
    }
  }

  const updateNoteLocally = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === id 
        ? { ...note, ...updates, updated_at: new Date().toISOString() }
        : note
    )
    setNotes(updatedNotes)
    saveToLocalStorage(updatedNotes)
  }

  const deleteNote = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Delete from Supabase
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting note from Supabase:', error)
          deleteNoteLocally(id)
        } else {
          setNotes(prev => prev.filter(note => note.id !== id))
        }
      } else {
        deleteNoteLocally(id)
      }
    } catch (error) {
      console.error('Error in deleteNote:', error)
      deleteNoteLocally(id)
    }
  }

  const deleteNoteLocally = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id)
    setNotes(updatedNotes)
    saveToLocalStorage(updatedNotes)
  }

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      await updateNote(id, { is_pinned: !note.is_pinned })
    }
  }

  return {
    notes,
    user,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    refreshNotes: loadNotes
  }
}
