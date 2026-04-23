'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface HREvent {
  id: string
  record_id: string
  profile_id: string
  created_at: string
  employee_name: string
  record_date: string | null
}

interface Props {
  onOpenHR?: (profileId?: string) => void
}

export default function LiveHREventsWidget({ onOpenHR }: Props) {
  const [events, setEvents] = useState<HREvent[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const { data: codes } = await supabase
        .from('hr_modification_codes')
        .select('id, record_id, profile_id, created_at')
        .eq('status', 'requested')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!codes?.length) {
        if (mountedRef.current) { setEvents([]); setLoading(false); setLastUpdate(new Date()) }
        return
      }

      const profileIds = Array.from(new Set(codes.map((c: any) => c.profile_id)))
      const recordIds = codes.map((c: any) => c.record_id)
      const [{ data: profiles }, { data: records }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', profileIds),
        supabase.from('hr_work_records').select('id, date').in('id', recordIds),
      ])
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || p.email || 'Dipendente']))
      const recordMap = new Map((records || []).map((r: any) => [r.id, r.date]))

      if (mountedRef.current) {
        setEvents(codes.map((c: any) => ({
          id: c.id,
          record_id: c.record_id,
          profile_id: c.profile_id,
          created_at: c.created_at,
          employee_name: profileMap.get(c.profile_id) || 'Dipendente',
          record_date: recordMap.get(c.record_id) || null,
        })))
        setLastUpdate(new Date())
      }
    } catch (e) {
      console.error('[LiveHREventsWidget]', e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 30_000)

    const channel = supabase
      .channel('live-hr-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_modification_codes' }, () => {
        fetchEvents()
      })
      .subscribe((status) => {
        if (mountedRef.current) setLive(status === 'SUBSCRIBED')
      })

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  if (loading) return null
  if (events.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Richieste Timbratura</span>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full animate-pulse">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {live
              ? <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-500 font-semibold">Live</span></>
              : <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-400 font-semibold">Polling</span></>
            }
          </div>
          <button
            onClick={() => fetchEvents()}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Events */}
      <div className="divide-y divide-slate-100/80">
        <AnimatePresence>
          {events.map((e, i) => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onOpenHR?.(e.profile_id)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                {e.employee_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{e.employee_name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {e.record_date
                    ? `Modifica del ${new Date(e.record_date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : 'Modifica timbratura'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-slate-400 hidden group-hover:inline">
                  {new Date(e.created_at).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Apri →</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50/60 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          {lastUpdate ? `Aggiornato ${lastUpdate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
        <button
          onClick={() => onOpenHR?.()}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
        >
          Gestisci nel pannello HR →
        </button>
      </div>
    </motion.div>
  )
}
