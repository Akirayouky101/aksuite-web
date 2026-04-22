import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native'
import { useTickets } from '../hooks/useTickets'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['assistenza', 'ordine', 'preventivo', 'documentazione', 'chiamata']
const PRIORITIES = [
  { value: 'bassa', label: 'Bassa', color: '#059669' },
  { value: 'normale', label: 'Normale', color: '#0891B2' },
  { value: 'alta', label: 'Alta', color: '#D97706' },
  { value: 'urgente', label: 'Urgente', color: '#DC2626' },
] as const

type Step = 'list' | 'new' | 'done'

export default function TicketScreen({ navigation }: any) {
  const { tickets, adminProfiles, loading, createTicket } = useTickets()
  const { profile } = useAuth()
  const [step, setStep] = useState<Step>('list')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('assistenza')
  const [priority, setPriority] = useState<'bassa' | 'normale' | 'alta' | 'urgente'>('normale')
  const [selectedAssignees, setSelectedAssignees] = useState<{ user_id: string; user_name: string }[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const statusColor = (s: string) => ({
    aperto: '#DC2626', in_corso: '#D97706', completato: '#059669', chiuso: '#6B7280'
  }[s] ?? '#6B7280')

  const priorityColor = (p: string) => ({
    bassa: '#059669', normale: '#0891B2', alta: '#D97706', urgente: '#DC2626'
  }[p] ?? '#6B7280')

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Attenzione', 'Inserisci un titolo'); return }
    if (selectedAssignees.length === 0) { Alert.alert('Attenzione', 'Seleziona almeno un destinatario'); return }
    setSubmitting(true)
    const result = await createTicket({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      assignees: selectedAssignees,
      creatorName: profile?.full_name || '',
    })
    setSubmitting(false)
    if (result) setStep('done')
    else Alert.alert('Errore', 'Invio fallito, riprova')
  }

  const reset = () => {
    setTitle(''); setDescription(''); setCategory('assistenza'); setPriority('normale')
    setSelectedAssignees([]); setStep('list')
  }

  // ── STEP: Lista ticket ──
  if (step === 'list') return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <View style={styles.titleRow}>
        <Text style={styles.title}>🎫 Ticket</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setStep('new')}>
          <Text style={styles.newBtnText}>+ Nuovo</Text>
        </TouchableOpacity>
      </View>
      {loading
        ? <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
        : <FlatList
            data={tickets}
            keyExtractor={t => t.id}
            renderItem={({ item: t }) => (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{t.title}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor(t.status) + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor(t.status) }]}>{t.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.ticketMeta}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(t.priority) }]} />
                  <Text style={styles.ticketMetaText}>{t.priority} · {t.category}</Text>
                  {t.assignees.length > 0 && <Text style={styles.ticketAssignee}>→ {t.assignees.map(a => a.user_name).join(', ')}</Text>}
                </View>
                {t.description && <Text style={styles.ticketDesc} numberOfLines={2}>{t.description}</Text>}
                <Text style={styles.ticketDate}>{new Date(t.created_at).toLocaleDateString('it-IT')}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Nessun ticket</Text>}
          />
      }
    </View>
  )

  // ── STEP: Nuovo ticket ──
  if (step === 'new') return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('list')}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <Text style={styles.title}>Nuovo Ticket</Text>

      <Text style={styles.label}>Titolo *</Text>
      <TextInput style={styles.input} placeholder="Es: Manca materiale in magazzino" value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Descrizione</Text>
      <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Dettagli..." value={description} onChangeText={setDescription} multiline placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Priorità</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map(p => (
          <TouchableOpacity key={p.value} style={[styles.priorityChip, priority === p.value && { backgroundColor: p.color }]} onPress={() => setPriority(p.value)}>
            <Text style={[styles.priorityText, priority === p.value && { color: '#fff' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Invia a *</Text>
      {selectedAssignees.length > 0 && (
        <View style={styles.assigneeList}>
          {selectedAssignees.map(a => (
            <View key={a.user_id} style={styles.assigneeChip}>
              <Text style={styles.assigneeName}>{a.user_name}</Text>
              <TouchableOpacity onPress={() => setSelectedAssignees(prev => prev.filter(x => x.user_id !== a.user_id))}>
                <Text style={styles.removeAssignee}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
        <Text style={styles.pickerBtnText}>{selectedAssignees.length === 0 ? 'Seleziona persone...' : 'Modifica selezione'} ↓</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitBtn, { marginTop: 24 }]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Crea Ticket ✓</Text>}
      </TouchableOpacity>

      {/* Assignee picker */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Seleziona destinatari</Text>
            <FlatList
              data={adminProfiles}
              keyExtractor={p => p.id}
              renderItem={({ item: p }) => {
                const sel = selectedAssignees.some(a => a.user_id === p.id)
                return (
                  <TouchableOpacity style={[styles.pickerRow, sel && styles.pickerRowSel]} onPress={() => {
                    setSelectedAssignees(prev =>
                      sel ? prev.filter(a => a.user_id !== p.id) : [...prev, { user_id: p.id, user_name: p.full_name || p.email }]
                    )
                  }}>
                    <View style={[styles.checkBox, sel && styles.checkBoxSel]}>
                      {sel && <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={styles.pickerName}>{p.full_name || p.email}</Text>
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<Text style={styles.empty}>Nessun admin disponibile</Text>}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.submitBtnText}>Conferma ({selectedAssignees.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )

  // ── STEP: Done ──
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 64 }}>✅</Text>
      <Text style={[styles.title, { textAlign: 'center', marginTop: 16 }]}>Ticket creato!</Text>
      <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 32 }}>I destinatari sono stati notificati</Text>
      <TouchableOpacity style={styles.submitBtn} onPress={reset}>
        <Text style={styles.submitBtnText}>Torna ai ticket</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  newBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ticketCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ticketMetaText: { fontSize: 12, color: '#6B7280', marginLeft: 6 },
  ticketAssignee: { fontSize: 12, color: '#7C3AED', marginLeft: 8, fontWeight: '600' },
  ticketDesc: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  ticketDate: { fontSize: 11, color: '#9CA3AF' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: '#7C3AED' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priorityChip: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  priorityText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  assigneeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  assigneeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  assigneeName: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  removeAssignee: { color: '#9CA3AF', fontWeight: '700', fontSize: 13 },
  pickerBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16 },
  pickerBtnText: { color: '#6B7280', fontSize: 14 },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  pickerRowSel: { backgroundColor: '#F5F3FF' },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkBoxSel: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  pickerName: { fontSize: 15, color: '#111827', fontWeight: '500' },
})
