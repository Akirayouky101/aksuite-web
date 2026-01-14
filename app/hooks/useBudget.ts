'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [user, setUser] = useState<any>(null)

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load transactions when user changes
  useEffect(() => {
    if (user) {
      loadTransactions()
    } else {
      setTransactions([])
      setIsLoading(false)
    }
  }, [user])

  const loadTransactions = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

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
    loadTransactions
  }
}
