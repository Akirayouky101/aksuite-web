'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingItem, ShoppingItemInput, ShoppingList, validateShoppingItem, validateShoppingTitle } from '@/lib/shopping'
import { useAuth } from './useAuth'

export function useShopping() {
  const { user, authLoading } = useAuth()
  const userId = user?.id ?? null
  const currentUserId = useRef(userId)
  currentUserId.current = userId
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLists([])
    setItems([])
    setLoadedUserId(null)
    setErrorMessage(null)
    if (!userId) {
      setLoading(authLoading)
      return () => { active = false }
    }
    setLoading(true)
    async function load() {
      try {
        const [listResult, itemResult] = await Promise.all([
          supabase.from('shopping_lists').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('shopping_items').select('*').order('created_at', { ascending: true }).order('id'),
        ])
        if (listResult.error) throw listResult.error
        if (itemResult.error) throw itemResult.error
        if (active) {
          setLists(listResult.data ?? [])
          setItems(itemResult.data ?? [])
          setLoadedUserId(userId)
        }
      } catch (error) {
        console.error('Error loading shopping lists:', error)
        if (active) setErrorMessage('Impossibile caricare la spesa. Verifica la connessione e che la migrazione Spesa sia stata applicata.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [userId, authLoading, reloadKey])

  function requireUser() {
    if (!userId) throw new Error('Devi accedere per gestire la spesa.')
    if (loading || loadedUserId !== userId) throw new Error('Attendi il caricamento delle liste.')
    return userId
  }

  function requireList(id: string) {
    requireUser()
    if (!lists.some(list => list.id === id)) throw new Error('La lista non è più disponibile. Ricarica la sezione.')
  }

  async function createList(value: string): Promise<ShoppingList> {
    const ownerId = requireUser()
    const title = validateShoppingTitle(value)
    const { data, error } = await supabase.from('shopping_lists').insert({ title, user_id: ownerId }).select().single()
    if (error) throw error
    if (currentUserId.current === ownerId) setLists(current => [data, ...current])
    return data
  }

  async function renameList(id: string, value: string) {
    requireList(id)
    const ownerId = userId
    const { data, error } = await supabase.from('shopping_lists')
      .update({ title: validateShoppingTitle(value) }).eq('id', id).select().single()
    if (error) throw error
    if (currentUserId.current === ownerId) setLists(current => current.map(list => list.id === id ? data : list))
  }

  async function deleteList(id: string) {
    requireList(id)
    const ownerId = userId
    const { data, error } = await supabase.from('shopping_lists').delete().eq('id', id).select('id').single()
    if (error) throw error
    if (currentUserId.current === ownerId) {
      setLists(current => current.filter(list => list.id !== data.id))
      setItems(current => current.filter(item => item.list_id !== data.id))
    }
  }

  async function addItem(listId: string, input: ShoppingItemInput) {
    requireList(listId)
    const ownerId = userId
    const { data, error } = await supabase.from('shopping_items')
      .insert({ ...validateShoppingItem(input), list_id: listId }).select().single()
    if (error) throw error
    if (currentUserId.current === ownerId) setItems(current => [...current, data])
  }

  async function updateItem(id: string, updates: ShoppingItemInput | { purchased: boolean }) {
    requireUser()
    if (!items.some(item => item.id === id)) throw new Error('Il prodotto non è più disponibile. Ricarica la sezione.')
    const ownerId = userId
    const value = 'name' in updates ? validateShoppingItem(updates) : { purchased: updates.purchased }
    const { data, error } = await supabase.from('shopping_items').update(value).eq('id', id).select().single()
    if (error) throw error
    if (currentUserId.current === ownerId) setItems(current => current.map(item => item.id === id ? data : item))
  }

  async function deleteItem(id: string) {
    const ownerId = requireUser()
    const { data, error } = await supabase.from('shopping_items').delete().eq('id', id).select('id').single()
    if (error) throw error
    if (currentUserId.current === ownerId) setItems(current => current.filter(item => item.id !== data.id))
  }

  const visible = userId !== null && loadedUserId === userId
  return {
    lists: visible ? lists : [],
    items: visible ? items : [],
    loading: authLoading || loading || (!!userId && !visible && !errorMessage),
    errorMessage,
    reload: () => setReloadKey(current => current + 1),
    createList, renameList, deleteList, addItem, updateItem, deleteItem,
  }
}
