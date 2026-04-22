import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Lavorazione {
  id: string
  title: string
  status: string
  priority: string | null
  client_name: string | null
  description: string | null
  created_at: string
  due_date: string | null
  assignee_id: string | null
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  aperta:     { label: 'Aperta',     color: '#7C3AED', bg: '#F5F3FF' },
  in_corso:   { label: 'In corso',   color: '#D97706', bg: '#FFFBEB' },
  completata: { label: 'Completata', color: '#059669', bg: '#ECFDF5' },
  chiusa:     { label: 'Chiusa',     color: '#6B7280', bg: '#F9FAFB' },
  annullata:  { label: 'Annullata',  color: '#DC2626', bg: '#FEF2F2' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function LavorazioniScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Lavorazione | null>(null)
  const [filter, setFilter] = useState<'tutte' | 'attive' | 'completate'>('attive')

  const fetchLavorazioni = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // fetch lavorazioni assigned to this user
    const { data } = await supabase
      .from('lavorazioni')
      .select('id, title, status, priority, client_name, description, created_at, due_date, assignee_id')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })
    setLavorazioni((data || []) as Lavorazione[])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchLavorazioni() }, [fetchLavorazioni])

  const filtered = lavorazioni.filter(l => {
    if (filter === 'attive') return ['aperta', 'in_corso'].includes(l.status)
    if (filter === 'completate') return ['completata', 'chiusa'].includes(l.status)
    return true
  })

  const attive = lavorazioni.filter(l => ['aperta', 'in_corso'].includes(l.status)).length

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#0F766E', '#14B8A6']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Indietro</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>🔧 Lavorazioni</Text>
        </View>
        <Text style={s.headerSub}>{attive} attive · {lavorazioni.length} totali</Text>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={s.tabs}>
        {(['attive', 'tutte', 'completate'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.tab, filter === f && s.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[s.tabText, filter === f && s.tabTextActive]}>
              {f === 'attive' ? 'Attive' : f === 'tutte' ? 'Tutte' : 'Completate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        : <FlatList
            data={filtered}
            keyExtractor={l => l.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: l }) => {
              const st = STATUS[l.status] ?? STATUS.aperta
              return (
                <TouchableOpacity style={s.card} onPress={() => setSelected(l)} activeOpacity={0.8}>
                  <View style={s.cardTop}>
                    <Text style={s.cardTitle} numberOfLines={1}>{l.title}</Text>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                      <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  {l.client_name ? (
                    <Text style={s.clientName}>👤 {l.client_name}</Text>
                  ) : null}
                  {l.description ? (
                    <Text style={s.desc} numberOfLines={2}>{l.description}</Text>
                  ) : null}
                  <View style={s.cardBottom}>
                    <Text style={s.cardDate}>{fmtDate(l.created_at)}</Text>
                    {l.due_date && <Text style={s.dueDate}>Scadenza: {fmtDate(l.due_date)}</Text>}
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🔧</Text>
                <Text style={s.emptyText}>
                  {filter === 'attive' ? 'Nessuna lavorazione attiva' : 'Nessuna lavorazione'}
                </Text>
                <Text style={s.emptyHint}>Le lavorazioni assegnate a te appariranno qui</Text>
              </View>
            }
          />
      }

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            {selected && (() => {
              const st = STATUS[selected.status] ?? STATUS.aperta
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={[s.badge, { backgroundColor: st.bg, alignSelf: 'flex-start', marginBottom: 8 }]}>
                    <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <Text style={s.sheetTitle}>{selected.title}</Text>
                  {selected.client_name && <Text style={s.sheetSub}>👤 {selected.client_name}</Text>}
                  {selected.description && (
                    <View style={s.descBox}>
                      <Text style={s.sectionLabel}>Descrizione</Text>
                      <Text style={s.descFull}>{selected.description}</Text>
                    </View>
                  )}
                  <View style={s.metaRow}>
                    <View style={s.metaItem}>
                      <Text style={s.metaLabel}>Creata</Text>
                      <Text style={s.metaVal}>{fmtDate(selected.created_at)}</Text>
                    </View>
                    {selected.due_date && (
                      <View style={s.metaItem}>
                        <Text style={s.metaLabel}>Scadenza</Text>
                        <Text style={[s.metaVal, { color: '#DC2626' }]}>{fmtDate(selected.due_date)}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setSelected(null)}>
                    <View style={s.closeBtn}><Text style={s.closeBtnText}>Chiudi</Text></View>
                  </TouchableOpacity>
                </ScrollView>
              )
            })()}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0FDFB' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#0F766E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 13, color: '#0F766E', fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  dueDate: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sheetSub: { fontSize: 14, color: '#0F766E', fontWeight: '600', marginBottom: 12 },
  descBox: { backgroundColor: '#F0FDFB', borderRadius: 12, padding: 12, marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  descFull: { fontSize: 14, color: '#374151', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  metaItem: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  metaLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  metaVal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  closeBtn: { backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#6B7280', fontWeight: '700', fontSize: 15 },
})
