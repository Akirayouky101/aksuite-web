import type { CSSProperties } from 'react'

export const webSectionColors: Record<string, string> = {
  today: '#ed826b',
  calls: '#70c3a3',
  calendar: '#78b6dd',
  todos: '#efc66d',
  work_items: '#92bd87',
  clients: '#69b9ad',
  notes: '#e3ac6b',
  payments: '#e78372',
  passwords: '#b29bdb',
  shopping: '#72beb6',
  photos: '#d995b8',
  users: '#e6a8c5',
}

export function webSectionStyle(section: string): CSSProperties {
  const color = webSectionColors[section] || '#83cfff'
  return {
    '--section-accent': color,
    '--section-tint': `${color}24`,
    '--section-line': `${color}80`,
  } as CSSProperties
}
