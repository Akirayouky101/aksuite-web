'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, LayoutGrid, Phone, Sparkles, Users, X, type LucideIcon } from 'lucide-react'
import styles from './MacShell.module.css'

type NavigationItem = readonly [id: string, title: string, icon: LucideIcon]
const EXIT_DURATION = 240

const groups = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid, items: ['today'], color: '#ed826b' },
  { id: 'operations', title: 'Operatività', icon: Phone, items: ['calls', 'calendar', 'todos', 'work_items'], color: '#67c6dc' },
  { id: 'management', title: 'Gestione', icon: Users, items: ['clients', 'notes', 'payments', 'passwords'], color: '#b29bdb' },
  { id: 'tools', title: 'Strumenti', icon: Sparkles, items: ['shopping', 'photos', 'users'], color: '#e6a8c5' },
] as const

export default function WebOrbitNavigation({ open, section, items, onNavigate, onClose }: {
  open: boolean
  section: string
  items: readonly NavigationItem[]
  onNavigate: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const savedOverflow = useRef<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const group = groups.find(entry => entry.id === selectedGroup)
  const destinations = group ? group.items.flatMap(id => items.filter(item => item[0] === id)) : []

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open) {
      setSelectedGroup(null)
      if (savedOverflow.current === null) savedOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (!element.open) element.showModal()
      return
    }
    if (!element.open) return
    const surface = content.current
    const finish = () => {
      if (element.open) {
        element.close()
      }
      if (savedOverflow.current !== null) {
        document.body.style.overflow = savedOverflow.current
        savedOverflow.current = null
      }
    }
    const onEnd = (event: AnimationEvent) => {
      if (event.target === surface) finish()
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeout = window.setTimeout(finish, reducedMotion ? 0 : EXIT_DURATION + 50)
    surface?.addEventListener('animationend', onEnd)
    return () => {
      window.clearTimeout(timeout)
      surface?.removeEventListener('animationend', onEnd)
    }
  }, [open])

  useEffect(() => {
    const element = dialog.current
    return () => {
      element?.close()
      if (savedOverflow.current !== null) {
        document.body.style.overflow = savedOverflow.current
        savedOverflow.current = null
      }
    }
  }, [])

  return (
    <dialog ref={dialog} className={styles.orbitDialog} aria-labelledby="orbit-heading"
      data-state={open ? 'open' : 'closing'}
      style={{ '--orbit-exit-duration': `${EXIT_DURATION}ms` } as React.CSSProperties}
      onClickCapture={event => { if (!open) { event.preventDefault(); event.stopPropagation() } }}
      onCancel={event => { event.preventDefault(); onClose() }}
      onKeyDown={event => {
        if (!open) {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.shiftKey && !event.altKey) return
          event.preventDefault(); event.stopPropagation(); return
        }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() }
      }}>
      <div className={styles.orbitBackdrop} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
        <div ref={content} className={styles.orbitContent}>
          <header className={styles.orbitHeading}>
            <h2 id="orbit-heading">AK SUITE</h2>
            <p>IL TUO SPAZIO, IN ORBITA</p>
            <button type="button" className={`${styles.iconButton} ${styles.closeOrbit}`}
              aria-label="Chiudi menu" onClick={onClose}><X size={20} /></button>
          </header>
          <div className={styles.orbitLayout}>
            <nav className={styles.orbitStage} aria-label="Gruppi di sezioni">
              {groups.map(({ id, title, icon: Icon, color }, index) => (
                <button key={id} type="button" className={styles.orbitNode}
                  style={{ '--orbit-accent': color, '--orbit-delay': `${index * 45}ms` } as React.CSSProperties}
                  aria-expanded={id === 'dashboard' ? undefined : selectedGroup === id}
                  aria-controls={id === 'dashboard' ? undefined : 'orbit-destinations'}
                  data-selected={selectedGroup === id}
                  onClick={() => id === 'dashboard' ? onNavigate('today') : setSelectedGroup(id)}>
                  <Icon aria-hidden="true" />
                  <span>{title}</span>
                </button>
              ))}
              <button type="button" className={styles.orbitCore} aria-label="Chiudi menu principale" onClick={onClose}>
                <strong>AK</strong><X size={16} aria-hidden="true" />
              </button>
            </nav>
            <section id="orbit-destinations" className={styles.destinationPanel} aria-live="polite" aria-label={group?.title || 'Destinazioni'}>
              <div key={selectedGroup || 'hint'} className={styles.destinationContent}>
              {group ? <>
                <div className={styles.destinationHeading}>
                  <div><h3>{group.title}</h3><p>SCEGLI UNA DESTINAZIONE</p></div>
                  <button type="button" className={styles.iconButton} aria-label="Chiudi destinazioni" onClick={() => setSelectedGroup(null)}><X size={18} /></button>
                </div>
                {destinations.map(([id, title, Icon], index) => (
                  <button type="button" key={id} className={styles.destination}
                    style={{ '--orbit-delay': `${index * 35}ms` } as React.CSSProperties}
                    aria-current={section === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
                    <Icon size={22} aria-hidden="true" /><span>{title}</span><ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                ))}
              </> : <p className={styles.destinationHint}>Scegli un gruppo per aprire le tue sezioni.</p>}
              </div>
            </section>
          </div>
          <p className={styles.orbitHelp}>Scegli una destinazione · Esc per chiudere</p>
        </div>
      </div>
    </dialog>
  )
}
