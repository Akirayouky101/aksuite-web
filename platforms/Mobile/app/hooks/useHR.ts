'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { logActivity } from '@/lib/activityLogger'

export type ContractType = 'indeterminato' | 'determinato' | 'apprendistato' | 'collaborazione' | 'stage' | 'consulente'
export type EmployeeStatus = 'attivo' | 'in_prova' | 'sospeso' | 'cessato'
export type LeaveType = 'ferie' | 'permesso' | 'malattia' | 'maternita_paternita' | 'altro'
export type LeaveStatus = 'in_attesa' | 'approvato' | 'rifiutato'

export interface HREmployee {
  id: string
  user_id: string
  full_name: string
  role: string | null
  department: string | null
  email: string | null
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
  created_at: string
  updated_at: string
}

export interface HRLeaveRequest {
  id: string
  user_id: string
  employee_id: string
  employee_name: string
  type: LeaveType
  start_date: string
  end_date: string
  days: number
  notes: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export function useHR() {
  const [employees, setEmployees] = useState<HREmployee[]>([])
  const [leaveRequests, setLeaveRequests] = useState<HRLeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadData = useCallback(async () => {
    if (!user) { setEmployees([]); setLeaveRequests([]); setLoading(false); return }
    setLoading(true)
    try {
      const [empRes, leaveRes] = await Promise.all([
        supabase.from('hr_employees').select('*').order('full_name'),
        supabase.from('hr_leave_requests').select('*').order('created_at', { ascending: false }),
      ])
      if (empRes.data) setEmployees(empRes.data as HREmployee[])
      if (leaveRes.data) setLeaveRequests(leaveRes.data as HRLeaveRequest[])
    } catch (e) { console.warn('HR tables may not exist yet:', e) }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Dipendenti ───────────────────────────────────────────────
  const addEmployee = async (data: Omit<HREmployee, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<HREmployee | null> => {
    if (!user) return null
    const { data: emp, error } = await supabase
      .from('hr_employees')
      .insert([{ ...data, user_id: user.id }])
      .select().single()
    if (error) { console.error('addEmployee error:', error); return null }
    setEmployees(prev => [...prev, emp as HREmployee].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    logActivity('create', 'hr', emp.full_name, `Nuovo dipendente: ${emp.full_name}`)
    return emp as HREmployee
  }

  const updateEmployee = async (id: string, data: Partial<HREmployee>): Promise<void> => {
    const { error } = await supabase
      .from('hr_employees')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('updateEmployee error:', error); return }
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  }

  const deleteEmployee = async (id: string): Promise<void> => {
    await supabase.from('hr_employees').delete().eq('id', id)
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  // ─── Ferie/Permessi ───────────────────────────────────────────
  const addLeaveRequest = async (data: Omit<HRLeaveRequest, 'id' | 'user_id' | 'created_at'>): Promise<HRLeaveRequest | null> => {
    if (!user) return null
    const { data: req, error } = await supabase
      .from('hr_leave_requests')
      .insert([{ ...data, user_id: user.id }])
      .select().single()
    if (error) { console.error('addLeaveRequest error:', error); return null }
    setLeaveRequests(prev => [req as HRLeaveRequest, ...prev])
    return req as HRLeaveRequest
  }

  const updateLeaveStatus = async (id: string, status: LeaveStatus, reviewedBy: string): Promise<void> => {
    const now = new Date().toISOString()
    await supabase.from('hr_leave_requests').update({ status, reviewed_by: reviewedBy, reviewed_at: now }).eq('id', id)
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status, reviewed_by: reviewedBy, reviewed_at: now } : r))
    // Aggiorna ferie residue dipendente se approvate
    if (status === 'approvato') {
      const req = leaveRequests.find(r => r.id === id)
      if (req && req.type === 'ferie') {
        const emp = employees.find(e => e.id === req.employee_id)
        if (emp) await updateEmployee(emp.id, { ferie_giorni_residui: Math.max(0, (emp.ferie_giorni_residui || 0) - req.days) })
      }
    }
  }

  const deleteLeaveRequest = async (id: string): Promise<void> => {
    await supabase.from('hr_leave_requests').delete().eq('id', id)
    setLeaveRequests(prev => prev.filter(r => r.id !== id))
  }

  return {
    employees, leaveRequests, loading,
    addEmployee, updateEmployee, deleteEmployee,
    addLeaveRequest, updateLeaveStatus, deleteLeaveRequest,
    reload: loadData,
  }
}
