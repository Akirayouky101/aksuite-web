import { useState, useEffect } from 'react'
import { supabase, encryptPassword, decryptPassword } from '@/lib/supabase'
import { useAuth } from './useAuth'

export type InfraType = 'PC' | 'Server' | 'NAS' | 'Email' | 'Router' | 'Switch' | 'NVR' | 'DVR' | 'Firewall' | 'Stampante' | 'Altro'

export interface InfrastructureItem {
  id: string
  type: InfraType
  name: string
  hostname: string
  ip_address: string
  mac_address: string
  location: string
  username: string
  password: string
  secondary_username: string
  secondary_password: string
  port: string
  domain: string
  os_version: string
  serial_number: string
  notes: string
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export function useInfrastructure() {
  const [items, setItems] = useState<InfrastructureItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      if (user) {
        const { data, error } = await supabase
          .from('infrastructure_items')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          const parsed: InfrastructureItem[] = await Promise.all(
            data.map(async (r) => ({
              id: r.id,
              type: r.type as InfraType,
              name: r.name,
              hostname: r.hostname || '',
              ip_address: r.ip_address || '',
              mac_address: r.mac_address || '',
              location: r.location || '',
              username: r.username || '',
              password: r.encrypted_password ? await decryptPassword(r.encrypted_password) : '',
              secondary_username: r.secondary_username || '',
              secondary_password: r.encrypted_secondary_password ? await decryptPassword(r.encrypted_secondary_password) : '',
              port: r.port || '',
              domain: r.domain || '',
              os_version: r.os_version || '',
              serial_number: r.serial_number || '',
              notes: r.notes || '',
              isFavorite: r.is_favorite || false,
              createdAt: new Date(r.created_at),
              updatedAt: new Date(r.updated_at),
            }))
          )
          setItems(parsed)
        }
      }
      setIsLoading(false)
    }
    load()
  }, [user?.id])

  const addItem = async (item: Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return
    const encPwd = item.password ? await encryptPassword(item.password) : null
    const encPwd2 = item.secondary_password ? await encryptPassword(item.secondary_password) : null

    const { data, error } = await supabase
      .from('infrastructure_items')
      .insert({
        user_id: user.id,
        type: item.type,
        name: item.name,
        hostname: item.hostname || null,
        ip_address: item.ip_address || null,
        mac_address: item.mac_address || null,
        location: item.location || null,
        username: item.username || null,
        encrypted_password: encPwd,
        secondary_username: item.secondary_username || null,
        encrypted_secondary_password: encPwd2,
        port: item.port || null,
        domain: item.domain || null,
        os_version: item.os_version || null,
        serial_number: item.serial_number || null,
        notes: item.notes || null,
        is_favorite: item.isFavorite || false,
      })
      .select()
      .single()

    if (!error && data) {
      const newItem: InfrastructureItem = {
        ...item,
        id: data.id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
      setItems(prev => [newItem, ...prev])
    }
  }

  const updateItem = async (id: string, updates: Partial<Omit<InfrastructureItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!user) return
    const payload: Record<string, unknown> = {}

    if (updates.type !== undefined)       payload.type = updates.type
    if (updates.name !== undefined)       payload.name = updates.name
    if (updates.hostname !== undefined)   payload.hostname = updates.hostname || null
    if (updates.ip_address !== undefined) payload.ip_address = updates.ip_address || null
    if (updates.mac_address !== undefined) payload.mac_address = updates.mac_address || null
    if (updates.location !== undefined)   payload.location = updates.location || null
    if (updates.username !== undefined)   payload.username = updates.username || null
    if (updates.password !== undefined)   payload.encrypted_password = updates.password ? await encryptPassword(updates.password) : null
    if (updates.secondary_username !== undefined) payload.secondary_username = updates.secondary_username || null
    if (updates.secondary_password !== undefined) payload.encrypted_secondary_password = updates.secondary_password ? await encryptPassword(updates.secondary_password) : null
    if (updates.port !== undefined)       payload.port = updates.port || null
    if (updates.domain !== undefined)     payload.domain = updates.domain || null
    if (updates.os_version !== undefined) payload.os_version = updates.os_version || null
    if (updates.serial_number !== undefined) payload.serial_number = updates.serial_number || null
    if (updates.notes !== undefined)      payload.notes = updates.notes || null
    if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite

    const { error } = await supabase
      .from('infrastructure_items')
      .update(payload)
      .eq('id', id)

    if (!error) {
      let updated: InfrastructureItem | undefined
      setItems(prev => prev.map(item => {
        if (item.id !== id) return item
        updated = { ...item, ...updates }
        return updated
      }))
      return updated
    }
    return undefined
  }

  const deleteItem = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('infrastructure_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(item => item.id !== id))
  }

  return { items, isLoading, addItem, updateItem, deleteItem }
}
