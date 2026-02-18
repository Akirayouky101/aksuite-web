'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  priority: string
  status: 'todo' | 'in-progress' | 'completed'
  due_date: string | null
  is_recurring: boolean
  recurring_type: string | null
  is_completed: boolean
  completed_at: string | null
  tags: string[]
  subtasks: Subtask[]
  created_at: string
  updated_at: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUserId(user.id)
      loadTasksFromSupabase(user.id)
    } else {
      const tempUserId = localStorage.getItem('temp_user_id') || crypto.randomUUID()
      localStorage.setItem('temp_user_id', tempUserId)
      setUserId(tempUserId)
      loadLocalTasks(tempUserId)
    }
  }, [user?.id])

  const loadTasksFromSupabase = async (uid: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedTasks: Task[] = (data || []).map(t => ({
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        description: t.description || '',
        category: t.category,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
        is_recurring: t.is_recurring || false,
        recurring_type: t.recurring_type,
        is_completed: t.is_completed || false,
        completed_at: t.completed_at,
        tags: t.tags || [],
        subtasks: t.subtasks || [],
        created_at: t.created_at,
        updated_at: t.updated_at
      }))
      setTasks(formattedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      const tempUserId = localStorage.getItem('temp_user_id') || crypto.randomUUID()
      localStorage.setItem('temp_user_id', tempUserId)
      setUserId(tempUserId)
      loadLocalTasks(tempUserId)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalTasks = (tempUserId: string) => {
    const saved = localStorage.getItem(`tasks_${tempUserId}`)
    if (saved) {
      setTasks(JSON.parse(saved))
    }
    setLoading(false)
  }

  const saveLocalTasks = (updatedTasks: Task[], tempUserId: string) => {
    localStorage.setItem(`tasks_${tempUserId}`, JSON.stringify(updatedTasks))
  }

  const addTask = async (task: Omit<Task, 'id' | 'user_id' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const tempUserId = localStorage.getItem('temp_user_id') || crypto.randomUUID()
        localStorage.setItem('temp_user_id', tempUserId)
        
        const newTask: Task = {
          id: crypto.randomUUID(),
          user_id: tempUserId,
          ...task,
          is_completed: false,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const updatedTasks = [newTask, ...tasks]
        setTasks(updatedTasks)
        saveLocalTasks(updatedTasks, tempUserId)
        return
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          is_recurring: task.is_recurring,
          recurring_type: task.recurring_type,
          tags: task.tags,
          subtasks: task.subtasks,
          is_completed: false
        })
        .select()
        .single()

      if (error) throw error

      const newTask: Task = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        description: data.description || '',
        category: data.category,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date,
        is_recurring: data.is_recurring || false,
        recurring_type: data.recurring_type,
        is_completed: data.is_completed || false,
        completed_at: data.completed_at,
        tags: data.tags || [],
        subtasks: data.subtasks || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      setTasks([newTask, ...tasks])
      logActivity('create', 'task', task.title, `Nuovo task: ${task.title} - ${task.priority} - ${task.category}`)
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const tempUserId = localStorage.getItem('temp_user_id')
        if (!tempUserId) return
        
        const updatedTasks = tasks.map(t =>
          t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        )
        setTasks(updatedTasks)
        saveLocalTasks(updatedTasks, tempUserId)
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setTasks(tasks.map(t =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ))
      const task = tasks.find(t => t.id === id)
      logActivity('update', 'task', task?.title || updates.title || 'Task', `Aggiornato task`)
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === id)
      const updates = {
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
        status: completed ? 'completed' as const : 'todo' as const
      }
      
      await updateTask(id, updates)
      logActivity('update', 'task', task?.title || 'Task', completed ? 'Task completato' : 'Task riaperto')
    } catch (error) {
      console.error('Error toggling task completion:', error)
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const tempUserId = localStorage.getItem('temp_user_id')
        if (!tempUserId) return
        
        const updatedTasks = tasks.filter(t => t.id !== id)
        setTasks(updatedTasks)
        saveLocalTasks(updatedTasks, tempUserId)
        return
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      const task = tasks.find(t => t.id === id)
      setTasks(tasks.filter(t => t.id !== id))
      logActivity('delete', 'task', task?.title || 'Task', `Eliminato task: ${task?.title || ''}`)
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  return {
    tasks,
    loading,
    userId,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refreshTasks: () => user ? loadTasksFromSupabase(user.id) : Promise.resolve()
  }
}
