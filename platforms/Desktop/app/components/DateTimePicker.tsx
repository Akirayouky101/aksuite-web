'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  mode?: 'date' | 'datetime'
  placeholder?: string
  clearable?: boolean
  required?: boolean
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]
const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

const pad = (n: number) => String(n).padStart(2, '0')

export function localDateTimeToIso(value: string): string {
  if (!value) return ''
  const [datePart, timePart = '00:00'] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute).toISOString()
}

function parseValue(value: string): { date: Date | null; hour: number; minute: number } {
  if (!value) return { date: null, hour: 9, minute: 0 }
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    const instant = new Date(value)
    if (!Number.isNaN(instant.getTime())) {
      return {
        date: new Date(instant.getFullYear(), instant.getMonth(), instant.getDate()),
        hour: instant.getHours(),
        minute: instant.getMinutes()
      }
    }
  }
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return { date: null, hour: 9, minute: 0 }
  const date = new Date(y, m - 1, d)
  if (timePart) {
    const [h, min] = timePart.split(':').map(Number)
    return { date, hour: h ?? 9, minute: min ?? 0 }
  }
  return { date, hour: 9, minute: 0 }
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export default function DateTimePicker({
  value,
  onChange,
  mode = 'datetime',
  placeholder = 'Seleziona data',
  clearable = false
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: 'top' | 'bottom' } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const parsed = useMemo(() => parseValue(value), [value])
  const [viewYear, setViewYear] = useState(() => (parsed.date ?? new Date()).getFullYear())
  const [viewMonth, setViewMonth] = useState(() => (parsed.date ?? new Date()).getMonth())

  useEffect(() => {
    setManualDate(parsed.date ? `${pad(parsed.date.getDate())}/${pad(parsed.date.getMonth() + 1)}/${parsed.date.getFullYear()}` : '')
  }, [parsed.date])

  const commitManualDate = () => {
    const match = manualDate.trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/)
    if (!match) return
    const day = Number(match[1]), month = Number(match[2]), year = Number(match[3])
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return
    commitDate(date)
  }

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const estimatedHeight = mode === 'datetime' ? 420 : 340
    const spaceBelow = window.innerHeight - rect.bottom
    const placement: 'top' | 'bottom' = spaceBelow < estimatedHeight && rect.top > estimatedHeight ? 'top' : 'bottom'
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 24)
    setPos({
      top: placement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      width,
      placement
    })
  }

  useEffect(() => {
    if (!open) return
    const d = parsed.date ?? new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    updatePosition()
    const handle = () => updatePosition()
    window.addEventListener('resize', handle)
    window.addEventListener('scroll', handle, true)
    return () => {
      window.removeEventListener('resize', handle)
      window.removeEventListener('scroll', handle, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const firstIndex = (firstDay.getDay() + 6) % 7 // Monday-first
    const days: (Date | null)[] = []
    for (let i = 0; i < firstIndex; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(viewYear, viewMonth, i))
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  const commitDate = (day: Date) => {
    const y = day.getFullYear(), m = pad(day.getMonth() + 1), d = pad(day.getDate())
    if (mode === 'date') {
      onChange(`${y}-${m}-${d}`)
      setOpen(false)
    } else {
      onChange(`${y}-${m}-${d}T${pad(parsed.hour)}:${pad(parsed.minute)}`)
    }
  }

  const commitTime = (hour: number, minute: number) => {
    const base = parsed.date ?? new Date()
    const y = base.getFullYear(), m = pad(base.getMonth() + 1), d = pad(base.getDate())
    onChange(`${y}-${m}-${d}T${pad(hour)}:${pad(minute)}`)
  }

  const goToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    commitDate(now)
  }

  const today = new Date()

  const displayLabel = () => {
    if (!parsed.date) return placeholder
    const d = parsed.date
    const datePart = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
    return mode === 'date' ? datePart : `${datePart}, ${pad(parsed.hour)}:${pad(parsed.minute)}`
  }

  return (
    <>
      <div className="flex w-full items-center gap-2 rounded-xl border border-ak-line/60 bg-ak-panel/80 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-100">
        <input
          value={manualDate}
          onChange={event => setManualDate(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitManualDate() } }}
          onBlur={commitManualDate}
          placeholder="gg/mm/aaaa"
          aria-label="Inserisci data"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ak-text outline-none placeholder:text-ak-subtle"
        />
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          title={displayLabel()}
          className="flex shrink-0 items-center gap-2 py-1 text-ak-subtle hover:text-ak-cyan"
        >
          {clearable && value && <span role="button" onClick={(e) => { e.stopPropagation(); onChange(''); setManualDate('') }} title="Cancella"><X size={14} /></span>}
          {mode === 'datetime' && <Clock size={15} />}
          <CalendarIcon size={15} />
        </button>
      </div>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: pos.placement === 'bottom' ? pos.top : undefined,
            bottom: pos.placement === 'top' ? window.innerHeight - pos.top : undefined,
            left: pos.left,
            width: pos.width,
            maxHeight: 'calc(100dvh - 24px)',
            overflowY: 'auto'
          }}
          className="ak-date-popover z-[9999] bg-ak-panel rounded-2xl shadow-2xl border border-ak-line/60 p-4"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11 } return m - 1 })}
              className="w-7 h-7 rounded-lg hover:bg-ak-inset flex items-center justify-center text-ak-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-ak-text">{MONTHS[viewMonth]} {viewYear}</span>
            <button
              type="button"
              onClick={() => setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0 } return m + 1 })}
              className="w-7 h-7 rounded-lg hover:bg-ak-inset flex items-center justify-center text-ak-muted"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-ak-subtle py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />
              const selected = parsed.date && isSameDay(day, parsed.date)
              const isToday = isSameDay(day, today)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => commitDate(day)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
                    selected
                      ? 'bg-ak-accent text-white font-semibold shadow-md shadow-indigo-500/30'
                      : isToday
                      ? 'bg-ak-hover text-ak-cyan font-semibold'
                      : 'text-ak-text hover:bg-ak-inset'
                  }`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Time selectors */}
          {mode === 'datetime' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ak-line">
              <Clock size={14} className="text-ak-subtle flex-shrink-0" />
              <select
                value={parsed.hour}
                onChange={(e) => commitTime(Number(e.target.value), parsed.minute)}
                className="flex-1 px-2 py-1.5 bg-ak-panel border border-ak-line rounded-lg text-sm text-ak-text focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
              <span className="text-ak-subtle font-medium">:</span>
              <select
                value={parsed.minute}
                onChange={(e) => commitTime(parsed.hour, Number(e.target.value))}
                className="flex-1 px-2 py-1.5 bg-ak-panel border border-ak-line rounded-lg text-sm text-ak-text focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {Array.from({ length: 60 }, (_, m) => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-ak-line">
            <button type="button" onClick={goToday} className="text-xs font-medium text-ak-cyan hover:text-ak-cyan">
              Oggi
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-ak-accent hover:bg-ak-accent rounded-lg transition-colors"
            >
              Fatto
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
