import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
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
  code: string
  created_at: string
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

export default function TimbratureScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [pendingCodes, setPendingCodes] = useState<PendingCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(60)
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
      const { data: codes, error } = await supabase
        .from('hr_modification_codes')
        .select('*')
        .eq('profile_id', user.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
      if (error || !codes?.length) { setPendingCodes([]); return }
      const recordIds = codes.map((c: any) => c.record_id)
      const { data: recs } = await supabase
        .from('hr_work_records').select('id, date').in('id', recordIds)
      const recMap = new Map((recs || []).map((r: any) => [r.id, r.date]))
      setPendingCodes(codes.map((c: any) => ({ ...c, date: recMap.get(c.record_id) })))
    } catch { setPendingCodes([]) }
  }, [user?.id])

  useEffect(() => {
    fetchRecords()
    fetchPendingCodes()
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

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#D97706', '#F59E0B']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{'\u2190 Indietro'}</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>{'\uD83D\uDD50 Timbrature'}</Text>
        </View>
        <Text style={s.headerSub}>
          {(profile as any)?.full_name || 'Le mie ore'}{' \u00b7 '}{records.length} registrazioni
        </Text>
      </LinearGradient>

      <View style={s.quickRow}>
        <View style={s.todayCard}>
          <Text style={s.todayLabel}>Oggi</Text>
          {todayRec ? (
            <Text style={s.todayVal}>
              {todayRec.check_in ?? '--:--'} {todayRec.check_out ? `\u2192 ${todayRec.check_out}` : '\u2192 in corso'}
            </Text>
          ) : (
            <Text style={s.todayVal}>Non timbrato</Text>
          )}
        </View>
        <View style={s.todayCard}>
          <Text style={s.todayLabel}>Ultimi 30gg</Text>
          <Text style={s.todayVal}>{totalHours.toFixed(1)}h</Text>
        </View>
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.clockBtn} onPress={handleClockIn} disabled={saving || !!todayRec?.check_in}>
          <LinearGradient colors={['#059669', '#34D399']} style={[s.clockBtnGrad, (saving || !!todayRec?.check_in) && { opacity: 0.4 }]}>
            <Text style={s.clockBtnText}>{'\u25ba Entrata'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={s.clockBtn} onPress={handleClockOut} disabled={saving || !todayRec?.check_in || !!todayRec?.check_out}>
          <LinearGradient colors={['#DC2626', '#F87171']} style={[s.clockBtnGrad, (saving || !todayRec?.check_in || !!todayRec?.check_out) && { opacity: 0.4 }]}>
            <Text style={s.clockBtnText}>{'\u25a0 Uscita'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={s.manualBtn} onPress={() => setShowForm(true)}>
          <Text style={s.manualBtnText}>+ Manuale</Text>
        </TouchableOpacity>
      </View>

      <View style={s.breakRow}>
        <Text style={s.breakLabel}>Pausa:</Text>
        {BREAK_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.breakChip, breakMinutes === opt.value && s.breakChipActive]}
            onPress={() => setBreakMinutes(opt.value)}
          >
            <Text style={[s.breakChipText, breakMinutes === opt.value && s.breakChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {pendingCodes.length > 0 && (
        <View style={s.codesSection}>
          <Text style={s.codesSectionTitle}>{'\uD83D\uDD14 Richieste di modifica'}</Text>
          {pendingCodes.map(c => (
            <View key={c.id} style={s.codeCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.codeCardDate}>{c.date ? fmtDate(c.date) : '\u2014'}</Text>
                <Text style={s.codeCardSub}>Mostra questo codice al responsabile</Text>
              </View>
              <View style={s.codeBox}>
                <Text style={s.codeText}>{c.code}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {loading
        ? <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
        : <FlatList
            data={records}
            keyExtractor={r => r.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: r }) => (
              <View style={s.row}>
                <View style={s.rowDate}>
                  <Text style={s.rowDateText}>{fmtDate(r.date)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowHours}>{Number(r.hours_worked).toFixed(1)}h</Text>
                  {r.check_in && (
                    <Text style={s.rowTimes}>
                      {r.check_in}{r.check_out ? ` \u2192 ${r.check_out}` : ' \u2192 in corso'}
                    </Text>
                  )}
                  <Text style={[s.rowBreak, r.break_minutes === 0 && { color: '#059669' }]}>
                    {fmtBreak(r.break_minutes ?? 60)}
                  </Text>
                  {r.notes ? <Text style={s.rowNotes}>{r.notes}</Text> : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>{'\uD83D\uDD50'}</Text>
                <Text style={s.emptyText}>Nessuna timbratura registrata</Text>
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
  screen: { flex: 1, backgroundColor: '#FFFBF0' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  todayCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#D97706', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  todayLabel: { fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  todayVal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  btnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14, marginBottom: 0 },
  clockBtn: { flex: 1 },
  clockBtnGrad: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  clockBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  manualBtn: { paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12 },
  manualBtnText: { color: '#6B7280', fontWeight: '700', fontSize: 13 },
  breakRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  breakLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginRight: 2 },
  breakChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  breakChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  breakChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  breakChipTextActive: { color: '#fff' },
  codesSection: { paddingHorizontal: 16, marginBottom: 4 },
  codesSectionTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  codeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#FCD34D', marginBottom: 8 },
  codeCardDate: { fontSize: 13, fontWeight: '700', color: '#78350F' },
  codeCardSub: { fontSize: 11, color: '#92400E', marginTop: 2 },
  codeBox: { backgroundColor: '#D97706', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  codeText: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  rowDate: { width: 72, backgroundColor: '#FEF3C7', borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 8 },
  rowDateText: { fontSize: 11, fontWeight: '700', color: '#D97706', textAlign: 'center' },
  rowHours: { fontSize: 18, fontWeight: '800', color: '#111827' },
  rowTimes: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rowBreak: { fontSize: 11, color: '#D97706', fontWeight: '600', marginTop: 2 },
  rowNotes: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
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
