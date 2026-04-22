import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
  Platform, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTickets, Ticket } from '../hooks/useTickets'
import { useAuth } from '../hooks/useAuth'

const PRIORITIES = [
  { value: 'bassa',   label: 'Bassa',   color: '#059669', bg: '#ECFDF5' },
  { value: 'normale', label: 'Normale', color: '#0891B2', bg: '#EFF6FF' },
  { value: 'alta',    label: 'Alta',    color: '#D97706', bg: '#FFFBEB' },
  { value: 'urgente', label: 'Urgente', color: '#DC2626', bg: '#FEF2F2' },
] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aperto:     { label: 'Aperto',     color: '#7C3AED', bg: '#F5F3FF' },
  in_corso:   { label: 'In corso',   color: '#D97706', bg: '#FFFBEB' },
  completato: { label: 'Completato', color: '#059669', bg: '#ECFDF5' },
  chiuso:     { label: 'Chiuso',     color: '#6B7280', bg: '#F9FAFB' },
}

function fmtSerial(n: number | null): string {
  if (!n) return ''
  return '#' + n.toString().padStart(4, '0')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

type Step = 'list' | 'new' | 'done'

export default function TicketScreen({ navigation }: any) {
  const { tickets, adminProfiles, loading, createTicket, addReply } = useTickets()
  const { profile, user } = useAuth()

  const [step, setStep] = useState<Step>('list')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'bassa' | 'normale' | 'alta' | 'urgente'>('normale')
  const [selectedAssignees, setSelectedAssignees] = useState<{ user_id: string; user_name: string }[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const repliesScrollRef = useRef<ScrollView>(null)

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Attenzione', 'Inserisci un titolo'); return }
    if (selectedAssignees.length === 0) { Alert.alert('Attenzione', 'Seleziona almeno un destinatario'); return }
    setSubmitting(true)
    const result = await createTicket({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignees: selectedAssignees,
      creatorName: profile?.full_name || '',
    })
    setSubmitting(false)
    if (result) setStep('done')
    else Alert.alert('Errore', 'Invio fallito, riprova')
  }

  const handleReply = async () => {
    if (!replyText.trim() || !detailTicket) return
    const text = replyText.trim()
    setSendingReply(true)
    setReplyText('')
    const r = await addReply(detailTicket.id, text)
    setSendingReply(false)
    if (r) {
      setTimeout(() => repliesScrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const reset = () => {
    setTitle(''); setDescription(''); setPriority('normale')
    setSelectedAssignees([]); setStep('list')
  }

  // Sync detailTicket replies from live data
  const liveTicket = detailTicket ? tickets.find(t => t.id === detailTicket.id) : null
  const displayTicket = liveTicket || detailTicket

  // ── DETAIL MODAL ──
  const renderDetail = () => {
    if (!displayTicket) return null
    const st = STATUS_CONFIG[displayTicket.status] ?? STATUS_CONFIG.aperto
    const pr = PRIORITIES.find(p => p.value === displayTicket.priority)

    return (
      <Modal visible={!!detailTicket} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <View style={s.screen}>
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.detailHeader}>
              <TouchableOpacity onPress={() => setDetailTicket(null)} style={s.backBtn}>
                <Text style={s.backText}>✕ Chiudi</Text>
              </TouchableOpacity>
              <View style={s.headerRow}>
                <View style={{ flex: 1 }}>
                  {displayTicket.serial_number != null && (
                    <Text style={s.serialBig}>{fmtSerial(displayTicket.serial_number)}</Text>
                  )}
                  <Text style={s.headerTitle} numberOfLines={2}>{displayTicket.title}</Text>
                </View>
                <View style={[s.statusBadgeWhite, { backgroundColor: st.bg }]}>
                  <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {pr && (
                  <View style={s.prBadge}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{pr.label}</Text></View>
                )}
                <View style={[s.prBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>{fmtDate(displayTicket.created_at)}</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView ref={repliesScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {displayTicket.description ? (
                <View style={s.descBox}>
                  <Text style={s.sectionLabel}>Descrizione</Text>
                  <Text style={s.descText}>{displayTicket.description}</Text>
                </View>
              ) : null}

              {displayTicket.assignees.length > 0 && (
                <View style={s.descBox}>
                  <Text style={s.sectionLabel}>Inviato a</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {displayTicket.assignees.map((a: any) => (
                      <View key={a.user_id} style={s.assigneeChip}>
                        <View style={s.assigneeAvatar}>
                          <Text style={s.assigneeAvatarText}>{(a.user_name[0] || '?').toUpperCase()}</Text>
                        </View>
                        <Text style={s.assigneeChipText}>{a.user_name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {displayTicket.created_by_name ? (
                <Text style={s.createdBy}>Aperto da <Text style={{ fontWeight: '700', color: '#374151' }}>{displayTicket.created_by_name}</Text></Text>
              ) : null}

              <Text style={[s.sectionLabel, { marginTop: 20, marginBottom: 10 }]}>
                {displayTicket.replies.length > 0 ? `Risposte (${displayTicket.replies.length})` : 'Nessuna risposta ancora'}
              </Text>

              {displayTicket.replies.map(r => {
                const isMe = r.author_id === user?.id
                return (
                  <View key={r.id} style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                    {!isMe && (
                      <View style={s.bubbleAvatar}>
                        <Text style={s.bubbleAvatarText}>{(r.author_name?.[0] || '?').toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={[s.bubbleBody, isMe ? s.bubbleBodyMe : s.bubbleBodyThem]}>
                      {!isMe && <Text style={s.bubbleAuthor}>{r.author_name}</Text>}
                      <Text style={[s.bubbleText, isMe && { color: '#fff' }]}>{r.content}</Text>
                      <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>{fmtTime(r.created_at)}</Text>
                    </View>
                  </View>
                )
              })}
            </ScrollView>

            <View style={s.replyBar}>
              <TextInput
                style={s.replyInput}
                placeholder="Scrivi una risposta..."
                value={replyText}
                onChangeText={setReplyText}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!replyText.trim() || sendingReply) && { opacity: 0.4 }]}
                onPress={handleReply}
                disabled={!replyText.trim() || sendingReply}
              >
                {sendingReply ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendBtnText}>{'↑'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    )
  }

  // ── LIST ──
  if (step === 'list') return (
    <View style={s.screen}>
      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{'← Indietro'}</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>{'🎫 Ticket'}</Text>
          <TouchableOpacity style={s.newBtn} onPress={() => setStep('new')}>
            <Text style={s.newBtnText}>+ Nuovo</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.headerSub}>{tickets.length} ticket totali</Text>
      </LinearGradient>

      {loading
        ? <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} />
        : <FlatList
            data={tickets}
            keyExtractor={t => t.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: t }) => {
              const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.aperto
              const pr = PRIORITIES.find(p => p.value === t.priority)
              return (
                <TouchableOpacity style={s.card} onPress={() => setDetailTicket(t)} activeOpacity={0.8}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      {t.serial_number != null && (
                        <Text style={s.serialTag}>{fmtSerial(t.serial_number)}</Text>
                      )}
                      <Text style={s.cardTitle} numberOfLines={1}>{t.title}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={s.cardMeta}>
                    <View style={[s.priorityTag, { backgroundColor: pr?.bg ?? '#F3F4F6' }]}>
                      <Text style={[s.priorityTagText, { color: pr?.color ?? '#6B7280' }]}>{t.priority}</Text>
                    </View>
                    {t.assignees.length > 0 && (
                      <Text style={s.assigneeTag} numberOfLines={1}>
                        {'→ '}{t.assignees.map((a: any) => a.user_name.split(' ')[0]).join(', ')}
                      </Text>
                    )}
                    {t.replies.length > 0 && (
                      <View style={s.replyCount}>
                        <Text style={s.replyCountText}>{'💬'} {t.replies.length}</Text>
                      </View>
                    )}
                  </View>
                  {t.description ? <Text style={s.cardDesc} numberOfLines={1}>{t.description}</Text> : null}
                  <Text style={s.cardDate}>{fmtDate(t.created_at)}</Text>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>{'🎫'}</Text>
                <Text style={s.emptyText}>Nessun ticket ancora</Text>
                <Text style={s.emptyHint}>Crea il primo ticket con + Nuovo</Text>
              </View>
            }
          />
      }
      {renderDetail()}
    </View>
  )

  // ── NEW TICKET ──
  if (step === 'new') return (
    <View style={s.screen}>
      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.headerSmall}>
        <TouchableOpacity onPress={() => setStep('list')} style={s.backBtn}>
          <Text style={s.backText}>{'← Indietro'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nuovo Ticket</Text>
      </LinearGradient>

      <ScrollView style={s.formScroll} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.fieldBox}>
          <Text style={s.fieldLabel}>Titolo <Text style={s.required}>*</Text></Text>
          <TextInput style={s.input} placeholder="Es: Manca materiale in magazzino" value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />
        </View>

        <View style={s.fieldBox}>
          <Text style={s.fieldLabel}>Descrizione</Text>
          <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Dettagli aggiuntivi..." value={description} onChangeText={setDescription} multiline placeholderTextColor="#9CA3AF" />
        </View>

        <View style={s.fieldBox}>
          <Text style={s.fieldLabel}>Priorità</Text>
          <View style={s.priorityGrid}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p.value} style={[s.priorityBtn, priority === p.value && { backgroundColor: p.color, borderColor: p.color }]} onPress={() => setPriority(p.value)}>
                <Text style={[s.priorityBtnText, priority === p.value && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.fieldBox}>
          <Text style={s.fieldLabel}>Invia a <Text style={s.required}>*</Text></Text>
          {selectedAssignees.length > 0 && (
            <View style={s.selectedAssignees}>
              {selectedAssignees.map(a => (
                <View key={a.user_id} style={s.assigneeChip}>
                  <View style={s.assigneeAvatar}>
                    <Text style={s.assigneeAvatarText}>{(a.user_name[0] || '?').toUpperCase()}</Text>
                  </View>
                  <Text style={s.assigneeChipText}>{a.user_name.split(' ')[0]}</Text>
                  <TouchableOpacity onPress={() => setSelectedAssignees(prev => prev.filter(x => x.user_id !== a.user_id))}>
                    <Text style={s.removeBtn}>{'✕'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={s.pickerTrigger} onPress={() => setShowPicker(true)}>
            <Text style={s.pickerTriggerText}>{selectedAssignees.length === 0 ? '👤 Seleziona destinatari...' : '✏️ Modifica selezione'}</Text>
            <Text style={s.pickerArrow}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{ marginTop: 8 }}>
          <LinearGradient colors={submitting ? ['#9CA3AF', '#9CA3AF'] : ['#7C3AED', '#5B21B6']} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>{`Crea Ticket ✓`}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHandle} />
            <Text style={s.pickerTitle}>Seleziona destinatari</Text>
            <Text style={s.pickerSub}>{adminProfiles.length} person{adminProfiles.length !== 1 ? 'e' : 'a'} disponibil{adminProfiles.length !== 1 ? 'i' : 'e'}</Text>
            <FlatList
              data={adminProfiles}
              keyExtractor={p => p.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item: p }) => {
                const sel = selectedAssignees.some(a => a.user_id === p.id)
                const name = p.full_name || p.email
                return (
                  <TouchableOpacity style={[s.pickerRow, sel && s.pickerRowSel]} onPress={() => setSelectedAssignees(prev => sel ? prev.filter(a => a.user_id !== p.id) : [...prev, { user_id: p.id, user_name: name }])}>
                    <View style={[s.pickerAvatar, sel && { backgroundColor: '#7C3AED' }]}>
                      <Text style={[s.pickerAvatarText, sel && { color: '#fff' }]}>{(name[0] || '?').toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.pickerName}>{name}</Text>
                      {p.email && p.full_name && <Text style={s.pickerEmail}>{p.email}</Text>}
                    </View>
                    <View style={[s.checkBox, sel && s.checkBoxSel]}>
                      {sel && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{'✓'}</Text>}
                    </View>
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<View style={{ alignItems: 'center', padding: 32 }}><Text style={{ fontSize: 32 }}>{'👥'}</Text><Text style={s.emptyText}>Nessuna persona disponibile</Text></View>}
            />
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={[s.submitBtn, { marginTop: 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.submitBtnText}>Conferma ({selectedAssignees.length})</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )

  return (
    <View style={[s.screen, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
      <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={s.doneCircle}>
        <Text style={{ fontSize: 48 }}>{'✅'}</Text>
      </LinearGradient>
      <Text style={s.doneTitle}>Ticket inviato!</Text>
      <Text style={s.doneSub}>I destinatari sono stati notificati</Text>
      <TouchableOpacity onPress={reset} style={{ width: '100%', marginTop: 32 }}>
        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.submitBtnText}>Torna ai ticket</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FF' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerSmall: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  detailHeader: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', flex: 1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  newBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  serialBig: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '700', marginBottom: 2, letterSpacing: 1 },
  prBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  statusBadgeWhite: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serialTag: { fontSize: 11, color: '#7C3AED', fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  priorityTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  priorityTagText: { fontSize: 11, fontWeight: '700' },
  assigneeTag: { fontSize: 12, color: '#7C3AED', fontWeight: '600', flex: 1 },
  replyCount: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  replyCountText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  descBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  descText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  createdBy: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  bubble: { flexDirection: 'row', marginBottom: 10 },
  bubbleMe: { justifyContent: 'flex-end' },
  bubbleThem: { justifyContent: 'flex-start' },
  bubbleAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2, flexShrink: 0 },
  bubbleAvatarText: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },
  bubbleBody: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  bubbleBodyMe: { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
  bubbleBodyThem: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  bubbleAuthor: { fontSize: 11, color: '#7C3AED', fontWeight: '700', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 19 },
  bubbleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: 28, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8 },
  replyInput: { flex: 1, backgroundColor: '#F8F7FF', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  formScroll: { flex: 1 },
  fieldBox: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  required: { color: '#DC2626' },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827' },
  priorityGrid: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  priorityBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  selectedAssignees: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  assigneeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  assigneeAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  assigneeAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  assigneeChipText: { fontSize: 13, color: '#5B21B6', fontWeight: '600' },
  removeBtn: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  pickerTrigger: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerTriggerText: { fontSize: 14, color: '#6B7280' },
  pickerArrow: { fontSize: 20, color: '#9CA3AF' },
  submitBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  pickerHandle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  pickerSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  pickerRowSel: { backgroundColor: '#F5F3FF' },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  pickerAvatarText: { fontSize: 16, fontWeight: '800', color: '#7C3AED' },
  pickerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  pickerEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkBoxSel: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  doneCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  doneSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
})
