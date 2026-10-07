'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, LayoutGrid, Phone, Sparkles, Users, X, type LucideIcon } from 'lucide-react'
import styles from './MacShell.module.css'

type NavigationItem = readonly [id: string, title: string, icon: LucideIcon]

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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const group = groups.find(entry => entry.id === selectedGroup)
  const destinations = group ? group.items.flatMap(id => items.filter(item => item[0] === id)) : []

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open) {
      setSelectedGroup(null)
      if (!element.open) element.showModal()
      const overflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        element.close()
        document.body.style.overflow = overflow
      }
    }
    element.close()
  }, [open])

  return (
    <dialog ref={dialog} className={styles.orbitDialog} aria-labelledby="orbit-heading"
      onCancel={event => { event.preventDefault(); onClose() }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() }
      }}>
      <div className={styles.orbitBackdrop} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
        <div className={styles.orbitContent}>
          <header className={styles.orbitHeading}>
            <h2 id="orbit-heading">AK SUITE</h2>
            <p>IL TUO SPAZIO, IN ORBITA</p>
            <button type="button" className={`${styles.iconButton} ${styles.closeOrbit}`}
              aria-label="Chiudi menu" onClick={onClose}><X size={20} /></button>
          </header>
          <div className={styles.orbitLayout}>
            <nav className={styles.orbitStage} aria-label="Gruppi di sezioni">
              {groups.map(({ id, title, icon: Icon, color }) => (
                <button key={id} type="button" className={styles.orbitNode}
                  style={{ '--orbit-accent': color } as React.CSSProperties}
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
              {group ? <>
                <div className={styles.destinationHeading}>
                  <div><h3>{group.title}</h3><p>SCEGLI UNA DESTINAZIONE</p></div>
                  <button type="button" className={styles.iconButton} aria-label="Chiudi destinazioni" onClick={() => setSelectedGroup(null)}><X size={18} /></button>
                </div>
                {destinations.map(([id, title, Icon]) => (
                  <button type="button" key={id} className={styles.destination}
                    aria-current={section === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
                    <Icon size={22} aria-hidden="true" /><span>{title}</span><ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                ))}
              </> : <p className={styles.destinationHint}>Scegli un gruppo per aprire le tue sezioni.</p>}
            </section>
          </div>
          <p className={styles.orbitHelp}>Scegli una destinazione · Esc per chiudere</p>
        </div>
      </div>
    </dialog>
  )
}
