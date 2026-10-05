'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Payment {
  id: string
  user_id: string
  payment_type: string
  recipient: string
  reason: string
  is_installment: boolean
  payment_mode: 'fixed' | 'salary_withholding'
  salary_percentage: number
  total_amount: number
  down_payment: number
  installment_amount: number
  installments_count: number
  paid_installments: number[]
  payers: PaymentPayer[]
  notes: string
  down_payment_due_date: string | null
  reminder_at: string | null
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_until: string | null
  down_payment_paid_at: string | null
  down_payment_payer_payments: PaymentPayerPayment[]
  installment_schedule: PaymentInstallment[]
  created_at: string
  updated_at: string
}

export interface PaymentPayer {
  name: string
  percentage: number
}

export interface PaymentInstallment {
  due_date: string | null
  payer_payments: PaymentPayerPayment[]
  amount?: number
  paid_at?: string | null
}

export interface PaymentPayerPayment {
  payer_name: string
  paid_at: string | null
  advanced_by_me?: boolean
  reimbursed_at?: string | null
}

export function paymentRemainingAmount(payment: Payment): number {
  const payers = payment.payers || []
  const schedule = payment.installment_schedule || []
  const downPaymentPaid = payers.length
    ? payers.reduce((sum, payer) => payment.down_payment_payer_payments?.some(record => record.payer_name === payer.name && record.paid_at)
      ? sum + payment.down_payment * payer.percentage / 100
      : sum, 0)
    : payment.down_payment_paid_at ? payment.down_payment : 0
  const variableSchedule = payment.payment_mode === 'salary_withholding'
    || (!payers.length && schedule.some(installment => installment.amount != null || installment.paid_at))
  const installmentsPaid = variableSchedule
    ? schedule.reduce((sum, installment) => sum + (Number(installment.amount) || 0), 0)
    : payers.length
      ? payers.reduce((sum, payer) => sum + schedule.filter(installment => installment.payer_payments?.some(record => record.payer_name === payer.name && record.paid_at)).length * payment.installment_amount * payer.percentage / 100, 0)
      : (payment.paid_installments || []).length * payment.installment_amount
  return Math.max(0, payment.total_amount - downPaymentPaid - installmentsPaid)
}

export type PaymentInput = Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setPayments([])
      setLoading(false)
      return
    }
    let mounted = true
    const loadPayments = async () => {
      try {
        const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
        if (error) throw error
        if (mounted) setPayments(data || [])
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadPayments()
    return () => { mounted = false }
  }, [user?.id])

  const addPayment = async (paymentData: PaymentInput) => {
    if (!user) return null
    try {
      const { data, error } = await supabase.from('payments').insert([{ ...paymentData, user_id: user.id }]).select().single()
      if (error) throw error
      setPayments(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error adding payment:', error)
      return null
    }
  }

  const updatePayment = async (id: string, updates: Partial<PaymentInput>) => {
    const previous = payments
    setPayments(current => current.map(payment => payment.id === id ? { ...payment, ...updates, updated_at: new Date().toISOString() } : payment))
    try {
      const { data, error } = await supabase.from('payments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) throw error
      setPayments(prev => prev.map(payment => payment.id === id ? data : payment))
      return data
    } catch (error) {
      console.error('Error updating payment:', error)
      setPayments(current => current.map(payment => payment.id === id ? previous.find(item => item.id === id) || payment : payment))
      return previous.find(payment => payment.id === id) || null
    }
  }

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
      setPayments(prev => prev.filter(payment => payment.id !== id))
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  return { payments, loading, addPayment, updatePayment, deletePayment }
}