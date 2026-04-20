'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLogger'

export interface UserPermissions {
  id: string
  user_id: string
  is_admin: boolean
  can_calls: boolean
  can_lavorazioni: boolean
  can_tasks: boolean
  can_calendar: boolean
  can_budget: boolean
  can_passwords: boolean
  can_notes: boolean
  can_clients: boolean
  can_visits: boolean
  can_suppliers: boolean
  can_orders: boolean
  can_warehouse: boolean
  can_preventivi: boolean
  can_sopralluoghi: boolean
  can_installations: boolean
  can_prelievo: boolean
  can_kits: boolean
  created_at: string
  updated_at: string
}

export interface ManagedUser {
  id: string
  email: string
  full_name: string
  created_at: string
  permissions: UserPermissions | null
}

export const PERMISSION_MODULES = [
  { key: 'can_calls', label: 'Chiamate', icon: 'Phone' },
  { key: 'can_lavorazioni', label: 'Lavorazioni', icon: 'Wrench' },
  { key: 'can_tasks', label: 'Task', icon: 'CheckSquare' },
  { key: 'can_calendar', label: 'Calendario', icon: 'Calendar' },
  { key: 'can_budget', label: 'Bilancio', icon: 'DollarSign' },
  { key: 'can_passwords', label: 'Password', icon: 'Lock' },
  { key: 'can_notes', label: 'Note', icon: 'StickyNote' },
  { key: 'can_clients', label: 'Clienti', icon: 'Users' },
  { key: 'can_visits', label: 'Visite', icon: 'MapPin' },
  { key: 'can_suppliers', label: 'Fornitori', icon: 'Truck' },
  { key: 'can_orders', label: 'Ordini', icon: 'ShoppingCart' },
  { key: 'can_warehouse', label: 'Magazzino', icon: 'Package' },
  { key: 'can_preventivi', label: 'Preventivi', icon: 'FileText' },
  { key: 'can_sopralluoghi', label: 'Sopralluoghi', icon: 'ClipboardList' },
  { key: 'can_installations', label: 'Impianti', icon: 'Monitor' },
  { key: 'can_prelievo', label: 'Prelievi', icon: 'PackageMinus' },
  { key: 'can_kits', label: 'Gestione KIT', icon: 'Layers' },
] as const

export type PermissionKey = typeof PERMISSION_MODULES[number]['key']

const DEFAULT_PERMISSIONS: Omit<UserPermissions, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  is_admin: false,
  can_calls: false,
  can_lavorazioni: false,
  can_tasks: false,
  can_calendar: false,
  can_budget: false,
  can_passwords: false,
  can_notes: false,
  can_clients: false,
  can_visits: false,
  can_suppliers: false,
  can_orders: false,
  can_warehouse: false,
  can_preventivi: false,
  can_sopralluoghi: false,
  can_installations: false,
  can_prelievo: false,
  can_kits: false,
}

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [myPermissions, setMyPermissions] = useState<UserPermissions | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Carica i permessi dell'utente corrente
  const loadMyPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading permissions:', error)
        return
      }

      if (data) {
        setMyPermissions(data as UserPermissions)
        setIsAdmin(data.is_admin)
      } else {
        // Nessun record permessi = no access (tranne admin hardcoded)
        const hardcodedAdmin = user.id === '3740d43e-4020-4020-8582-ad305f9d06b4'
        setIsAdmin(hardcodedAdmin)
        if (hardcodedAdmin) {
          setMyPermissions({
            ...DEFAULT_PERMISSIONS,
            is_admin: true,
            can_calls: true, can_lavorazioni: true, can_tasks: true, can_calendar: true,
            can_budget: true, can_passwords: true, can_notes: true, can_clients: true,
            can_visits: true, can_suppliers: true, can_orders: true, can_warehouse: true,
            can_preventivi: true, can_sopralluoghi: true, can_installations: true,
          } as UserPermissions)
        }
      }
    } catch (err) {
      console.error('Error loading my permissions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carica tutti gli utenti con i loro permessi (solo admin)
  const loadAllUsers = useCallback(async () => {
    try {
      // Carica tutti i permessi (admin ha accesso a tutti via RLS)
      const { data: permissionsData, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: true })

      if (permError) {
        console.error('Error loading all permissions:', permError)
        return
      }

      // Carica profili da profiles table
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')

      if (profError) {
        console.error('Error loading profiles:', profError)
        return
      }

      // Merge: per ogni profilo, trova i permessi
      const mergedUsers: ManagedUser[] = (profilesData || []).map((profile: any) => {
        const perms = (permissionsData || []).find((p: any) => p.user_id === profile.id)
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name || '',
          created_at: profile.created_at || '',
          permissions: perms || null,
        }
      })

      setUsers(mergedUsers)
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }, [])

  // Registra un nuovo utente (via API route server-side)
  const createUser = useCallback(async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return { success: false, error: 'Non autenticato' }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          adminUserId: currentUser.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Errore durante la creazione' }
      }

      // Ricarica lista utenti
      await loadAllUsers()
      logActivity('create', 'user', fullName, `Nuovo utente creato: ${fullName} (${email})`)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [loadAllUsers])

  // Aggiorna i permessi di un utente
  const updatePermissions = useCallback(async (userId: string, permissions: Partial<UserPermissions>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update(permissions)
        .eq('user_id', userId)

      if (error) {
        // Se non esiste il record, inseriscilo
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_permissions')
            .insert({ user_id: userId, ...DEFAULT_PERMISSIONS, ...permissions })

          if (insertError) {
            console.error('Error inserting permissions:', insertError)
            return false
          }
        } else {
          console.error('Error updating permissions:', error)
          return false
        }
      }

      // Ricarica
      await loadAllUsers()

      // Log attivit\u{00E0}
      const targetUser = users.find(u => u.id === userId)
      const changedKeys = Object.keys(permissions).filter(k => k !== 'id' && k !== 'user_id' && k !== 'created_at' && k !== 'updated_at')
      logActivity('update', 'permission', targetUser?.full_name || 'Utente', `Permessi aggiornati: ${changedKeys.join(', ')}`)

      return true
    } catch (err) {
      console.error('Error updating permissions:', err)
      return false
    }
  }, [loadAllUsers, users])

  // Toggle un singolo permesso
  const togglePermission = useCallback(async (userId: string, key: PermissionKey, value: boolean): Promise<boolean> => {
    return updatePermissions(userId, { [key]: value })
  }, [updatePermissions])

  // Abilita/disabilita tutti i permessi per un utente
  const setAllPermissions = useCallback(async (userId: string, enabled: boolean): Promise<boolean> => {
    const allPerms: any = {}
    PERMISSION_MODULES.forEach(m => { allPerms[m.key] = enabled })
    return updatePermissions(userId, allPerms)
  }, [updatePermissions])

  // Elimina un utente COMPLETAMENTE (auth + profilo + permessi)
  const deleteUserPermissions = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return false

      // Salva il nome prima di eliminare
      const targetUser = users.find(u => u.id === userId)
      const targetName = targetUser?.full_name || targetUser?.email || 'Utente'

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          adminUserId: currentUser.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error deleting user:', result.error)
        return false
      }

      await loadAllUsers()
      logActivity('delete', 'user', targetName, `Utente eliminato: ${targetName}`)
      return true
    } catch (err) {
      console.error('Error deleting user:', err)
      return false
    }
  }, [loadAllUsers, users])

  // Check se l'utente ha un permesso specifico
  // Durante il caricamento mostra tutto per non far sparire il menu
  const hasPermission = useCallback((key: PermissionKey): boolean => {
    if (loading) return true // Permessi non ancora caricati → mostra tutto
    if (!myPermissions) return isAdmin // admin hardcoded ha tutto
    if (myPermissions.is_admin) return true
    return (myPermissions as any)[key] === true
  }, [myPermissions, isAdmin, loading])

  // Init — carica permessi quando l'auth è pronta
  useEffect(() => {
    loadMyPermissions()

    // Ascolta cambi di auth (login/logout) per ricaricare i permessi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadMyPermissions()
      }
      if (event === 'SIGNED_OUT') {
        setMyPermissions(null)
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [loadMyPermissions])

  return {
    users,
    myPermissions,
    isAdmin,
    loading,
    loadAllUsers,
    createUser,
    updatePermissions,
    togglePermission,
    setAllPermissions,
    deleteUserPermissions,
    hasPermission,
    loadMyPermissions,
  }
}
