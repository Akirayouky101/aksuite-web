'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Phone, Wrench, StickyNote, Calendar, Users, MapPin, Clock, ArrowRight, Command } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  calls: any[]
  lavorazioni: any[]
  notes: any[]
  events: any[]
  clients: any[]
  visits: any[]
  onOpenCall?: (call: any) => void
  onOpenLavorazione?: (lav: any) => void
  onOpenNote?: (note: any) => void
  onOpenEvent?: (event: any) => void
  onOpenClient?: (client: any) => void
  onOpenVisit?: () => void
}

interface SearchResult {
  id: string
  type: 'call' | 'lavorazione' | 'note' | 'event' | 'client' | 'visit'
  title: string
  subtitle: string
  icon: any
  iconBg: string
  item: any
}

const typeConfig = {
  call: { label: 'Chiamata', icon: Phone, bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'from-blue-500 to-indigo-600' },
  lavorazione: { label: 'Lavorazione', icon: Wrench, bg: 'bg-violet-50', text: 'text-violet-600', iconBg: 'from-violet-500 to-purple-600' },
  note: { label: 'Nota', icon: StickyNote, bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'from-emerald-500 to-teal-600' },
  event: { label: 'Evento', icon: Calendar, bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'from-rose-500 to-pink-600' },
  client: { label: 'Cliente', icon: Users, bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'from-teal-500 to-emerald-600' },
  visit: { label: 'Visita', icon: MapPin, bg: 'bg-indigo-50', text: 'text-indigo-600', iconBg: 'from-indigo-500 to-blue-600' },
}

export default function SearchModal({ isOpen, onClose, calls, lavorazioni, notes, events, clients, visits, onOpenCall, onOpenLavorazione, onOpenNote, onOpenEvent, onOpenClient, onOpenVisit }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const searchResults = useCallback((): SearchResult[] => {
    if (!query.trim()) return []
    const term = query.toLowerCase()
    const results: SearchResult[] = []

    // Search calls
    calls.forEach(c => {
      if (c.caller_name?.toLowerCase().includes(term) || c.company?.toLowerCase().includes(term) ||
          c.phone?.includes(term) || c.notes?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)) {
        results.push({ id: c.id, type: 'call', title: c.caller_name, subtitle: `${c.company || ''} - ${c.phone || ''}`.trim().replace(/^- /, ''), icon: Phone, iconBg: typeConfig.call.iconBg, item: c })
      }
    })

    // Search lavorazioni
    lavorazioni.forEach(l => {
      if (l.title?.toLowerCase().includes(term) || l.description?.toLowerCase().includes(term) ||
          l.assigned_to?.toLowerCase().includes(term) || l.address?.toLowerCase().includes(term)) {
        results.push({ id: l.id, type: 'lavorazione', title: l.title, subtitle: `${l.assigned_to || ''} - ${l.status}`.trim().replace(/^- /, ''), icon: Wrench, iconBg: typeConfig.lavorazione.iconBg, item: l })
      }
    })

    // Search notes
    notes.forEach(n => {
      if (n.title?.toLowerCase().includes(term) || n.content?.toLowerCase().includes(term)) {
        results.push({ id: n.id, type: 'note', title: n.title, subtitle: (n.content || '').substring(0, 60), icon: StickyNote, iconBg: typeConfig.note.iconBg, item: n })
      }
    })

    // Search events
    events.forEach(e => {
      if (e.title?.toLowerCase().includes(term) || e.description?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term)) {
        results.push({ id: e.id, type: 'event', title: e.title, subtitle: e.location || new Date(e.start_date).toLocaleDateString('it-IT'), icon: Calendar, iconBg: typeConfig.event.iconBg, item: e })
      }
    })

    // Search clients
    clients.forEach(c => {
      if (c.name?.toLowerCase().includes(term) || c.company?.toLowerCase().includes(term) ||
          c.phone?.includes(term) || c.email?.toLowerCase().includes(term) || c.city?.toLowerCase().includes(term)) {
        results.push({ id: c.id, type: 'client', title: c.name, subtitle: `${c.company || ''} ${c.city || ''}`.trim(), icon: Users, iconBg: typeConfig.client.iconBg, item: c })
      }
    })

    // Search visits
    visits.forEach(v => {
      if (v.visitor_name?.toLowerCase().includes(term) || v.company?.toLowerCase().includes(term) ||
          v.notes?.toLowerCase().includes(term)) {
        results.push({ id: v.id, type: 'visit', title: v.visitor_name, subtitle: v.company || '', icon: MapPin, iconBg: typeConfig.visit.iconBg, item: v })
      }
    })

    return results.slice(0, 20)
  }, [query, calls, lavorazioni, notes, events, clients, visits])

  const results = searchResults()

  // Group by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const handleSelect = (result: SearchResult) => {
    onClose()
    switch (result.type) {
      case 'call': onOpenCall?.(result.item); break
      case 'lavorazione': onOpenLavorazione?.(result.item); break
      case 'note': onOpenNote?.(result.item); break
      case 'event': onOpenEvent?.(result.item); break
      case 'client': onOpenClient?.(result.item); break
      case 'visit': onOpenVisit?.(); break
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]) }
    if (e.key === 'Escape') onClose()
  }

  useEffect(() => { setSelectedIndex(0) }, [query])

  // Scroll selected into view
  useEffect(() => {
    if (resultsRef.current) {
      const el = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-start justify-center pt-[15vh] sm:pt-[20vh] p-3"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-xl overflow-hidden">

          {/* Search Input */}
          <div className="px-5 py-4 border-b border-slate-100/80 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cerca in tutto... chiamate, clienti, lavorazioni, task..."
              className="flex-1 text-sm text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-400 font-mono border border-slate-200/60">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
            {query && results.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nessun risultato per &quot;{query}&quot;</p>
              </div>
            )}

            {!query && (
              <div className="py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
                  <Command className="w-4 h-4" />
                  <span className="text-xs font-medium">K</span>
                </div>
                <p className="text-xs text-slate-400">Inizia a digitare per cercare</p>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => {
              const config = typeConfig[type as keyof typeof typeConfig]
              return (
                <div key={type}>
                  <div className="px-5 py-2 bg-slate-50/50">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.text}`}>
                      {config.label} ({items.length})
                    </span>
                  </div>
                  {items.map((result, idx) => {
                    const globalIdx = results.indexOf(result)
                    return (
                      <button key={result.id} data-index={globalIdx}
                        onClick={() => handleSelect(result)}
                        className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-all ${
                          globalIdx === selectedIndex ? 'bg-indigo-50/80' : 'hover:bg-slate-50/80'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${result.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <result.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{result.title}</p>
                          {result.subtitle && <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>}
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
                          globalIdx === selectedIndex ? 'text-indigo-400' : 'text-slate-200'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-5 py-2.5 border-t border-slate-100/80 flex items-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200/60 font-mono">&#8593;&#8595;</kbd> naviga</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200/60 font-mono">&#9166;</kbd> apri</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200/60 font-mono">esc</kbd> chiudi</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
