'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface HRNotification {
  id: string
  employeeName: string
  recordDate: string
}

interface NotificationToastProps {
  onOpenHR?: () => void
}

export default function NotificationToast({ onOpenHR }: NotificationToastProps) {
  const [notifications, setNotifications] = useState<HRNotification[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const fetchDetails = useCallback(async (id: string, profileId: string, recordId: string) => {
    try {
      const [{ data: profileData }, { data: recordData }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', profileId).single(),
        supabase.from('hr_work_records').select('date').eq('id', recordId).single(),
      ])
      if (!mountedRef.current) return
      const employeeName = profileData?.full_name || 'Dipendente'
      const recordDate = recordData?.date
        ? new Date(recordData.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'data sconosciuta'
      setNotifications(prev => [...prev, { id, employeeName, recordDate }])
      setTimeout(() => {
        if (mountedRef.current) dismiss(id)
      }, 10000)
    } catch (e) {
      console.error('[NotificationToast] error:', e)
    }
  }, [dismiss])

  useEffect(() => {
    const channel = supabase
      .channel('hr-mod-toast')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hr_modification_codes',
        filter: 'status=eq.requested',
      }, (payload) => {
        const row = payload.new as { id: string; profile_id: string; record_id: string }
        fetchDetails(row.id, row.profile_id, row.record_id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchDetails])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-4 w-80"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Richiesta modifica timbratura</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-700">{n.employeeName}</span> ha richiesto una modifica
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Record del {n.recordDate}</p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Chiudi notifica"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { onOpenHR?.(); dismiss(n.id) }}
                className="flex-1 py-2 px-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Apri HR
              </button>
              <button
                onClick={() => dismiss(n.id)}
                className="py-2 px-3 bg-slate-100 text-slate-500 text-xs font-medium rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
              >
                Ignora
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
