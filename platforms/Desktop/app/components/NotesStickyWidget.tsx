'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Sparkles, StickyNote } from 'lucide-react'
import { Note } from '../hooks/useNotes'

interface NotesStickyWidgetProps {
  notes: Note[]
  onOpenNote: (note: Note) => void
  onAddNote: () => void
}

const STICKY_COLORS: Record<string, { bg: string; border: string; tape: string }> = {
  blue: { bg: '#dfefff', border: '#a9cff2', tape: '#cfe4ff' },
  green: { bg: '#e3f6ea', border: '#a9dcc0', tape: '#c8ecd6' },
  yellow: { bg: '#fff3c9', border: '#eccf7a', tape: '#ffe8a3' },
  red: { bg: '#ffe1da', border: '#f0aa9b', tape: '#ffd0c4' },
  purple: { bg: '#ece3ff', border: '#c6b4f2', tape: '#ddd0ff' },
}

const getSticky = (color: string) => STICKY_COLORS[color] || STICKY_COLORS.yellow

export default function NotesStickyWidget({ notes, onOpenNote, onAddNote }: NotesStickyWidgetProps) {
  const stack = [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => { if (index >= stack.length) setIndex(0) }, [stack.length, index])

  if (stack.length === 0) {
    return (
      <div className="ak-hero-sticker flex min-h-48 flex-col justify-between rounded-[1.75rem] p-6">
        <Sparkles className="h-7 w-7 text-[#e45f4e]" />
        <div>
          <p className="text-sm font-bold text-[#716a91]">Nessun appunto in vista</p>
          <button onClick={onAddNote} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#2d2754] px-3 py-2 text-xs font-bold text-[#fff6df]">
            <Plus className="h-3.5 w-3.5" />Nuova nota
          </button>
        </div>
      </div>
    )
  }

  const current = stack[index]
  const sticky = getSticky(current.color)
  const prev = () => { setDirection(-1); setIndex(i => (i - 1 + stack.length) % stack.length) }
  const next = () => { setDirection(1); setIndex(i => (i + 1) % stack.length) }
  const goTo = (i: number) => { setDirection(i > index ? 1 : -1); setIndex(i) }
  const previewCount = Math.min(2, stack.length - 1)
  const showDots = stack.length > 1 && stack.length <= 8

  return (
    <div className="relative flex min-h-48 flex-col justify-between rounded-[1.75rem] p-4">
      {Array.from({ length: previewCount }).map((_, d) => {
        const depth = d + 1
        const note = stack[(index + depth) % stack.length]
        return (
          <div
            key={`preview-${depth}`}
            className="pointer-events-none absolute inset-4 rounded-[1.4rem] border border-dashed"
            style={{
              background: getSticky(note.color).bg,
              borderColor: getSticky(note.color).border,
              transform: `rotate(${depth % 2 === 0 ? 3 : -3}deg) scale(${1 - depth * 0.04}) translateY(${depth * 6}px)`,
              zIndex: 1 - depth,
              opacity: 0.6,
            }}
          />
        )
      })}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.button
          key={current.id}
          type="button"
          custom={direction}
          onClick={() => onOpenNote(current)}
          initial={{ opacity: 0, x: direction > 0 ? 40 : -40, rotate: -6 }}
          animate={{ opacity: 1, x: 0, rotate: -2 }}
          exit={{ opacity: 0, x: direction > 0 ? -40 : 40, rotate: 6 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          whileHover={{ rotate: 0, scale: 1.02 }}
          className="relative z-10 flex min-h-48 w-full flex-col justify-between rounded-[1.4rem] border p-5 text-left shadow-lg"
          style={{ background: sticky.bg, borderColor: sticky.border }}
        >
          <span className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rounded-sm" style={{ background: sticky.tape, opacity: 0.85 }} />
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 text-[#e45f4e]"><StickyNote className="h-4 w-4" /></span>
            {stack.length > 1 && <span className="text-[10px] font-black uppercase tracking-widest text-[#8a7f9f]">{index + 1}/{stack.length}</span>}
          </div>
          <div className="mt-2">
            <p className="line-clamp-1 text-sm font-black text-[#2d2754]">{current.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#716a91]">{current.content || 'Nessun contenuto'}</p>
          </div>
        </motion.button>
      </AnimatePresence>

      {stack.length > 1 && (
        <div className="relative z-10 mt-3 flex items-center justify-center gap-2">
          <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#716a91] transition hover:bg-white hover:text-[#e45f4e]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {showDots && stack.map((note, i) => (
            <button
              key={note.id}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-[#e45f4e]' : 'w-1.5 bg-[#d8cbb8]'}`}
            />
          ))}
          <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#716a91] transition hover:bg-white hover:text-[#e45f4e]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
