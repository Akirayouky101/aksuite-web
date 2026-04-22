import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface WorkRecord {
  id: string
  profile_id: string
  date: string
  hours_worked: number
  check_in: string | null
  check_out: string | null
  break_minutes: number
  notes: string | null
  created_at: string
}

interface PendingCode {
  id: string
  record_id: string
  code: string | null
  created_at: string
  used_at: string | null
  status: string // 'requested' | 'code_sent' | 'used'
  date?: string
}

const BREAK_OPTIONS = [
  { value: 0,  label: 'Cont.' },
  { value: 15, label: "15'" },
  { value: 30, label: "30'" },
  { value: 45, label: "45'" },
  { value: 60, label: '1h' },
] as const

function fmtBreak(min: number): string {
  if (min === 0) return 'Continuato'
  if (min < 60) return `Pausa ${min}'`
  const h = min / 60
  return `Pausa ${h % 1 === 0 ? h : h.toFixed(1)}h`
}

function calcHours(checkIn: string, checkOut: string, breakMin: number): number {
  const [hi, mi] = checkIn.split(':').map(Number)
  const [ho, mo] = checkOut.split(':').map(Number)
  const raw = ho * 60 + mo - (hi * 60 + mi)
  return Math.max(0, parseFloat(((raw - breakMin) / 60).toFixed(2)))
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })
}

function todayISO() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function TimbratureScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [pendingCodes, setPendingCodes] = useState<PendingCode[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(60)
  const [codesCollapsed, setCodesCollapsed] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [requestingFor, setRequestingFor] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: todayISO(), check_in: '', check_out: '', hours_worked: '', break_minutes: 60, notes: '',
  })

  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('hr_work_records')
      .select('*')
      .eq('profile_id', user.id)
      .order('date', { ascending: false })
      .limit(60)
    setRecords((data || []) as WorkRecord[])
    setLoading(false)
  }, [user?.id])

  const fetchPendingCodes = useCallback(async () => {
    if (!user) return
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: codes, error } = await supabase
        .from('hr_modification_codes')
        .select('*')
        .eq('profile_id', user.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
      if (error || !codes?.length) { setPendingCodes([]); return }
      const recordIds = [...new Set(codes.map((c: any) => c.record_id))]
      const { data: recs } = await supabase
        .from('hr_work_records').select('id, date').in('id', recordIds)
      const recMap = new Map((recs || []).map((r: any) => [r.id, r.date]))
      setPendingCodes(codes.map((c: any) => ({ ...c, date: recMap.get(c.record_id) })))
    } catch { setPendingCodes([]) }
  }, [user?.id])

  const handleRequestModification = async (record: WorkRecord) => {
    if (!user) return
    if (pendingRecordIds.has(record.id)) return // già in attesa
    setRequestingFor(record.id)
    await supabase.from('hr_modification_codes').insert([{
      record_id: record.id,
      profile_id: user.id,
      status: 'requested',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }])
    setRequestingFor(null)
    setSelectedRecordId(null)
    fetchPendingCodes()
  }

  useEffect(() => {
    fetchRecords()
    fetchPendingCodes()
  }, [fetchRecords, fetchPendingCodes])

  // Auto-refresh ogni 30 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecords()
      fetchPendingCodes()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchRecords, fetchPendingCodes])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchRecords(), fetchPendingCodes()])
    setRefreshing(false)
  }, [fetchRecords, fetchPendingCodes])

  const handleClockIn = async () => {
    if (!user) return
    const today = todayISO()
    const existing = records.find(r => r.date === today)
    if (existing) { Alert.alert('Già timbrato', 'Hai già una timbratura per oggi'); return }
    setSaving(true)
    const { error } = await supabase.from('hr_work_records').insert([{
      user_id: user.id, profile_id: user.id,
      date: today, check_in: nowTime(),
      hours_worked: 0, break_minutes: breakMinutes, notes: null,
    }])
    setSaving(false)
    if (error) Alert.alert('Errore', error.message)
    else { Alert.alert('Entrata registrata', `Entrata alle ${nowTime()}`); fetchRecords() }
  }

  const handleClockOut = async () => {
    if (!user) return
    const today = todayISO()
    const rec = records.find(r => r.date === today && r.check_in && !r.check_out)
    if (!rec) { Alert.alert('Nessuna entrata', "Non hai ancora timbrato l'entrata oggi"); return }
    const checkOut = nowTime()
    const hrs = calcHours(rec.check_in!, checkOut, breakMinutes)
    setSaving(true)
    const { error } = await supabase.from('hr_work_records').update({
      check_out: checkOut, hours_worked: hrs, break_minutes: breakMinutes,
    }).eq('id', rec.id)
    setSaving(false)
    if (error) Alert.alert('Errore', error.message)
    else { Alert.alert('Uscita registrata', `${hrs}h nette (${fmtBreak(breakMinutes)})`); fetchRecords() }
  }

  const handleManualSave = async () => {
    if (!user) return
    let hrs: number
    if (form.check_in && form.check_out) {
      hrs = calcHours(form.check_in, form.check_out, form.break_minutes)
    } else {
      hrs = parseFloat(form.hours_worked)
    }
    if (!form.date) { Alert.alert('Attenzione', 'Inserisci una data'); return }
    if (isNaN(hrs) || hrs < 0) { Alert.alert('Attenzione', 'Orari non validi'); return }
    setSaving(true)
    const { error } = await supabase.from('hr_work_records').upsert([{
      user_id: user.id, profile_id: user.id,
      date: form.date,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      hours_worked: hrs, break_minutes: form.break_minutes,
      notes: form.notes || null,
    }], { onConflict: 'profile_id,date' })
    setSaving(false)
    if (error) Alert.alert('Errore', error.message)
    else {
      setShowForm(false)
      setForm({ date: todayISO(), check_in: '', check_out: '', hours_worked: '', break_minutes: 60, notes: '' })
      fetchRecords()
    }
  }

  const todayRec = records.find(r => r.date === todayISO())
  const totalHours = records.slice(0, 30).reduce((s, r) => s + Number(r.hours_worked), 0)
  const codeSentCodes = pendingCodes.filter(c => c.status === 'code_sent' && !c.used_at)
  const requestedCodes = pendingCodes.filter(c => c.status === 'requested')
  const usedCodes = pendingCodes.filter(c => !!c.used_at || c.status === 'used')
  const sortedCodes = [...codeSentCodes, ...requestedCodes, ...usedCodes]
  const pendingRecordIds = new Set([...codeSentCodes, ...requestedCodes].map(c => c.record_id))

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#B45309', '#D97706', '#F59E0B']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>← Indietro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={s.refreshBtn} disabled={refreshing}>
            <Text style={[s.refreshIcon, refreshing && { opacity: 0.5 }]}>↻</Text>
          </TouchableOpacity>
        </View>
        <View style={s.headerMain}>
          <View style={s.headerIconWrap}>
            <Text style={s.headerIconText}>⏱</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Timbrature</Text>
            <Text style={s.headerSub}>
              {(profile as any)?.full_name || 'Le mie ore'} · {records.length} registrazioni
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: '#FEF9EE' }]}>
          <Text style={s.statLabel}>OGGI</Text>
          {todayRec ? (
            <Text style={s.statVal}>
              {todayRec.check_in ?? '--:--'}{todayRec.check_out ? ` → ${todayRec.check_out}` : ' → in corso'}
            </Text>
          ) : (
            <Text style={[s.statVal, { color: '#9CA3AF' }]}>Non timbrato</Text>
          )}
          {todayRec && todayRec.hours_worked > 0 && (
            <Text style={s.statSub}>{Number(todayRec.hours_worked).toFixed(1)}h lavorate</Text>
          )}
        </View>
        <View style={[s.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[s.statLabel, { color: '#16A34A' }]}>ULTIMI 30GG</Text>
          <Text style={[s.statVal, { color: '#15803D' }]}>{totalHours.toFixed(1)}h</Text>
          <Text style={s.statSub}>{records.slice(0, 30).length} giorni</Text>
        </View>
      </View>

      <View style={s.actionSection}>
        <Text style={s.actionLabel}>Timbra</Text>
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.actionBtn, (saving || !!todayRec?.check_in) && s.actionBtnDisabled]}
            onPress={handleClockIn}
            disabled={saving || !!todayRec?.check_in}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={todayRec?.check_in ? ['#D1FAE5', '#D1FAE5'] : ['#059669', '#10B981']}
              style={s.actionBtnGrad}
            >
              <Text style={[s.actionBtnIcon, todayRec?.check_in && { opacity: 0.4 }]}>▶</Text>
              <Text style={[s.actionBtnText, todayRec?.check_in && { color: '#6EE7B7', opacity: 0.6 }]}>
                {todayRec?.check_in ? `Entrata: ${todayRec.check_in}` : 'Entrata'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, (saving || !todayRec?.check_in || !!todayRec?.check_out) && s.actionBtnDisabled]}
            onPress={handleClockOut}
            disabled={saving || !todayRec?.check_in || !!todayRec?.check_out}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={todayRec?.check_out ? ['#FEE2E2', '#FEE2E2'] : ['#DC2626', '#EF4444']}
              style={s.actionBtnGrad}
            >
              <Text style={[s.actionBtnIcon, (!todayRec?.check_in || !!todayRec?.check_out) && { opacity: 0.4 }]}>■</Text>
              <Text style={[s.actionBtnText, (!todayRec?.check_in || !!todayRec?.check_out) && { color: '#FCA5A5', opacity: 0.6 }]}>
                {todayRec?.check_out ? `Uscita: ${todayRec.check_out}` : 'Uscita'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.manualBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Text style={s.manualBtnText}>+ Inserimento manuale</Text>
        </TouchableOpacity>
      </View>

      <View style={s.breakSection}>
        <Text style={s.breakSectionLabel}>Pausa prevista</Text>
        <View style={s.breakRow}>
          {BREAK_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.breakChip, breakMinutes === opt.value && s.breakChipActive]}
              onPress={() => setBreakMinutes(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[s.breakChipText, breakMinutes === opt.value && s.breakChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {sortedCodes.length > 0 && (
        <View style={s.codesSection}>
          <TouchableOpacity style={s.codesSectionHeader} onPress={() => setCodesCollapsed(p => !p)}>
            <Text style={s.codesSectionTitle}>{'🔔 Richieste di modifica'}</Text>
            <Text style={s.codesCollapseBtn}>{codesCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!codesCollapsed && sortedCodes.map(c => {
            const isCodeSent = c.status === 'code_sent' && !c.used_at
            const isRequested = c.status === 'requested'
            const isUsed = !!c.used_at || c.status === 'used'
            const cardStyle = isCodeSent ? s.codeCardActive : isRequested ? s.codeCardRequested : s.codeCardUsed
            const dotStyle = isCodeSent ? s.codeDotGreen : isRequested ? s.codeDotOrange : s.codeDotRed
            return (
              <View key={c.id} style={[s.codeCard, cardStyle]}>
                <View style={[s.codeDot, dotStyle]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.codeCardDate, (isUsed || isRequested) && { color: '#6B7280' }]}>
                    {c.date ? fmtDate(c.date) : '—'}
                  </Text>
                  <Text style={[s.codeCardSub, (isUsed || isRequested) && { color: '#9CA3AF' }]}>
                    {isCodeSent ? 'Mostra questo codice al responsabile' :
                     isRequested ? 'In attesa che il responsabile generi il codice' :
                     'Codice utilizzato'}
                  </Text>
                </View>
                {isCodeSent && (
                  <View style={s.codeBox}>
                    <Text style={s.codeText}>{c.code}</Text>
                  </View>
                )}
                {isRequested && (
                  <View style={s.codeBoxPending}>
                    <Text style={s.codeTextPending}>{'⏳'}</Text>
                  </View>
                )}
                {isUsed && c.code && (
                  <View style={s.codeBoxUsed}>
                    <Text style={s.codeTextUsed}>{c.code}</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}

      {loading
        ? <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
        : <FlatList
            data={records}
            keyExtractor={r => r.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D97706" colors={['#D97706']} />
            }
            ListHeaderComponent={
              <Text style={s.listSectionTitle}>Storico Registrazioni</Text>
            }
            renderItem={({ item: r }) => {
              const isSelected = selectedRecordId === r.id
              const hasPending = pendingRecordIds.has(r.id)
              return (
                <TouchableOpacity
                  style={[s.row, hasPending && s.rowPending]}
                  onPress={() => setSelectedRecordId(p => p === r.id ? null : r.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.rowDateBadge, hasPending && s.rowDateBadgePending]}>
                    {hasPending && <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 1 }}>🔔</Text>}
                    <Text style={[s.rowDateDay, hasPending && { color: '#92400E' }]}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[s.rowDateNum, hasPending && { color: '#78350F' }]}>
                      {new Date(r.date + 'T00:00:00').getDate()}
                    </Text>
                    <Text style={[s.rowDateMonth, hasPending && { color: '#92400E' }]}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('it-IT', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={s.rowContent}>
                    <View style={s.rowTopRow}>
                      <Text style={s.rowHours}>{Number(r.hours_worked).toFixed(1)}h</Text>
                      <View style={[s.rowBreakBadge, r.break_minutes === 0 && { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[s.rowBreakText, r.break_minutes === 0 && { color: '#059669' }]}>
                          {fmtBreak(r.break_minutes ?? 60)}
                        </Text>
                      </View>
                    </View>
                    {r.check_in ? (
                      <Text style={s.rowTimes}>
                        {r.check_in}{r.check_out ? ` → ${r.check_out}` : ' → in corso'}
                      </Text>
                    ) : null}
                    {r.notes ? <Text style={s.rowNotes} numberOfLines={1}>📝 {r.notes}</Text> : null}
                    {isSelected && (
                      <TouchableOpacity
                        style={[s.requestModBtn, hasPending && s.requestModBtnDisabled]}
                        onPress={() => !hasPending && handleRequestModification(r)}
                        disabled={requestingFor === r.id || hasPending}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.requestModBtnText, hasPending && { color: '#9CA3AF' }]}>
                          {requestingFor === r.id
                            ? '⏳ Invio in corso...'
                            : hasPending
                              ? '🔔 Richiesta già inviata'
                              : '✏️ Richiedi modifica'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>⏱</Text>
                <Text style={s.emptyText}>Nessuna timbratura registrata</Text>
                <Text style={s.emptyHint}>Usa i pulsanti sopra per iniziare</Text>
              </View>
            }
          />
      }

      <Modal visible={showForm} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView>
            <View style={s.sheet}>
              <View style={s.handle} />
              <Text style={s.sheetTitle}>Aggiungi manuale</Text>

              <Text style={s.fieldLabel}>Data</Text>
              <TextInput style={s.input} value={form.date} onChangeText={v => setForm(p => ({ ...p, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Entrata</Text>
                  <TextInput style={s.input} value={form.check_in} onChangeText={v => setForm(p => ({ ...p, check_in: v }))} placeholder="08:00" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Uscita</Text>
                  <TextInput style={s.input} value={form.check_out} onChangeText={v => setForm(p => ({ ...p, check_out: v }))} placeholder="17:00" placeholderTextColor="#9CA3AF" />
                </View>
              </View>

              <Text style={s.fieldLabel}>Pausa</Text>
              <View style={s.breakRowForm}>
                {BREAK_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.breakChipLg, form.break_minutes === opt.value && s.breakChipLgActive]}
                    onPress={() => setForm(p => ({ ...p, break_minutes: opt.value }))}
                  >
                    <Text style={[s.breakChipLgText, form.break_minutes === opt.value && s.breakChipLgTextActive]}>
                      {opt.value === 0 ? 'Continuato' : opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {form.check_in && form.check_out && (
                <Text style={s.calcPreview}>
                  Ore nette: {calcHours(form.check_in, form.check_out, form.break_minutes).toFixed(2)}h
                </Text>
              )}
              {!(form.check_in && form.check_out) && (
                <>
                  <Text style={s.fieldLabel}>Ore (manuale)</Text>
                  <TextInput style={s.input} value={form.hours_worked} onChangeText={v => setForm(p => ({ ...p, hours_worked: v }))} placeholder="8" keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
                </>
              )}

              <Text style={s.fieldLabel}>Note</Text>
              <TextInput style={s.input} value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder="Facoltativo" placeholderTextColor="#9CA3AF" />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowForm(false)}>
                  <View style={s.cancelBtn}><Text style={s.cancelBtnText}>Annulla</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2 }} onPress={handleManualSave} disabled={saving}>
                  <LinearGradient colors={['#D97706', '#F59E0B']} style={s.saveBtn}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Salva</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Header ──
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 20, color: '#fff', fontWeight: '700', lineHeight: 22 },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  statVal: { fontSize: 15, fontWeight: '800', color: '#111827', lineHeight: 20 },
  statSub: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },

  // ── Action Section ──
  actionSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnGrad: { paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 },
  actionBtnIcon: { fontSize: 13, color: '#fff', fontWeight: '900' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  manualBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  manualBtnText: { color: '#374151', fontWeight: '700', fontSize: 14 },

  // ── Break Section ──
  breakSection: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  breakSectionLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  breakRow: { flexDirection: 'row', gap: 8 },
  breakChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  breakChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  breakChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  breakChipTextActive: { color: '#fff' },

  // ── Codes section ──
  codesSection: { paddingHorizontal: 16, marginBottom: 4, marginTop: 4 },
  codesSectionTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  codesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FEF3C7', borderRadius: 14, marginBottom: 8 },
  codesCollapseBtn: { fontSize: 14, color: '#92400E', fontWeight: '700' },
  codeCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 8 },
  codeCardActive: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  codeCardUsed: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  codeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10, alignSelf: 'center', flexShrink: 0 },
  codeDotGreen: { backgroundColor: '#22C55E' },
  codeDotOrange: { backgroundColor: '#F59E0B' },
  codeDotRed: { backgroundColor: '#EF4444' },
  codeCardRequested: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  codeBoxPending: { backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  codeTextPending: { fontSize: 22 },
  codeCardDate: { fontSize: 13, fontWeight: '700', color: '#78350F' },
  codeCardSub: { fontSize: 11, color: '#92400E', marginTop: 2 },
  codeBox: { backgroundColor: '#D97706', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  codeBoxUsed: { backgroundColor: '#9CA3AF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  codeText: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  codeTextUsed: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 4, textDecorationLine: 'line-through', opacity: 0.8 },

  // ── List ──
  listSectionTitle: { fontSize: 11, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  rowPending: { borderLeftWidth: 3, borderLeftColor: '#F59E0B', backgroundColor: '#FFFDF5' },
  rowDateBadge: { width: 58, backgroundColor: '#FEF9EE', borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  rowDateBadgePending: { backgroundColor: '#FDE68A' },
  rowDateDay: { fontSize: 10, fontWeight: '800', color: '#D97706', letterSpacing: 0.3, marginBottom: 2 },
  rowDateNum: { fontSize: 22, fontWeight: '900', color: '#92400E', lineHeight: 26 },
  rowDateMonth: { fontSize: 11, fontWeight: '700', color: '#D97706', marginTop: 1 },
  rowContent: { flex: 1 },
  rowTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rowHours: { fontSize: 20, fontWeight: '900', color: '#111827' },
  rowBreakBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rowBreakText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  rowTimes: { fontSize: 12, color: '#6B7280', marginBottom: 3, fontWeight: '600' },
  rowNotes: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  requestModBtn: { marginTop: 10, backgroundColor: '#FEF3C7', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#FCD34D' },
  requestModBtnDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  requestModBtnText: { color: '#92400E', fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '800', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },

  // ── Form modal ──
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111827' },
  breakRowForm: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  breakChipLg: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  breakChipLgActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  breakChipLgText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  breakChipLgTextActive: { color: '#fff' },
  calcPreview: { fontSize: 13, color: '#059669', fontWeight: '700', marginTop: 8 },
  cancelBtn: { backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#6B7280', fontWeight: '700' },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
