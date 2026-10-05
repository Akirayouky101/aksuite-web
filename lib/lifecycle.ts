export type HistoryState = 'completed' | 'archived'
export const HISTORY_PAGE_SIZE = 5

export function validateEventTiming(input: { title: string; start_date: string; end_date: string | null; all_day: boolean }) {
  if (!input.title.trim() || !input.start_date) throw new Error('Inserisci un titolo e la data di inizio.')
  const parse = (value: string) => {
    const date = value.slice(0, 10)
    const calendar = new Date(`${date}T12:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== date) throw new Error('Data non valida.')
    const parsed = new Date(input.all_day ? romeDateStart(date) : value)
    if (!Number.isFinite(parsed.getTime())) throw new Error('Data o ora non valida.')
    return parsed
  }
  const start = parse(input.start_date)
  const end = input.end_date ? parse(input.end_date) : null
  if (end && (input.all_day ? end < start : end <= start)) throw new Error(input.all_day ? 'La fine non può precedere il giorno di inizio.' : 'La fine deve essere successiva all’inizio.')
  return { start, end }
}

export function historyDates(from: string, until: string) {
  if ([from, until].some(value => value && !/^\d{4}-\d{2}-\d{2}$/.test(value))) throw new Error('Date di ricerca non valide.')
  const start = from ? new Date(`${from}T00:00:00`) : null
  const end = until ? new Date(`${until}T23:59:59.999`) : null
  if ((start && !Number.isFinite(start.getTime())) || (end && !Number.isFinite(end.getTime()))) throw new Error('Date di ricerca non valide.')
  if ((start && start.toLocaleDateString('sv-SE') !== from) || (end && end.toLocaleDateString('sv-SE') !== until)) throw new Error('Date di ricerca non valide.')
  if (start && end && start > end) throw new Error('La data iniziale deve precedere quella finale.')
  return { start: start?.toISOString(), end: end?.toISOString() }
}

export function eventExpiry(event: { start_date: string; end_date: string | null; all_day: boolean }) {
  if (!event.all_day) return new Date(event.end_date || event.start_date).getTime()
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(event.end_date || event.start_date))
  const nextDay = new Date(`${date}T12:00:00Z`)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return new Date(romeDateStart(nextDay.toISOString().slice(0, 10))).getTime()
}

export function romeDateStart(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data non valida.')
  const utc = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== date) throw new Error('Data non valida.')
  const offset = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Rome', timeZoneName: 'shortOffset' })
    .formatToParts(utc).find(part => part.type === 'timeZoneName')?.value.match(/^GMT\+([12])$/)
  if (!offset) throw new Error('Fuso orario Europe/Rome non disponibile.')
  return new Date(utc.getTime() - Number(offset[1]) * 3600000).toISOString()
}
