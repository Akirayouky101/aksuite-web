import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Dimensions,
  Modal, TextInput, Platform, KeyboardAvoidingView, Alert, Switch,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const { width, height } = Dimensions.get('window')
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

const STATUS_LABEL: Record<string, string> = {
  da_fare: '📋 Da fare',
  in_corso: '🔄 In corso',
  completata: '✅ Completata',
  annullata: '❌ Annullata',
}
const STATUS_COLOR: Record<string, string> = {
  da_fare: '#6366F1',
  in_corso: '#F59E0B',
  completata: '#10B981',
  annullata: '#EF4444',
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

interface Lavorazione {
  id: string
  title: string
  description: string
  assigned_to: string
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  priority: string
  address: string
  city: string
  notes: string
  completed_at: string | null
  user_id: string
}

type WizardStep = 'detail' | 'ora_inizio' | 'ora_fine' | 'note' | 'done'

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

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

function dateToHHMM(d: Date): string {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function calcDurata(inizio: string, fine: string): string {
  const [hi, mi] = inizio.split(':').map(Number)
  const [hf, mf] = fine.split(':').map(Number)
  const totMin = (hf * 60 + mf) - (hi * 60 + mi)
  if (totMin <= 0) return '—'
  const h = Math.floor(totMin / 60)
  const m = totMin % 60
  return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m} min`
}

function calcDurataMinutes(inizio: string, fine: string): number {
  const [hi, mi] = inizio.split(':').map(Number)
  const [hf, mf] = fine.split(':').map(Number)
  return Math.max(0, (hf * 60 + mf) - (hi * 60 + mi))
}

export default function CalendarioScreen({ navigation }: any) {
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear]   = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [events, setEvents]             = useState<CalEvent[]>([])
  const [loading, setLoading]           = useState(true)

  // --- Detail / Wizard state ---
  const [selectedEvent, setSelectedEvent]   = useState<CalEvent | null>(null)
  const [lavorazione, setLavorazione]       = useState<Lavorazione | null>(null)
  const [lavLoading, setLavLoading]         = useState(false)
  const [wizardStep, setWizardStep]         = useState<WizardStep>('detail')

  // Wizard fields
  const [oraInizio, setOraInizio]       = useState<Date>(new Date())
  const [oraFine, setOraFine]           = useState<Date>(new Date())
  const [noteFinali, setNoteFinali]     = useState('')
  const [segnaCompletata, setSegnaCompletata] = useState(false)
  const [completaLoading, setCompletaLoading] = useState(false)

  // Android time picker visibility
  const [showPickerInizio, setShowPickerInizio] = useState(false)
  const [showPickerFine, setShowPickerFine]     = useState(false)

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

  const openEventDetail = async (ev: CalEvent) => {
    setSelectedEvent(ev)
    setWizardStep('detail')
    setLavorazione(null)
    setNoteFinali('')

    if (ev.title.startsWith('Lavorazione: ')) {
      const lavTitle = ev.title.replace('Lavorazione: ', '').trim()
      setLavLoading(true)
      const { data } = await supabase
        .from('lavorazioni')
        .select('*')
        .ilike('title', lavTitle)
        .limit(1)
        .maybeSingle()
      setLavorazione(data as Lavorazione | null)
      if (data?.scheduled_time) {
        const [h, m] = (data.scheduled_time as string).split(':').map(Number)
        const t = new Date(); t.setHours(h, m, 0, 0)
        setOraInizio(t)
      } else {
        const t = new Date(); t.setHours(8, 0, 0, 0)
        setOraInizio(t)
      }
      const now = new Date()
      setOraFine(now)
      setLavLoading(false)
    }
  }

  const closeDetail = () => {
    setSelectedEvent(null)
    setLavorazione(null)
    setWizardStep('detail')
    setSegnaCompletata(false)
  }

  const handleSalvaOre = async () => {
    if (!lavorazione) return
    setCompletaLoading(true)
    try {
      const inizio = dateToHHMM(oraInizio)
      const fine   = dateToHHMM(oraFine)
      const durata = calcDurata(inizio, fine)
      const minutes = calcDurataMinutes(inizio, fine)
      const workDate = (selectedEvent?.start_date ?? new Date().toISOString()).slice(0, 10)

      // 1. Salva sessione ore in lavorazione_ore
      await supabase.from('lavorazione_ore').insert({
        lavorazione_id: lavorazione.id,
        user_id: user!.id,
        user_name: lavorazione.assigned_to || '',
        work_date: workDate,
        start_time: inizio,
        end_time: fine,
        minutes,
        notes: noteFinali.trim(),
      })

      if (segnaCompletata) {
        // 2a. Aggiorna stato lavorazione a completata
        await supabase
          .from('lavorazioni')
          .update({ status: 'completata', completed_at: new Date().toISOString() })
          .eq('id', lavorazione.id)

        // 2b. Aggiungi voce timeline
        const desc = `✅ Intervento completato\nInizio: ${inizio}  |  Fine: ${fine}  |  Durata: ${durata}${noteFinali ? '\n\nNote: ' + noteFinali : ''}`
        await supabase.from('lavorazioni_timeline').insert({
          lavorazione_id: lavorazione.id,
          user_id: user!.id,
          description: desc,
          event_type: 'completamento',
          created_by_name: '',
        })

        // 2c. Aggiorna end_date evento calendario
        const evDate = new Date(selectedEvent!.start_date)
        const [hf, mf2] = fine.split(':').map(Number)
        evDate.setHours(hf, mf2, 0, 0)
        await supabase
          .from('events')
          .update({ end_date: evDate.toISOString() })
          .eq('id', selectedEvent!.id)

        setLavorazione({ ...lavorazione, status: 'completata' })
      }

      setWizardStep('done')
      await fetchEvents(currentYear, currentMonth)
    } catch (err: any) {
      Alert.alert('Errore', err.message || 'Impossibile salvare le ore')
    }
    setCompletaLoading(false)
  }

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
  const startDow     = firstOfMonth.getDay()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentYear, currentMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDay  = (date: Date) => events.filter(e => isSameDay(new Date(e.start_date), date))
  const selectedEvents = eventsForDay(selectedDate)
  const eventColor    = (ev: CalEvent) => COLOR_MAP[ev.color || 'default'] || COLOR_MAP.default
  const isLavorazione = (ev: CalEvent) => ev.title.startsWith('Lavorazione: ')

  // ── Wizard step titles ──────────────────────────────────────
  const STEP_TITLES: Record<WizardStep, string> = {
    detail: '',
    ora_inizio: 'Quando hai iniziato?',
    ora_fine: 'Quando hai finito?',
    note: 'Note finali',
    done: 'Completata!',
  }

  return (
    <View style={s.root}>
      {/* ── Header ── */}
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
            const isToday    = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            const dayEvs     = eventsForDay(date)
            const isWeekend  = date.getDay() === 0 || date.getDay() === 6
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
                <Text style={[s.dayNum, isToday && s.dayNumToday, isWeekend && !isToday && s.dayNumWeekend]}>
                  {date.getDate()}
                </Text>
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
              <TouchableOpacity
                key={ev.id}
                style={[s.eventCard, { borderLeftColor: eventColor(ev) }]}
                onPress={() => openEventDetail(ev)}
                activeOpacity={0.75}
              >
                <View style={s.eventTop}>
                  <View style={[s.eventDot, { backgroundColor: eventColor(ev) }]} />
                  <Text style={s.eventTitle} numberOfLines={2}>{
                    isLavorazione(ev) ? ev.title.replace('Lavorazione: ', '') : ev.title
                  }</Text>
                  {isLavorazione(ev) && <View style={s.lavBadge}><Text style={s.lavBadgeTxt}>🔧</Text></View>}
                  {ev.is_shared && <View style={s.sharedBadge}><Text style={s.sharedBadgeTxt}>Cond.</Text></View>}
                </View>
                {!ev.all_day && (
                  <Text style={s.eventTime}>🕐 {fmtTime(ev.start_date)}{ev.end_date ? ` – ${fmtTime(ev.end_date)}` : ''}</Text>
                )}
                {ev.all_day && <Text style={s.eventTime}>📅 Tutto il giorno</Text>}
                {ev.location ? <Text style={s.eventLocation} numberOfLines={1}>📍 {ev.location}</Text> : null}
                {ev.assigned_to_name ? <Text style={s.eventAssignee}>👤 {ev.assigned_to_name}</Text> : null}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════
           DETAIL / WIZARD MODAL
         ══════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        transparent
        onRequestClose={closeDetail}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={wizardStep === 'detail' ? closeDetail : undefined} />

          <View style={s.sheet}>
            {/* Sheet handle */}
            <View style={s.sheetHandle} />

            {/* ── STEP: detail ── */}
            {wizardStep === 'detail' && selectedEvent && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Event header */}
                <View style={[s.sheetEventHeader, { borderLeftColor: eventColor(selectedEvent) }]}>
                  <Text style={s.sheetEventTitle}>
                    {isLavorazione(selectedEvent)
                      ? selectedEvent.title.replace('Lavorazione: ', '')
                      : selectedEvent.title}
                  </Text>
                  {isLavorazione(selectedEvent) && (
                    <View style={s.lavBadgeLarge}><Text style={s.lavBadgeLargeTxt}>🔧 Lavorazione</Text></View>
                  )}
                </View>

                {/* Ora / data */}
                {!selectedEvent.all_day && (
                  <View style={s.detailRow}>
                    <Text style={s.detailIcon}>🕐</Text>
                    <Text style={s.detailTxt}>
                      {fmtTime(selectedEvent.start_date)}
                      {selectedEvent.end_date ? ` – ${fmtTime(selectedEvent.end_date)}` : ''}
                    </Text>
                  </View>
                )}
                {selectedEvent.location ? (
                  <View style={s.detailRow}>
                    <Text style={s.detailIcon}>📍</Text>
                    <Text style={s.detailTxt}>{selectedEvent.location}</Text>
                  </View>
                ) : null}
                {selectedEvent.assigned_to_name ? (
                  <View style={s.detailRow}>
                    <Text style={s.detailIcon}>👤</Text>
                    <Text style={s.detailTxt}>{selectedEvent.assigned_to_name}</Text>
                  </View>
                ) : null}

                {/* Lavorazione details */}
                {lavLoading && <ActivityIndicator color="#6366F1" style={{ marginTop: 16 }} />}
                {lavorazione && !lavLoading && (
                  <View style={s.lavDetailBox}>
                    {/* Status */}
                    <View style={[s.statusPill, { backgroundColor: STATUS_COLOR[lavorazione.status] + '22', borderColor: STATUS_COLOR[lavorazione.status] + '55' }]}>
                      <Text style={[s.statusPillTxt, { color: STATUS_COLOR[lavorazione.status] }]}>
                        {STATUS_LABEL[lavorazione.status] || lavorazione.status}
                      </Text>
                    </View>

                    {lavorazione.description ? (
                      <Text style={s.lavDesc}>{lavorazione.description}</Text>
                    ) : null}

                    {lavorazione.address || lavorazione.city ? (
                      <View style={s.detailRow}>
                        <Text style={s.detailIcon}>🏠</Text>
                        <Text style={s.detailTxt}>{[lavorazione.address, lavorazione.city].filter(Boolean).join(', ')}</Text>
                      </View>
                    ) : null}

                    {lavorazione.notes ? (
                      <View style={s.detailRow}>
                        <Text style={s.detailIcon}>📝</Text>
                        <Text style={s.detailTxt}>{lavorazione.notes}</Text>
                      </View>
                    ) : null}

                    {/* CTA: Completa */}
                    {lavorazione.status !== 'completata' && lavorazione.status !== 'annullata' && (
                      <TouchableOpacity
                        style={s.completaBtn}
                        onPress={() => setWizardStep('ora_inizio')}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#10B981', '#059669']} style={s.completaBtnGrad}>
                          <Text style={s.completaBtnTxt}>✅  Segna come completata</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {lavorazione.status === 'completata' && (
                      <View style={s.completataBanner}>
                        <Text style={s.completataBannerTxt}>✅ Lavorazione già completata</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Description (non-lavorazione events) */}
                {!isLavorazione(selectedEvent) && selectedEvent.description ? (
                  <Text style={s.lavDesc}>{selectedEvent.description}</Text>
                ) : null}

                <TouchableOpacity onPress={closeDetail} style={s.closeBtn}>
                  <Text style={s.closeBtnTxt}>Chiudi</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* ── STEP: ora_inizio ── */}
            {wizardStep === 'ora_inizio' && (
              <View style={s.wizardStep}>
                <Text style={s.wizardStepNum}>Passo 1 di 3</Text>
                <Text style={s.wizardTitle}>🕗  A che ora hai iniziato?</Text>
                <Text style={s.wizardSub}>Imposta l'ora in cui hai cominciato l'intervento</Text>

                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={oraInizio}
                    mode="time"
                    display="spinner"
                    locale="it-IT"
                    onChange={(_, d) => d && setOraInizio(d)}
                    style={{ width: '100%', marginVertical: 12 }}
                  />
                ) : (
                  <>
                    <TouchableOpacity style={s.timePickerBtn} onPress={() => setShowPickerInizio(true)}>
                      <Text style={s.timePickerBtnTxt}>{dateToHHMM(oraInizio)}</Text>
                      <Text style={s.timePickerEdit}>✏️ modifica</Text>
                    </TouchableOpacity>
                    {showPickerInizio && (
                      <DateTimePicker
                        value={oraInizio}
                        mode="time"
                        is24Hour
                        display="default"
                        onChange={(_, d) => { setShowPickerInizio(false); d && setOraInizio(d) }}
                      />
                    )}
                  </>
                )}

                <View style={s.wizardActions}>
                  <TouchableOpacity onPress={() => setWizardStep('detail')} style={s.wizardBtnSecondary}>
                    <Text style={s.wizardBtnSecondaryTxt}>‹ Indietro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setWizardStep('ora_fine')} style={s.wizardBtnPrimary}>
                    <LinearGradient colors={['#6366F1','#7C3AED']} style={s.wizardBtnGrad}>
                      <Text style={s.wizardBtnPrimaryTxt}>Avanti ›</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP: ora_fine ── */}
            {wizardStep === 'ora_fine' && (
              <View style={s.wizardStep}>
                <Text style={s.wizardStepNum}>Passo 2 di 3</Text>
                <Text style={s.wizardTitle}>🕔  A che ora hai finito?</Text>
                <Text style={s.wizardSub}>Imposta l'ora in cui hai terminato l'intervento</Text>

                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={oraFine}
                    mode="time"
                    display="spinner"
                    locale="it-IT"
                    onChange={(_, d) => d && setOraFine(d)}
                    style={{ width: '100%', marginVertical: 12 }}
                  />
                ) : (
                  <>
                    <TouchableOpacity style={s.timePickerBtn} onPress={() => setShowPickerFine(true)}>
                      <Text style={s.timePickerBtnTxt}>{dateToHHMM(oraFine)}</Text>
                      <Text style={s.timePickerEdit}>✏️ modifica</Text>
                    </TouchableOpacity>
                    {showPickerFine && (
                      <DateTimePicker
                        value={oraFine}
                        mode="time"
                        is24Hour
                        display="default"
                        onChange={(_, d) => { setShowPickerFine(false); d && setOraFine(d) }}
                      />
                    )}
                  </>
                )}

                {/* Durata calcolata */}
                <View style={s.durataBox}>
                  <Text style={s.durataLabel}>Durata calcolata</Text>
                  <Text style={s.durataValue}>{calcDurata(dateToHHMM(oraInizio), dateToHHMM(oraFine))}</Text>
                </View>

                <View style={s.wizardActions}>
                  <TouchableOpacity onPress={() => setWizardStep('ora_inizio')} style={s.wizardBtnSecondary}>
                    <Text style={s.wizardBtnSecondaryTxt}>‹ Indietro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setWizardStep('note')} style={s.wizardBtnPrimary}>
                    <LinearGradient colors={['#6366F1','#7C3AED']} style={s.wizardBtnGrad}>
                      <Text style={s.wizardBtnPrimaryTxt}>Avanti ›</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP: note ── */}
            {wizardStep === 'note' && (
              <View style={s.wizardStep}>
                <Text style={s.wizardStepNum}>Passo 3 di 3</Text>
                <Text style={s.wizardTitle}>📝  Note finali</Text>
                <Text style={s.wizardSub}>Opzionale — descrivi brevemente il lavoro svolto</Text>

                {/* Riepilogo */}
                <View style={s.riepilogoBox}>
                  <Text style={s.riepilogoRow}>🕗 Inizio: <Text style={s.riepilogoVal}>{dateToHHMM(oraInizio)}</Text></Text>
                  <Text style={s.riepilogoRow}>🕔 Fine: <Text style={s.riepilogoVal}>{dateToHHMM(oraFine)}</Text></Text>
                  <Text style={s.riepilogoRow}>⏱️ Durata: <Text style={s.riepilogoVal}>{calcDurata(dateToHHMM(oraInizio), dateToHHMM(oraFine))}</Text></Text>
                </View>

                <TextInput
                  style={s.noteInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Es: sostituito quadro elettrico, verificato impianto..."
                  placeholderTextColor="#9CA3AF"
                  value={noteFinali}
                  onChangeText={setNoteFinali}
                />

                {/* Toggle: segna come completata */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534' }}>Segna come completata?</Text>
                    <Text style={{ fontSize: 12, color: '#4ADE80', marginTop: 2 }}>Se la lavorazione è ancora in corso, lascia disattivato</Text>
                  </View>
                  <Switch
                    value={segnaCompletata}
                    onValueChange={setSegnaCompletata}
                    trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                    thumbColor={segnaCompletata ? '#10B981' : '#9CA3AF'}
                  />
                </View>

                <View style={s.wizardActions}>
                  <TouchableOpacity onPress={() => setWizardStep('ora_fine')} style={s.wizardBtnSecondary}>
                    <Text style={s.wizardBtnSecondaryTxt}>‹ Indietro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSalvaOre} disabled={completaLoading} style={s.wizardBtnPrimary}>
                    <LinearGradient colors={['#6366F1','#7C3AED']} style={s.wizardBtnGrad}>
                      {completaLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={s.wizardBtnPrimaryTxt}>💾  Salva ore</Text>
                      }
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP: done ── */}
            {wizardStep === 'done' && (
              <View style={[s.wizardStep, { alignItems: 'center', paddingTop: 24 }]}>
                <Text style={{ fontSize: 56, marginBottom: 16 }}>{segnaCompletata ? '🎉' : '💾'}</Text>
                <Text style={[s.wizardTitle, { textAlign: 'center' }]}>
                  {segnaCompletata ? 'Lavorazione completata!' : 'Ore salvate!'}
                </Text>
                <Text style={[s.wizardSub, { textAlign: 'center', marginBottom: 8 }]}>
                  Ore lavorate: <Text style={{ fontWeight: '700', color: '#10B981' }}>{calcDurata(dateToHHMM(oraInizio), dateToHHMM(oraFine))}</Text>
                </Text>
                <Text style={[s.wizardSub, { textAlign: 'center' }]}>
                  {dateToHHMM(oraInizio)} → {dateToHHMM(oraFine)}
                </Text>
                {!segnaCompletata && (
                  <Text style={[s.wizardSub, { textAlign: 'center', color: '#6366F1', marginTop: 8 }]}>
                    La lavorazione è ancora in corso — potrai registrare altre sessioni in futuro.
                  </Text>
                )}
                <TouchableOpacity onPress={closeDetail} style={[s.completaBtn, { marginTop: 24 }]}>
                  <LinearGradient colors={['#6366F1','#7C3AED']} style={s.completaBtnGrad}>
                    <Text style={s.completaBtnTxt}>Chiudi</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  lavBadge:         { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  lavBadgeTxt:      { fontSize: 11 },
  sharedBadge:      { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sharedBadgeTxt:   { fontSize: 10, color: '#7C3AED', fontWeight: '600' },
  eventTime:        { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  eventLocation:    { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  eventAssignee:    { fontSize: 12, color: '#7C3AED', marginBottom: 2, fontWeight: '500' },
  eventDesc:        { fontSize: 12, color: '#9CA3AF', marginTop: 4, lineHeight: 17 },

  // ── Modal / Sheet ──
  modalOverlay:     { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:            { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: height * 0.88, minHeight: 300 },
  sheetHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 8 },

  sheetEventHeader: { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 14, marginTop: 8 },
  sheetEventTitle:  { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  lavBadgeLarge:    { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  lavBadgeLargeTxt: { fontSize: 12, color: '#92400E', fontWeight: '700' },

  detailRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailIcon:       { fontSize: 15, marginTop: 1 },
  detailTxt:        { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  lavDetailBox:     { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginTop: 8, gap: 10 },
  statusPill:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  statusPillTxt:    { fontSize: 13, fontWeight: '700' },
  lavDesc:          { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  completaBtn:      { marginTop: 12 },
  completaBtnGrad:  { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  completaBtnTxt:   { color: '#fff', fontSize: 16, fontWeight: '700' },

  completataBanner: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  completataBannerTxt: { color: '#065F46', fontWeight: '700', fontSize: 14 },

  closeBtn:         { marginTop: 20, marginBottom: 8, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6' },
  closeBtnTxt:      { color: '#6B7280', fontSize: 15, fontWeight: '600' },

  // ── Wizard ──
  wizardStep:       { paddingTop: 8, paddingBottom: 16 },
  wizardStepNum:    { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  wizardTitle:      { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  wizardSub:        { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },

  timePickerBtn:    { backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timePickerBtnTxt: { fontSize: 32, fontWeight: '800', color: '#1F2937' },
  timePickerEdit:   { fontSize: 13, color: '#9CA3AF' },

  durataBox:        { backgroundColor: '#EDE9FE', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  durataLabel:      { fontSize: 13, color: '#6D28D9', fontWeight: '600' },
  durataValue:      { fontSize: 20, fontWeight: '800', color: '#4F46E5' },

  riepilogoBox:     { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, gap: 4, marginBottom: 14 },
  riepilogoRow:     { fontSize: 14, color: '#374151' },
  riepilogoVal:     { fontWeight: '700', color: '#065F46' },

  noteInput:        { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, fontSize: 14, color: '#1F2937', textAlignVertical: 'top', minHeight: 100, marginBottom: 16 },

  wizardActions:    { flexDirection: 'row', gap: 10, marginTop: 8 },
  wizardBtnSecondary: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: '#F3F4F6' },
  wizardBtnSecondaryTxt: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  wizardBtnPrimary: { flex: 2 },
  wizardBtnGrad:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  wizardBtnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
