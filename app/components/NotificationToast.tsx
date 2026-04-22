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

  if (notifications.length === 0) return null
  const n = notifications[0] // show one at a time, centered

  return (
    <AnimatePresence>
      <motion.div
        key={n.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={() => dismiss(n.id)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-6 pb-8 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <button onClick={() => dismiss(n.id)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Nuova richiesta</p>
            <h2 className="text-xl font-bold">Modifica Timbratura</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">
                {n.employeeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{n.employeeName}</p>
                <p className="text-xs text-slate-500 mt-0.5">ha inviato una richiesta di modifica</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mb-5">📅 Record del <span className="font-semibold text-slate-600">{n.recordDate}</span></p>

            {notifications.length > 1 && (
              <p className="text-xs text-center text-amber-600 font-medium mb-4">+{notifications.length - 1} altra/e richiesta/e in coda</p>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => { onOpenHR?.(); notifications.forEach(x => dismiss(x.id)) }}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/25"
              >
                Apri pannello HR
              </button>
              <button
                onClick={() => dismiss(n.id)}
                className="px-4 py-3 bg-slate-100 text-slate-500 text-sm font-semibold rounded-2xl hover:bg-slate-200 active:scale-95 transition-all"
              >
                Dopo
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
