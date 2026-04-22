'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export type ContractType = 'indeterminato' | 'determinato' | 'apprendistato' | 'collaborazione' | 'stage' | 'consulente'
export type EmployeeStatus = 'attivo' | 'in_prova' | 'sospeso' | 'cessato'
export type LeaveType = 'ferie' | 'permesso' | 'malattia' | 'maternita_paternita' | 'altro'
export type LeaveStatus = 'in_attesa' | 'approvato' | 'rifiutato'
export type DocCategory = 'corsi' | 'corsi_sicurezza' | 'documenti' | 'certificazioni_mediche' | 'training' | 'timbrature'

export interface HRProfile {
  profile_id: string
  role: string | null
  department: string | null
  phone: string | null
  birth_date: string | null
  hire_date: string | null
  contract_type: ContractType | null
  contract_end_date: string | null
  gross_salary: number | null
  net_salary: number | null
  iban: string | null
  tax_code: string | null
  address: string | null
  emergency_contact: string | null
  photo_url: string | null
  notes: string | null
  status: EmployeeStatus
  ferie_giorni_anno: number
  ferie_giorni_residui: number
  permessi_ore_anno: number
  permessi_ore_residui: number
  created_at: string
  updated_at: string
}

export interface HRUser {
  profile_id: string
  name: string
  email: string
  hr: HRProfile | null
}

export interface HRDocument {
  id: string
  user_id: string
  profile_id: string
  category: DocCategory
  name: string
  file_url: string | null
  file_name: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

export interface HRLeaveRequest {
  id: string
  user_id: string
  profile_id: string
  profile_name: string
  type: LeaveType
  start_date: string
  end_date: string
  days: number
  hours: number | null
  notes: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface HRWorkRecord {
  id: string
  user_id: string
  profile_id: string
  date: string
  hours_worked: number
  check_in: string | null
  check_out: string | null
  notes: string | null
  created_at: string
}

const EMPTY_HR = (profileId: string): HRProfile => ({
  profile_id: profileId, role: null, department: null, phone: null,
  birth_date: null, hire_date: null, contract_type: null, contract_end_date: null,
  gross_salary: null, net_salary: null, iban: null, tax_code: null,
  address: null, emergency_contact: null, photo_url: null, notes: null,
  status: 'attivo', ferie_giorni_anno: 26, ferie_giorni_residui: 26,
  permessi_ore_anno: 104, permessi_ore_residui: 104,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
})

export function useHR() {
  const [hrUsers, setHRUsers] = useState<HRUser[]>([])
  const [documents, setDocuments] = useState<HRDocument[]>([])
  const [leaveRequests, setLeaveRequests] = useState<HRLeaveRequest[]>([])
  const [workRecords, setWorkRecords] = useState<HRWorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadData = useCallback(async () => {
    if (!user) { setHRUsers([]); setDocuments([]); setLeaveRequests([]); setWorkRecords([]); setLoading(false); return }
    setLoading(true)
    try {
      const [profilesRes, hrProfilesRes, docsRes, leavesRes, workRes] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name').order('full_name'),
        supabase.from('hr_profiles').select('*'),
        supabase.from('hr_documents').select('*').order('created_at', { ascending: false }),
        supabase.from('hr_leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('hr_work_records').select('*').order('date', { ascending: false }),
      ])
      const hrMap = new Map<string, HRProfile>()
      for (const hp of (hrProfilesRes.data || [])) hrMap.set(hp.profile_id, hp as HRProfile)
      setHRUsers((profilesRes.data || []).map((p: any) => ({
        profile_id: p.id,
        name: p.full_name || p.email || 'Utente',
        email: p.email || '',
        hr: hrMap.get(p.id) || null,
      })))
      if (docsRes.data) setDocuments(docsRes.data as HRDocument[])
      if (leavesRes.data) setLeaveRequests(leavesRes.data as HRLeaveRequest[])
      if (workRes.data) setWorkRecords(workRes.data as HRWorkRecord[])
    } catch (e) { console.warn('HR load error:', e) }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  // ─── HR Profile (upsert) ──────────────────────────────────────
  const upsertHRProfile = async (profileId: string, data: Partial<Omit<HRProfile, 'profile_id' | 'created_at'>>): Promise<void> => {
    const { error } = await supabase
      .from('hr_profiles')
      .upsert({ profile_id: profileId, ...data, updated_at: new Date().toISOString() })
    if (error) { console.error('upsertHRProfile error:', error); return }
    setHRUsers(prev => prev.map(u => {
      if (u.profile_id !== profileId) return u
      const base = u.hr || EMPTY_HR(profileId)
      return { ...u, hr: { ...base, ...data, updated_at: new Date().toISOString() } }
    }))
  }

  // ─── Documents ────────────────────────────────────────────────
  const addDocument = async (data: Omit<HRDocument, 'id' | 'user_id' | 'created_at'>): Promise<HRDocument | null> => {
    if (!user) return null
    const { data: doc, error } = await supabase.from('hr_documents').insert([{ ...data, user_id: user.id }]).select().single()
    if (error) { console.error('addDocument error:', error); return null }
    setDocuments(prev => [doc as HRDocument, ...prev])
    return doc as HRDocument
  }

  const deleteDocument = async (id: string): Promise<void> => {
    await supabase.from('hr_documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  // ─── Leave requests ───────────────────────────────────────────
  const addLeaveRequest = async (data: Omit<HRLeaveRequest, 'id' | 'user_id' | 'created_at'>): Promise<HRLeaveRequest | null> => {
    if (!user) return null
    const { data: req, error } = await supabase.from('hr_leave_requests').insert([{ ...data, user_id: user.id }]).select().single()
    if (error) { console.error('addLeaveRequest error:', error); return null }
    setLeaveRequests(prev => [req as HRLeaveRequest, ...prev])
    return req as HRLeaveRequest
  }

  const updateLeaveStatus = async (id: string, status: LeaveStatus, reviewedBy: string): Promise<void> => {
    const now = new Date().toISOString()
    await supabase.from('hr_leave_requests').update({ status, reviewed_by: reviewedBy, reviewed_at: now }).eq('id', id)
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status, reviewed_by: reviewedBy, reviewed_at: now } : r))
    if (status === 'approvato') {
      const req = leaveRequests.find(r => r.id === id)
      if (req) {
        const u = hrUsers.find(u => u.profile_id === req.profile_id)
        if (u?.hr) {
          if (req.type === 'ferie') await upsertHRProfile(req.profile_id, { ferie_giorni_residui: Math.max(0, u.hr.ferie_giorni_residui - req.days) })
          else if (req.type === 'permesso') await upsertHRProfile(req.profile_id, { permessi_ore_residui: Math.max(0, u.hr.permessi_ore_residui - (req.hours || req.days * 8)) })
        }
      }
    }
  }

  const deleteLeaveRequest = async (id: string): Promise<void> => {
    await supabase.from('hr_leave_requests').delete().eq('id', id)
    setLeaveRequests(prev => prev.filter(r => r.id !== id))
  }

  // ─── Work records ─────────────────────────────────────────────
  const addWorkRecord = async (data: Omit<HRWorkRecord, 'id' | 'user_id' | 'created_at'>): Promise<HRWorkRecord | null> => {
    if (!user) return null
    const { data: rec, error } = await supabase
      .from('hr_work_records')
      .upsert([{ ...data, user_id: user.id }], { onConflict: 'profile_id,date' })
      .select().single()
    if (error) { console.error('addWorkRecord error:', error); return null }
    setWorkRecords(prev => {
      const idx = prev.findIndex(r => r.profile_id === data.profile_id && r.date === data.date)
      if (idx >= 0) return prev.map((r, i) => i === idx ? rec as HRWorkRecord : r)
      return [rec as HRWorkRecord, ...prev]
    })
    return rec as HRWorkRecord
  }

  const deleteWorkRecord = async (id: string): Promise<void> => {
    await supabase.from('hr_work_records').delete().eq('id', id)
    setWorkRecords(prev => prev.filter(r => r.id !== id))
  }

  const updateWorkRecord = async (id: string, data: Partial<Omit<HRWorkRecord, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> => {
    const { error } = await supabase.from('hr_work_records').update(data).eq('id', id)
    if (error) { console.error('updateWorkRecord error:', error); return false }
    setWorkRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    return true
  }

  return {
    hrUsers, documents, leaveRequests, workRecords, loading,
    upsertHRProfile, addDocument, deleteDocument,
    addLeaveRequest, updateLeaveStatus, deleteLeaveRequest,
    addWorkRecord, deleteWorkRecord, updateWorkRecord,
    reload: loadData,
  }
}
