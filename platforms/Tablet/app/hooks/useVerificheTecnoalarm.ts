'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export interface VerificaCampoDefinizione {
  id: string
  nome: string
  etichetta: string
  categoria: string
  tipo: 'boolean' | 'testo' | 'numero' | 'select' | 'data' | 'note'
  opzioni: string[]
  obbligatorio: boolean
  ordine: number
  attivo: boolean
}

export interface VerificaTecnoalarm {
  id: string
  user_id: string
  created_by_name: string

  // Anagrafica
  cliente: string
  indirizzo: string
  telefono: string
  riferimento: string
  codice_impianto: string

  // Tipo e pianificazione
  tipo_verifica: 'mensile' | 'trimestrale' | 'semestrale' | 'annuale' | 'straordinaria'
  periodicita_mesi: number

  // Scadenze
  data_ultima_verifica: string | null
  data_prossima_verifica: string
  data_esecuzione: string | null

  // Stato
  stato: 'programmata' | 'in_scadenza' | 'scaduta' | 'in_corso' | 'completata' | 'annullata'

  // Tecnico
  tecnico_assegnato: string
  tecnico_user_id: string | null

  // Esito
  esito: 'positivo' | 'positivo_con_riserva' | 'negativo' | null
  note_tecniche: string
  note_interne: string
  firma_cliente: boolean
  firma_tecnico: boolean

  // Allegati
  allegati: string[]

  // Campi flessibili
  campi_abilitati: string[]
  campi_valori: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type NuovaVerifica = Omit<VerificaTecnoalarm, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function useVerificheTecnoalarm() {
  const [verifiche, setVerifiche] = useState<VerificaTecnoalarm[]>([])
  const [campiDefinizioni, setCampiDefinizioni] = useState<VerificaCampoDefinizione[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchVerifiche = useCallback(async () => {
    if (!user) { setVerifiche([]); setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('verifiche_tecnoalarm')
        .select('*')
        .order('data_prossima_verifica', { ascending: true })
      if (error) throw error
      setVerifiche(data || [])
    } catch (err) {
      console.error('Error fetching verifiche:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchCampiDefinizioni = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('verifiche_campi_definizioni')
        .select('*')
        .eq('attivo', true)
        .order('ordine', { ascending: true })
      if (error) throw error
      setCampiDefinizioni(data || [])
    } catch (err) {
      console.error('Error fetching campi definizioni:', err)
    }
  }, [user?.id])

  useEffect(() => {
    fetchVerifiche()
    fetchCampiDefinizioni()
  }, [fetchVerifiche, fetchCampiDefinizioni])

  const addVerifica = async (data: NuovaVerifica) => {
    if (!user) throw new Error('User not authenticated')
    const { data: result, error } = await supabase
      .from('verifiche_tecnoalarm')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    if (result) {
      setVerifiche(prev => [...prev, result].sort(
        (a, b) => new Date(a.data_prossima_verifica).getTime() - new Date(b.data_prossima_verifica).getTime()
      ))
      logActivity('create', 'verifica_tecnoalarm', result.cliente, result.tipo_verifica)
    }
    return result
  }

  const updateVerifica = async (id: string, updates: Partial<Omit<VerificaTecnoalarm, 'id' | 'user_id' | 'created_at'>>) => {
    const { data: result, error } = await supabase
      .from('verifiche_tecnoalarm')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    if (result) {
      setVerifiche(prev => prev.map(v => v.id === id ? result : v))
      logActivity('update', 'verifica_tecnoalarm', result.cliente, result.stato)
    }
    return result
  }

  const deleteVerifica = async (id: string) => {
    const verifica = verifiche.find(v => v.id === id)
    const { error } = await supabase
      .from('verifiche_tecnoalarm')
      .delete()
      .eq('id', id)
    if (error) throw error
    setVerifiche(prev => prev.filter(v => v.id !== id))
    if (verifica) logActivity('delete', 'verifica_tecnoalarm', verifica.cliente, '')
  }

  const updateStato = async (id: string, stato: VerificaTecnoalarm['stato']) => {
    return updateVerifica(id, { stato })
  }

  const completaVerifica = async (
    id: string,
    payload: {
      esito: VerificaTecnoalarm['esito']
      note_tecniche?: string
      campi_valori?: Record<string, unknown>
      firma_cliente?: boolean
      firma_tecnico?: boolean
    }
  ) => {
    const verifica = verifiche.find(v => v.id === id)
    if (!verifica) return

    // Calcola la prossima data di verifica in base alla periodicità
    const esecuzione = new Date()
    const prossima = new Date(esecuzione)
    prossima.setMonth(prossima.getMonth() + (verifica.periodicita_mesi || 6))

    return updateVerifica(id, {
      ...payload,
      stato: 'completata',
      data_esecuzione: esecuzione.toISOString().split('T')[0],
      data_ultima_verifica: esecuzione.toISOString().split('T')[0],
      data_prossima_verifica: prossima.toISOString().split('T')[0],
    })
  }

  // Contatori per la dashboard
  const scadute = verifiche.filter(v => v.stato === 'scaduta').length
  const inScadenza = verifiche.filter(v => v.stato === 'in_scadenza').length
  const programmate = verifiche.filter(v => v.stato === 'programmata').length
  const completate = verifiche.filter(v => v.stato === 'completata').length

  return {
    verifiche,
    campiDefinizioni,
    loading,
    scadute,
    inScadenza,
    programmate,
    completate,
    addVerifica,
    updateVerifica,
    deleteVerifica,
    updateStato,
    completaVerifica,
    refetch: fetchVerifiche,
  }
}
