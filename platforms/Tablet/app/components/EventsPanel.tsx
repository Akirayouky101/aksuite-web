'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Clock, CheckCircle2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ModEvent {
  id: string
  record_id: string
  profile_id: string
  created_at: string
  employee_name: string
  record_date: string | null
}

interface Props {
  onOpenHR?: () => void
}

export default function EventsPanel({ onOpenHR }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [events, setEvents] = useState<ModEvent[]>([])
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { data: codes, error } = await supabase
        .from('hr_modification_codes')
        .select('id, record_id, profile_id, created_at')
        .eq('status', 'requested')
        .order('created_at', { ascending: false })

      if (error) { console.error('[EventsPanel] codes error:', error); if (mountedRef.current) setLoading(false); return }
      if (!codes?.length) { if (mountedRef.current) { setEvents([]); setLoading(false) }; return }

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
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()

    // Polling ogni 30 secondi come fallback al realtime
    const interval = setInterval(fetchEvents, 30_000)

    const channel = supabase
      .channel('events-panel-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_modification_codes' }, () => fetchEvents())
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const count = events.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(p => !p)}
        className="relative w-10 h-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm active:scale-95 transition-all"
        title="Avvisi"
      >
        <Bell className="w-[18px] h-[18px]" />
        {loading && count === 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-slate-300 rounded-full animate-pulse" />
        )}
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/60 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-amber-600" />
                  <span className="font-bold text-slate-800 text-sm">Avvisi</span>
                  {count > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">{count}</span>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Events list */}
              <div className="max-h-72 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <CheckCircle2 size={30} className="text-emerald-300" />
                    <p className="text-slate-400 text-sm font-medium">Nessun avviso in sospeso</p>
                  </div>
                ) : (
                  events.map(e => (
                    <button
                      key={e.id}
                      onClick={() => { setIsOpen(false); onOpenHR?.() }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-slate-100/80 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock size={14} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{e.employee_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {e.record_date
                              ? `Richiesta modifica del ${new Date(e.record_date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`
                              : 'Richiesta modifica timbratura'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(e.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {count > 0 && (
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => { setIsOpen(false); onOpenHR?.() }}
                    className="w-full text-xs font-semibold text-amber-600 hover:text-amber-700 text-center py-1 transition-colors"
                  >
                    Apri pannello HR →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
