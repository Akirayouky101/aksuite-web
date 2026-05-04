import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const { width } = Dimensions.get('window')
const DAY_W = Math.floor((width - 32) / 7)

const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DAYS_SHORT = ['Do','Lu','Ma','Me','Gi','Ve','Sa']

const COLOR_MAP: Record<string, string> = {
  indigo:  '#6366F1',
  blue:    '#3B82F6',
  green:   '#10B981',
  red:     '#EF4444',
  orange:  '#F97316',
  yellow:  '#EAB308',
  purple:  '#8B5CF6',
  pink:    '#EC4899',
  gray:    '#6B7280',
  teal:    '#14B8A6',
  default: '#6366F1',
}

interface CalEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  all_day: boolean
  location: string | null
  color: string | null
  assigned_to_name: string | null
  is_shared: boolean
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function CalendarioScreen({ navigation }: any) {
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async (year: number, month: number) => {
    if (!user) return
    setLoading(true)
    const firstDay = new Date(year, month, 1).toISOString()
    const lastDay  = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, start_date, end_date, all_day, location, color, assigned_to_name, is_shared')
      .gte('start_date', firstDay)
      .lte('start_date', lastDay)
      .order('start_date', { ascending: true })
    if (!error) setEvents((data || []) as CalEvent[])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchEvents(currentYear, currentMonth) }, [currentYear, currentMonth, fetchEvents])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
  }

  // Build calendar grid
  const firstOfMonth = new Date(currentYear, currentMonth, 1)
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate()
  const startDow     = firstOfMonth.getDay() // 0=Dom
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentYear, currentMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDay = (date: Date) => events.filter(e => isSameDay(new Date(e.start_date), date))
  const selectedEvents = eventsForDay(selectedDate)

  const eventColor = (ev: CalEvent) => COLOR_MAP[ev.color || 'default'] || COLOR_MAP.default

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📅 Calendario</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <Text style={s.navBtnTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
            <Text style={s.navBtnTxt}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={s.dowRow}>
          {DAYS_SHORT.map((d, i) => (
            <View key={i} style={[s.dowCell, i === 0 || i === 6 ? s.dowWeekend : null]}>
              <Text style={[s.dowTxt, i === 0 || i === 6 ? s.dowWeekendTxt : null]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {cells.map((date, idx) => {
            if (!date) return <View key={idx} style={s.emptyCell} />
            const isToday   = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            const dayEvs    = eventsForDay(date)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  s.dayCell,
                  isWeekend && s.dayCellWeekend,
                  isSelected && !isToday && s.dayCellSelected,
                  isToday && s.dayCellToday,
                ]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.dayNum,
                  isToday && s.dayNumToday,
                  isWeekend && !isToday && s.dayNumWeekend,
                ]}>
                  {date.getDate()}
                </Text>
                {/* Event dots */}
                <View style={s.dots}>
                  {dayEvs.slice(0, 3).map(ev => (
                    <View key={ev.id} style={[s.dot, { backgroundColor: eventColor(ev) }]} />
                  ))}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Selected day events */}
        <View style={s.daySection}>
          <Text style={s.daySectionTitle}>{fmtDateLabel(selectedDate.toISOString())}</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 16 }} />
          ) : selectedEvents.length === 0 ? (
            <View style={s.emptyDay}>
              <Text style={s.emptyDayIcon}>📭</Text>
              <Text style={s.emptyDayTxt}>Nessun evento</Text>
            </View>
          ) : (
            selectedEvents.map(ev => (
              <View key={ev.id} style={[s.eventCard, { borderLeftColor: eventColor(ev) }]}>
                <View style={s.eventTop}>
                  <View style={[s.eventDot, { backgroundColor: eventColor(ev) }]} />
                  <Text style={s.eventTitle} numberOfLines={2}>{ev.title}</Text>
                  {ev.is_shared && <View style={s.sharedBadge}><Text style={s.sharedBadgeTxt}>Condiviso</Text></View>}
                </View>
                {!ev.all_day && (
                  <Text style={s.eventTime}>🕐 {fmtTime(ev.start_date)}{ev.end_date ? ` – ${fmtTime(ev.end_date)}` : ''}</Text>
                )}
                {ev.all_day && <Text style={s.eventTime}>📅 Tutto il giorno</Text>}
                {ev.location ? <Text style={s.eventLocation}>📍 {ev.location}</Text> : null}
                {ev.assigned_to_name ? <Text style={s.eventAssignee}>👤 {ev.assigned_to_name}</Text> : null}
                {ev.description ? <Text style={s.eventDesc} numberOfLines={3}>{ev.description}</Text> : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#F5F3FF' },
  header:           { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back:             { width: 40, height: 40, justifyContent: 'center' },
  backTxt:          { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -4 },
  headerTitle:      { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll:           { flex: 1 },

  monthNav:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  navBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  navBtnTxt:        { color: '#7C3AED', fontSize: 22, fontWeight: '600', marginTop: -2 },
  monthTitle:       { fontSize: 17, fontWeight: '700', color: '#1E1B4B' },

  dowRow:           { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dowCell:          { width: DAY_W, alignItems: 'center', paddingVertical: 4 },
  dowWeekend:       {},
  dowTxt:           { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  dowWeekendTxt:    { color: '#A78BFA' },

  grid:             { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  emptyCell:        { width: DAY_W, height: 60 },
  dayCell:          { width: DAY_W, height: 60, alignItems: 'center', paddingTop: 6, borderRadius: 12 },
  dayCellWeekend:   { backgroundColor: '#FAF5FF' },
  dayCellSelected:  { backgroundColor: '#EDE9FE' },
  dayCellToday:     { backgroundColor: '#7C3AED' },
  dayNum:           { fontSize: 14, fontWeight: '600', color: '#374151' },
  dayNumToday:      { color: '#FFFFFF' },
  dayNumWeekend:    { color: '#7C3AED' },
  dots:             { flexDirection: 'row', gap: 3, marginTop: 3 },
  dot:              { width: 5, height: 5, borderRadius: 3 },

  daySection:       { paddingHorizontal: 16, paddingTop: 16 },
  daySectionTitle:  { fontSize: 13, fontWeight: '700', color: '#6D28D9', textTransform: 'capitalize', marginBottom: 10 },

  emptyDay:         { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderRadius: 16, gap: 6 },
  emptyDayIcon:     { fontSize: 28 },
  emptyDayTxt:      { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },

  eventCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  eventTop:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eventDot:         { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  eventTitle:       { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  sharedBadge:      { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sharedBadgeTxt:   { fontSize: 10, color: '#7C3AED', fontWeight: '600' },
  eventTime:        { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  eventLocation:    { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  eventAssignee:    { fontSize: 12, color: '#7C3AED', marginBottom: 2, fontWeight: '500' },
  eventDesc:        { fontSize: 12, color: '#9CA3AF', marginTop: 4, lineHeight: 17 },
})
