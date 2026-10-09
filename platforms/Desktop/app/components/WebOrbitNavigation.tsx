'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { LayoutGrid, Phone, Sparkles, Users, X, type LucideIcon } from 'lucide-react'
import styles from './MacShell.module.css'
import { webSectionStyle } from './webSectionColors'

type NavigationItem = readonly [id: string, title: string, icon: LucideIcon]
const groups = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid, items: ['today'], color: '#ed826b', x: 500, y: 180 },
  { id: 'operations', title: 'Operatività', icon: Phone, items: ['calls', 'calendar', 'todos', 'work_items'], color: '#67c6dc', x: 360, y: 320 },
  { id: 'management', title: 'Gestione', icon: Users, items: ['clients', 'notes', 'payments', 'passwords'], color: '#b29bdb', x: 640, y: 320 },
  { id: 'tools', title: 'Strumenti', icon: Sparkles, items: ['shopping', 'photos', 'users'], color: '#e6a8c5', x: 500, y: 460 },
] as const

export default function WebOrbitNavigation({ open, section, items, onNavigate, onClose }: {
  open: boolean
  section: string
  items: readonly NavigationItem[]
  onNavigate: (id: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const savedOverflow = useRef<string | null>(null)
  const expandedRef = useRef<string[]>([])
  const pendingDestination = useRef<string | null>(null)
  const navigateRef = useRef(onNavigate)
  const [expanded, setExpanded] = useState<string[]>([])
  const [phase, setPhase] = useState('open')
  navigateRef.current = onNavigate

  const updateExpanded = (ids: string[]) => {
    expandedRef.current = ids
    setExpanded(ids)
  }
  const requestDestination = (id: string) => {
    pendingDestination.current = id
    onClose()
  }

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open) {
      expandedRef.current = []
      setExpanded([])
      setPhase('open')
      pendingDestination.current = null
      if (savedOverflow.current === null) savedOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (!element.open) element.showModal()
      return
    }
    if (!element.open) return
    const timers: number[] = []
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay))
    }
    const finish = () => {
      element.close()
      if (savedOverflow.current !== null) {
        document.body.style.overflow = savedOverflow.current
        savedOverflow.current = null
      }
      const destination = pendingDestination.current
      pendingDestination.current = null
      if (destination) navigateRef.current(destination)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    setPhase('branches')
    const ids = groups.filter(group => expandedRef.current.includes(group.id)).map(group => group.id).reverse()
    ids.forEach((id, index) => {
      schedule(() => {
        expandedRef.current = expandedRef.current.filter(entry => entry !== id)
        setExpanded(expandedRef.current)
      }, index * 500)
    })
    const branchDuration = ids.length * 500
    schedule(() => setPhase('atom'), branchDuration)
    schedule(() => setPhase('core'), branchDuration + 420)
    schedule(finish, branchDuration + 620)
    return () => timers.forEach(window.clearTimeout)
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
    <dialog ref={dialog} className={styles.atomicDialog} aria-label="Menu AK Suite ad atomo"
      data-phase={phase}
      onClickCapture={event => { if (!open) { event.preventDefault(); event.stopPropagation() } }}
      onCancel={event => { event.preventDefault(); if (open) onClose() }}
      onKeyDown={event => {
        if (!open) {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.shiftKey && !event.altKey) return
          event.preventDefault(); event.stopPropagation()
        } else if (event.key === 'Escape') {
          event.preventDefault(); event.stopPropagation(); onClose()
        }
      }}>
      <div className={styles.atomicBackdrop} onClick={event => {
        if (event.target === event.currentTarget && open) onClose()
      }}>
        <div className={styles.atomicBoard}>
          <nav className={styles.atomicStage} aria-label="Categorie">
            <div className={styles.electronField} aria-hidden="true">
              {[0, 60, 120].map((angle, index) => (
                <div key={angle} className={styles.electronTilt} style={{ transform: `rotate(${angle}deg)` }}>
                  <div className={styles.electronOrbit}>
                    <div className={styles.electronTrack} style={{ animationDuration: `${5.5 + index * 1.3}s` }}>
                      <i /><i />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <svg className={styles.atomicLinks} viewBox="0 0 1000 640" aria-hidden="true">
              {groups.map(group => <line key={group.id} x1="500" y1="320" x2={group.x} y2={group.y}
                stroke={group.color} strokeDasharray="4 5" />)}
            </svg>
            {groups.map(({ id, title, icon: Icon, color, x, y }) => (
              <button key={id} type="button" className={styles.atomicCategory}
                style={{ '--orbit-accent': color, left: `${x / 10}%`, top: `${y / 6.4}%` } as CSSProperties}
                aria-expanded={id === 'dashboard' ? undefined : expanded.includes(id)}
                aria-controls={id === 'dashboard' ? undefined : `atomic-${id}`}
                onClick={() => id === 'dashboard' ? requestDestination('today') :
                  updateExpanded(expanded.includes(id) ? expanded.filter(entry => entry !== id) : [...expanded, id])}>
                <Icon aria-hidden="true" /><span>{title}</span>
              </button>
            ))}
          </nav>
          <button type="button" className={styles.atomicCore} aria-label="Chiudi menu principale" onClick={onClose}>
            <strong>AK</strong><X size={16} aria-hidden="true" />
          </button>
          <div className={styles.atomicBranches}>
            {groups.filter(group => group.id !== 'dashboard').map(group => {
              const destinations = group.items.flatMap(id => items.filter(item => item[0] === id))
              const active = expanded.includes(group.id)
              return (
                <section key={group.id} id={`atomic-${group.id}`}
                  className={styles.atomicBranch} data-group={group.id} data-open={active}
                  aria-label={group.title} aria-hidden={!active}
                  style={{ '--orbit-accent': group.color } as CSSProperties}>
                  <h3>{group.title}</h3>
                  <svg className={styles.atomicLinks} viewBox="0 0 1000 640" aria-hidden="true">
                    {destinations.map(([id], index) => {
                      const x = group.id === 'tools' ? 500 + (index - (destinations.length - 1) / 2) * 164 :
                        group.id === 'operations' ? 100 : 900
                      const y = group.id === 'tools' ? 586 : 320 + (index - (destinations.length - 1) / 2) * 92
                      return <line key={id} x1={group.x} y1={group.y} x2={x} y2={y} stroke={group.color} />
                    })}
                  </svg>
                  {destinations.map(([id, title, Icon], index) => {
                    const x = group.id === 'tools' ? 500 + (index - (destinations.length - 1) / 2) * 164 :
                      group.id === 'operations' ? 100 : 900
                    const y = group.id === 'tools' ? 586 : 320 + (index - (destinations.length - 1) / 2) * 92
                    return (
                      <button type="button" key={id} className={styles.atomicDestination}
                        style={{ ...webSectionStyle(id), left: `${x / 10}%`, top: `${y / 6.4}%`,
                          '--entry-x': group.id === 'operations' ? '120px' : group.id === 'management' ? '-120px' : '0px',
                          '--entry-y': group.id === 'tools' ? '-20px' : '0px',
                          '--entry-delay': `${(active ? index : destinations.length - 1 - index) * 50}ms`,
                        } as CSSProperties}
                        tabIndex={active && open ? 0 : -1}
                        aria-current={section === id ? 'page' : undefined} onClick={() => requestDestination(id)}>
                        <Icon size={22} aria-hidden="true" /><span>{title}</span>
                      </button>
                    )
                  })}
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </dialog>
  )
}
