import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, Alert, ActivityIndicator, Modal, Platform, Dimensions,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { useWarehouse } from '../hooks/useWarehouse'
import { useAuth } from '../hooks/useAuth'
import { RequestItem } from '../hooks/useWarehouse'

const { width } = Dimensions.get('window')

type Step = 'user' | 'search' | 'review' | 'done'

export default function RequestScreen({ navigation, route }: any) {
  const isOrdine = route?.params?.isOrdine ?? false
  const { products, warehouseUsers, submitRequest, loading } = useWarehouse()
  const { profile } = useAuth()

  const [step, setStep] = useState<Step>('user')
  const [selectedUser, setSelectedUser] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<RequestItem[]>([])
  const [notes, setNotes] = useState('')
  const [expectedDate, setExpectedDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [qtyModal, setQtyModal] = useState<{ id: string; name: string; sku: string | null; unit: string; qty: number } | null>(null)

  const filteredUsers = useMemo(() =>
    userSearch.trim().length > 0
      ? warehouseUsers.filter(u => (u.full_name || u.email).toLowerCase().includes(userSearch.toLowerCase()))
      : warehouseUsers,
    [warehouseUsers, userSearch]
  )

  const searchResults = useMemo(() =>
    search.trim().length > 1
      ? products.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 15)
      : [],
    [products, search]
  )

  const addItem = (product: { id: string; name: string; sku: string | null; unit: string }, qty: number) => {
    if (qty <= 0) return
    setItems(prev => {
      const i = prev.findIndex(x => x.product_id === product.id)
      if (i >= 0) {
        const n = [...prev]; n[i] = { ...n[i], quantity: qty }; return n
      }
      return [...prev, { product_id: product.id, product_name: product.name, sku: product.sku, quantity: qty, unit: product.unit }]
    })
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(x => x.product_id !== id))

  const handleSubmit = async () => {
    if (items.length === 0) { Alert.alert('Attenzione', 'Aggiungi almeno un prodotto'); return }
    setSubmitting(true)
    const result = await submitRequest(
      selectedUser, items, isOrdine ? 'ordine' : 'prelievo',
      notes,
      expectedDate ? expectedDate.toISOString().split('T')[0] : undefined
    )
    setSubmitting(false)
    if (result) setStep('done')
    else Alert.alert('Errore', 'Invio fallito, riprova')
  }

  // ── STEP: Scegli utente ──
  if (step === 'user') return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F1FBF', '#7C3AED']} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTextWhite}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{isOrdine ? '🛒 Nuovo Ordine' : '📦 Prelievo'}</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>
      <View style={styles.bodyPad}>
        <Text style={styles.sectionTitle}>Chi sei?</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca nome..."
            value={userSearch}
            onChangeText={setUserSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={u => u.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        renderItem={({ item: u }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => { setSelectedUser(u.full_name || u.email); setStep('search') }}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(u.full_name || u.email)[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{u.full_name || u.email}</Text>
              {u.full_name && <Text style={styles.userEmail}>{u.email}</Text>}
            </View>
            <Text style={{ color: '#7C3AED', fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nessun utente trovato</Text>}
      />
    </View>
  )

  // ── STEP: Cerca prodotti ──
  if (step === 'search') return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F1FBF', '#7C3AED']} style={styles.topBar}>
        <TouchableOpacity onPress={() => setStep('user')}>
          <Text style={styles.backTextWhite}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Prodotti</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <View style={styles.bodyPad}>
        <Text style={styles.userPill}>Per: <Text style={{ color: '#7C3AED', fontWeight: '700' }}>{selectedUser}</Text></Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per nome, SKU, barcode..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
        </View>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={p => p.id}
        style={{ maxHeight: 260 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item: p }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => setQtyModal({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, qty: 1 })}>
            <View style={styles.productIconBox}>
              <Text style={{ fontSize: 22 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{p.name}</Text>
              {p.sku && <Text style={styles.productSku}>SKU: {p.sku}</Text>}
            </View>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{p.quantity} {p.unit}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={search.trim().length > 1 ? <Text style={styles.empty}>Nessun risultato</Text> : (
          <Text style={styles.emptyHint}>Digita almeno 2 caratteri per cercare</Text>
        )}
      />

      {/* Carrello */}
      {items.length > 0 && (
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>🛒 Carrello  <Text style={styles.cartBadge}>{items.length}</Text></Text>
          {items.map(i => (
            <View key={i.product_id} style={styles.cartRow}>
              <Text style={styles.cartName} numberOfLines={1}>{i.product_name}</Text>
              <Text style={styles.cartQty}>{i.quantity} {i.unit}</Text>
              <TouchableOpacity onPress={() => removeItem(i.product_id)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.continueBtn} onPress={() => setStep('review')}>
            <Text style={styles.continueBtnText}>Rivedi e invia →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Qty modal */}
      <Modal visible={!!qtyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.qtyCard}>
            <View style={styles.qtyHandle} />
            <Text style={styles.qtyTitle}>{qtyModal?.name}</Text>
            {qtyModal?.sku && <Text style={styles.qtySku}>SKU: {qtyModal.sku}</Text>}
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQtyModal(q => q ? { ...q, qty: Math.max(1, q.qty - 1) } : null)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qtyModal?.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQtyModal(q => q ? { ...q, qty: q.qty + 1 } : null)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.qtyUnit}>unità: {qtyModal?.unit}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F3F4F6' }]} onPress={() => setQtyModal(null)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { flex: 1 }]} onPress={() => {
                if (qtyModal) { addItem(qtyModal, qtyModal.qty); setQtyModal(null); setSearch('') }
              }}>
                <LinearGradient colors={['#7C3AED', '#9F67F8']} style={styles.modalBtnGrad}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Aggiungi al carrello</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )

  // ── STEP: Review ──
  if (step === 'review') return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#4F1FBF', '#7C3AED']} style={styles.topBar}>
        <TouchableOpacity onPress={() => setStep('search')}>
          <Text style={styles.backTextWhite}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Riepilogo</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Richiedente</Text>
            <Text style={styles.infoValue}>{selectedUser}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>📋 Tipo</Text>
            <View style={[styles.typeBadge, { backgroundColor: isOrdine ? '#E0F2FE' : '#EDE9FE' }]}>
              <Text style={[styles.typeBadgeText, { color: isOrdine ? '#0891B2' : '#7C3AED' }]}>
                {isOrdine ? 'Ordine' : 'Prelievo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Products */}
        <Text style={styles.sectionTitle}>Prodotti richiesti</Text>
        {items.map(i => (
          <View key={i.product_id} style={styles.reviewItem}>
            <View style={styles.reviewItemIcon}><Text>📦</Text></View>
            <Text style={styles.reviewItemName}>{i.product_name}</Text>
            <View style={styles.reviewQtyBadge}>
              <Text style={styles.reviewQtyText}>{i.quantity} {i.unit}</Text>
            </View>
          </View>
        ))}

        {/* Note */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Note</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Aggiungi note opzionali..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholderTextColor="#9CA3AF"
        />

        {/* Data prevista (solo ordine) */}
        {isOrdine && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Data prevista</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerIcon}>📅</Text>
              <Text style={[styles.datePickerText, !expectedDate && { color: '#9CA3AF' }]}>
                {expectedDate
                  ? expectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Seleziona una data'}
              </Text>
              {expectedDate && (
                <TouchableOpacity onPress={() => setExpectedDate(null)}>
                  <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showDatePicker && (
              <Modal visible transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={styles.calendarCard}>
                    <View style={styles.qtyHandle} />
                    <Text style={styles.calendarTitle}>📅 Seleziona data prevista</Text>
                    <DateTimePicker
                      value={expectedDate || new Date()}
                      mode="date"
                      display="inline"
                      minimumDate={new Date()}
                      themeVariant="light"
                      accentColor="#7C3AED"
                      onChange={(_, date) => {
                        if (date) setExpectedDate(date)
                      }}
                      style={{ width: width - 48 }}
                    />
                    <TouchableOpacity
                      style={[styles.continueBtn, { marginTop: 12 }]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.continueBtnText}>Conferma data</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          </>
        )}

        {/* Submit */}
        <TouchableOpacity style={styles.submitWrapper} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient colors={['#7C3AED', '#9F67F8']} style={styles.submitBtn}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>✓ Invia richiesta</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  // ── STEP: Done ──
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <LinearGradient colors={['#7C3AED', '#9F67F8']} style={styles.doneCircle}>
        <Text style={{ fontSize: 48 }}>✓</Text>
      </LinearGradient>
      <Text style={styles.doneTitle}>Richiesta inviata!</Text>
      <Text style={styles.doneSub}>La tua richiesta è stata registrata con successo</Text>
      <TouchableOpacity style={styles.submitWrapper} onPress={() => {
        setStep('user'); setItems([]); setSelectedUser(''); setNotes('')
        setExpectedDate(null); navigation.goBack()
      }}>
        <LinearGradient colors={['#7C3AED', '#9F67F8']} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Torna alla Home</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  label: { fontSize: 15, color: '#374151', fontWeight: '600', marginBottom: 8 },
  subLabel: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 24 },
  emptyHint: { textAlign: 'center', color: '#C4C4D0', marginTop: 16, fontSize: 13 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 18, paddingHorizontal: 20,
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  backTextWhite: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', width: 80 },
  bodyPad: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  // Search box
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, marginBottom: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  // User cards
  userPill: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  userAvatarText: { color: '#7C3AED', fontWeight: '800', fontSize: 18 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Product cards
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  productIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F4F4F8', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  productSku: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  qtyBadge: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  qtyBadgeText: { fontSize: 12, color: '#059669', fontWeight: '700' },

  // Cart
  cartBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    margin: 20, marginTop: 8,
    shadowColor: '#7C3AED', shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
  },
  cartTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  cartBadge: {
    fontSize: 12, color: '#7C3AED', fontWeight: '700',
    backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  cartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cartName: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  cartQty: { fontSize: 13, color: '#7C3AED', fontWeight: '700', marginRight: 10 },
  removeBtn: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  continueBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal / Qty
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  qtyCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  qtyHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  qtyTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  qtySku: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  qtyUnit: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: -16, marginBottom: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 28 },
  qtyBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 26, color: '#7C3AED', fontWeight: '700' },
  qtyValue: { fontSize: 36, fontWeight: '900', color: '#111827', minWidth: 56, textAlign: 'center' },
  modalBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  modalBtnGrad: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', alignSelf: 'stretch' },

  // Review
  infoCard: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  typeBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  typeBadgeText: { fontSize: 13, fontWeight: '700' },
  reviewItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  reviewItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F4F4F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reviewItemName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewQtyBadge: { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  reviewQtyText: { fontSize: 13, color: '#7C3AED', fontWeight: '700' },
  noteInput: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, fontSize: 15,
    color: '#111827', minHeight: 90, textAlignVertical: 'top',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  datePickerIcon: { fontSize: 20 },
  datePickerText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  calendarCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  calendarTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 16 },
  submitWrapper: { marginTop: 28, marginBottom: 60, borderRadius: 18, overflow: 'hidden', shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  submitBtn: { paddingVertical: 17, alignItems: 'center', borderRadius: 18 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  // Done
  doneCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  doneTitle: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 8 },
  doneSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
})
