import { supabase } from './supabase'

export type DashboardKind = 'event' | 'todo' | 'call' | 'work_item' | 'payment'
export interface DashboardEntry { id: string; title: string; date: string | null; all_day?: boolean }
export interface DashboardRow extends DashboardEntry { kind: DashboardKind }
export interface DashboardSnapshot { agenda: DashboardRow[]; todos: DashboardRow[]; deadlines: DashboardRow[] }

export const DASHBOARD_LIMIT = 5
export const DASHBOARD_LABELS: Record<DashboardKind, string> = { event: 'Evento', todo: 'Attività', call: 'Richiamo', work_item: 'Lavorazione', payment: 'Promemoria pagamento' }

export function dashboardBounds(now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end = new Date(start); end.setDate(end.getDate() + 1)
  const horizon = new Date(end); horizon.setDate(horizon.getDate() + 14)
  return { start: start.toISOString(), end: end.toISOString(), horizon: horizon.toISOString() }
}

export function dashboardRows(entries: DashboardEntry[], kind: DashboardKind): DashboardRow[] {
  return entries.map(entry => ({ ...entry, kind }))
}

export function dashboardDeadlines(rows: DashboardRow[]) {
  return [...rows].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id)).slice(0, DASHBOARD_LIMIT)
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const { start, end, horizon } = dashboardBounds()
  const results = await Promise.all([
    supabase.from('events').select('id,title,date:start_date,all_day').eq('is_completed', false).is('archived_at', null)
      .lt('start_date', end).or(`end_date.gte.${start},and(end_date.is.null,start_date.gte.${start})`)
      .order('start_date').order('id').limit(DASHBOARD_LIMIT).returns<DashboardEntry[]>(),
    supabase.from('work_items').select('id,title,date:due_date').eq('kind', 'todo').neq('status', 'completed')
      .is('archived_at', null).order('due_date', { nullsFirst: false }).order('id').limit(DASHBOARD_LIMIT).returns<DashboardEntry[]>(),
    supabase.from('calls').select('id,title:caller_name,date:follow_up_date').eq('follow_up', true)
      .in('status', ['pending', 'in_corso']).lte('follow_up_date', horizon)
      .order('follow_up_date').order('id').limit(DASHBOARD_LIMIT).returns<DashboardEntry[]>(),
    supabase.from('work_items').select('id,title,date:due_date').eq('kind', 'work').neq('status', 'completed')
      .is('archived_at', null).lte('due_date', horizon).order('due_date').order('id').limit(DASHBOARD_LIMIT).returns<DashboardEntry[]>(),
    supabase.from('payments').select('id,title:payment_type,date:reminder_at').lte('reminder_at', horizon)
      .order('reminder_at').order('id').limit(DASHBOARD_LIMIT).returns<DashboardEntry[]>(),
  ])
  for (const result of results) if (result.error) throw result.error
  const [events, todos, calls, work, payments] = results.map(result => result.data || [])
  return {
    agenda: dashboardRows(events, 'event'),
    todos: dashboardRows(todos, 'todo'),
    deadlines: dashboardDeadlines([...dashboardRows(calls, 'call'), ...dashboardRows(work, 'work_item'), ...dashboardRows(payments, 'payment')]),
  }
}
