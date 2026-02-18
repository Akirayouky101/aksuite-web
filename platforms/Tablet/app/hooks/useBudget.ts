'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  emoji: string
}

export function useBudget() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Load transactions when user changes
  useEffect(() => {
    if (!user) { setTransactions([]); setIsLoading(false); return }
    let mounted = true
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('budget_transactions')
          .select('*')
          .order('date', { ascending: false })
        if (error) throw error
        if (mounted) setTransactions(data || [])
      } catch (error) {
        console.error('Error loading transactions:', error)
        if (mounted) setTransactions([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadTransactions()
    return () => { mounted = false }
  }, [user?.id])

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('budget_transactions')
        .insert([{
          user_id: user.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          emoji: transaction.emoji
        }])
        .select()
        .single()

      if (error) throw error

      setTransactions(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  const getStats = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const balance = income - expenses

    // Category breakdown
    const categoryTotals: Record<string, number> = {}
    transactions.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = 0
      }
      categoryTotals[t.category] += Number(t.amount)
    })

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance,
      categoryTotals,
      transactionCount: transactions.length
    }
  }

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate)
  }

  const getTransactionsByCategory = (category: string) => {
    return transactions.filter(t => t.category === category)
  }

  return {
    transactions,
    isLoading,
    user,
    addTransaction,
    deleteTransaction,
    getStats,
    getTransactionsByDateRange,
    getTransactionsByCategory,
  }
}
