'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface Installation {
  id: string
  user_id: string
  client_id: string | null
  nome: string
  indirizzo: string
  citta: string
  provincia: string
  note: string
  created_at: string
  updated_at: string
}

export interface InstallationDevice {
  id: string
  installation_id: string
  user_id: string
  tipo: 'NVR' | 'DVR' | 'XVR' | 'HDCVI' | 'Altro'
  marca: string
  modello: string
  canali: number
  ip_principale: string
  ip_secondario: string
  porta_http: number | null
  porta_rtsp: number | null
  uscite_hdmi: number
  uscite_vga: number
  uscite_displayport: number
  note: string
  created_at: string
  updated_at: string
}

export interface DeviceHdd {
  id: string
  device_id: string
  user_id: string
  slot: number
  dimensione_tb: number
  marca: string
  note: string
  created_at: string
}

export interface DeviceCredential {
  id: string
  device_id: string
  user_id: string
  ruolo: string
  username: string
  password: string
  note: string
  created_at: string
}

export interface InstallationCamera {
  id: string
  installation_id: string
  device_id: string | null
  user_id: string
  nome: string
  marca: string
  modello: string
  mpx: number
  ip: string
  canale: number | null
  username: string
  password: string
  posizione: string
  note: string
  created_at: string
  updated_at: string
}

// Dati completi di un impianto con tutte le relazioni
export interface InstallationFull extends Installation {
  devices: (InstallationDevice & { hdds: DeviceHdd[]; credentials: DeviceCredential[] })[]
  cameras: InstallationCamera[]
}

export function useInstallations() {
  const [installations, setInstallations] = useState<Installation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setInstallations([]); setLoading(false); return }
    let mounted = true
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('installations')
          .select('*')
          .order('nome', { ascending: true })
        if (error) throw error
        if (mounted) setInstallations(data || [])
      } catch (err) {
        console.error('Error fetching installations:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()

    const channel = supabase
      .channel('installations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'installations' }, () => { if (mounted) fetch() })
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [user?.id])

  // Carica impianto completo con dispositivi, HDD, credenziali e telecamere
  const loadFull = async (installationId: string): Promise<InstallationFull | null> => {
    try {
      const [instRes, devRes, camRes] = await Promise.all([
        supabase.from('installations').select('*').eq('id', installationId).single(),
        supabase.from('installation_devices').select('*').eq('installation_id', installationId).order('created_at', { ascending: true }),
        supabase.from('installation_cameras').select('*').eq('installation_id', installationId).order('canale', { ascending: true }),
      ])
      if (instRes.error || !instRes.data) return null
      const inst = instRes.data as Installation
      const devices = (devRes.data || []) as InstallationDevice[]
      const cameras = (camRes.data || []) as InstallationCamera[]

      // Carica HDD e credenziali per ogni dispositivo
      const devicesWithRelations = await Promise.all(
        devices.map(async (dev) => {
          const [hddsRes, credsRes] = await Promise.all([
            supabase.from('device_hdds').select('*').eq('device_id', dev.id).order('slot', { ascending: true }),
            supabase.from('device_credentials').select('*').eq('device_id', dev.id).order('created_at', { ascending: true }),
          ])
          return {
            ...dev,
            hdds: (hddsRes.data || []) as DeviceHdd[],
            credentials: (credsRes.data || []) as DeviceCredential[],
          }
        })
      )

      return { ...inst, devices: devicesWithRelations, cameras }
    } catch (err) {
      console.error('Error loading full installation:', err)
      return null
    }
  }

  const addInstallation = async (data: Partial<Installation>): Promise<Installation | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('installations')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add installation error:', error); return null }
    logActivity('create', 'installation', data.nome || 'Impianto', `Nuovo impianto: ${data.nome}`)
    return newItem as Installation
  }

  const updateInstallation = async (id: string, data: Partial<Installation>): Promise<void> => {
    const { error } = await supabase
      .from('installations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update installation error:', error)
    else logActivity('update', 'installation', data.nome || 'Impianto', `Aggiornato impianto`)
  }

  const deleteInstallation = async (id: string): Promise<void> => {
    const inst = installations.find(i => i.id === id)
    const { error } = await supabase.from('installations').delete().eq('id', id)
    if (error) console.error('Delete installation error:', error)
    else logActivity('delete', 'installation', inst?.nome || 'Impianto', `Eliminato impianto`)
  }

  // ─── DEVICES ───
  const addDevice = async (installationId: string, data: Partial<InstallationDevice>): Promise<InstallationDevice | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('installation_devices')
      .insert([{ ...data, installation_id: installationId, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add device error:', error); return null }
    return newItem as InstallationDevice
  }

  const updateDevice = async (id: string, data: Partial<InstallationDevice>): Promise<void> => {
    const { error } = await supabase
      .from('installation_devices')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update device error:', error)
  }

  const deleteDevice = async (id: string): Promise<void> => {
    const { error } = await supabase.from('installation_devices').delete().eq('id', id)
    if (error) console.error('Delete device error:', error)
  }

  // ─── HDDS ───
  const addHdd = async (deviceId: string, data: Partial<DeviceHdd>): Promise<DeviceHdd | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('device_hdds')
      .insert([{ ...data, device_id: deviceId, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add HDD error:', error); return null }
    return newItem as DeviceHdd
  }

  const deleteHdd = async (id: string): Promise<void> => {
    const { error } = await supabase.from('device_hdds').delete().eq('id', id)
    if (error) console.error('Delete HDD error:', error)
  }

  // ─── CREDENTIALS ───
  const addCredential = async (deviceId: string, data: Partial<DeviceCredential>): Promise<DeviceCredential | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('device_credentials')
      .insert([{ ...data, device_id: deviceId, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add credential error:', error); return null }
    return newItem as DeviceCredential
  }

  const updateCredential = async (id: string, data: Partial<DeviceCredential>): Promise<void> => {
    const { error } = await supabase.from('device_credentials').update(data).eq('id', id)
    if (error) console.error('Update credential error:', error)
  }

  const deleteCredential = async (id: string): Promise<void> => {
    const { error } = await supabase.from('device_credentials').delete().eq('id', id)
    if (error) console.error('Delete credential error:', error)
  }

  // ─── CAMERAS ───
  const addCamera = async (installationId: string, data: Partial<InstallationCamera>): Promise<InstallationCamera | null> => {
    if (!user) return null
    const { data: newItem, error } = await supabase
      .from('installation_cameras')
      .insert([{ ...data, installation_id: installationId, user_id: user.id }])
      .select()
      .single()
    if (error) { console.error('Add camera error:', error); return null }
    return newItem as InstallationCamera
  }

  const updateCamera = async (id: string, data: Partial<InstallationCamera>): Promise<void> => {
    const { error } = await supabase
      .from('installation_cameras')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Update camera error:', error)
  }

  const deleteCamera = async (id: string): Promise<void> => {
    const { error } = await supabase.from('installation_cameras').delete().eq('id', id)
    if (error) console.error('Delete camera error:', error)
  }

  return {
    installations, loading,
    loadFull,
    addInstallation, updateInstallation, deleteInstallation,
    addDevice, updateDevice, deleteDevice,
    addHdd, deleteHdd,
    addCredential, updateCredential, deleteCredential,
    addCamera, updateCamera, deleteCamera,
  }
}
