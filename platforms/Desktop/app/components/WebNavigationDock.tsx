'use client'

import { LayoutGrid, type LucideIcon } from 'lucide-react'
import styles from './MacShell.module.css'
import { webSectionStyle } from './webSectionColors'

export default function WebNavigationDock({ menuOpen, section, items, onNavigate, onOpen }: {
  menuOpen: boolean
  section: string
  items: readonly (readonly [id: string, title: string, icon: LucideIcon])[]
  onNavigate: (id: string) => void
  onOpen: () => void
}) {
  const shortcut = (id: string) => {
    const item = items.find(item => item[0] === id)
    if (!item) return null
    const [, title, Icon] = item
    return (
      <button key={id} type="button" className={styles.dockShortcut}
        style={webSectionStyle(id)} aria-label={title} title={title}
        aria-current={section === id ? 'page' : undefined}
        onClick={() => onNavigate(id)}>
        <Icon size={22} aria-hidden="true" /><span>{title}</span>
      </button>
    )
  }

  return (
    <footer className={styles.dock} data-menu-open={menuOpen}>
      <nav className={styles.dockItems} aria-label="Navigazione rapida">
        {shortcut('today')}
        {shortcut('calendar')}
        <button type="button" className={styles.launcher} aria-label="Apri menu principale"
          aria-haspopup="dialog" aria-expanded={menuOpen} title="Apri menu principale (Comando-K)"
          onClick={onOpen}><LayoutGrid size={23} aria-hidden="true" /></button>
        {shortcut('calls')}
        {shortcut('todos')}
      </nav>
    </footer>
  )
}
