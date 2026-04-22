import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { useWarehouse } from '../hooks/useWarehouse'
import { useAuth } from '../hooks/useAuth'
import { RequestItem } from '../hooks/useWarehouse'

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
  const [expectedDate, setExpectedDate] = useState('')
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
    const result = await submitRequest(selectedUser, items, isOrdine ? 'ordine' : 'prelievo', notes, expectedDate || undefined)
    setSubmitting(false)
    if (result) setStep('done')
    else Alert.alert('Errore', 'Invio fallito, riprova')
  }

  // ── STEP: Scegli utente ──
  if (step === 'user') return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <Text style={styles.title}>{isOrdine ? '🛒 Ordine' : '📦 Prelievo'}</Text>
      <Text style={styles.label}>Chi sei?</Text>
      <TextInput style={styles.input} placeholder="Cerca nome..." value={userSearch} onChangeText={setUserSearch} placeholderTextColor="#9CA3AF" />
      <FlatList
        data={filteredUsers}
        keyExtractor={u => u.id}
        renderItem={({ item: u }) => (
          <TouchableOpacity style={styles.userRow} onPress={() => { setSelectedUser(u.full_name || u.email); setStep('search') }}>
            <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{(u.full_name || u.email)[0].toUpperCase()}</Text></View>
            <Text style={styles.userName}>{u.full_name || u.email}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nessun utente trovato</Text>}
      />
    </View>
  )

  // ── STEP: Cerca prodotti ──
  if (step === 'search') return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('user')}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <Text style={styles.title}>Aggiungi prodotti</Text>
      <Text style={styles.subLabel}>Per: <Text style={{ fontWeight: '700', color: '#7C3AED' }}>{selectedUser}</Text></Text>
      <TextInput style={styles.input} placeholder="Cerca per nome, SKU, barcode..." value={search} onChangeText={setSearch} placeholderTextColor="#9CA3AF" autoFocus />

      {/* Risultati ricerca */}
      <FlatList
        data={searchResults}
        keyExtractor={p => p.id}
        style={{ maxHeight: 280 }}
        renderItem={({ item: p }) => (
            <TouchableOpacity style={styles.productRow} onPress={() => setQtyModal({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, qty: 1 })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{p.name}</Text>
              {p.sku && <Text style={styles.productSku}>{p.sku}</Text>}
            </View>
            <Text style={styles.productQty}>Disp: {p.quantity} {p.unit}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={search.trim().length > 1 ? <Text style={styles.empty}>Nessun risultato</Text> : null}
      />

      {/* Carrello */}
      {items.length > 0 && (
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>Carrello ({items.length})</Text>
          {items.map(i => (
            <View key={i.product_id} style={styles.cartRow}>
              <Text style={styles.cartName} numberOfLines={1}>{i.product_name}</Text>
              <Text style={styles.cartQty}>{i.quantity} {i.unit}</Text>
              <TouchableOpacity onPress={() => removeItem(i.product_id)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.continueBtn} onPress={() => setStep('review')}>
            <Text style={styles.continueBtnText}>Rivedi e invia →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Qty modal */}
      <Modal visible={!!qtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qtyCard}>
            <Text style={styles.qtyTitle}>{qtyModal?.name}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQtyModal(q => q ? { ...q, qty: Math.max(1, q.qty - 1) } : null)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qtyModal?.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQtyModal(q => q ? { ...q, qty: q.qty + 1 } : null)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F3F4F6' }]} onPress={() => setQtyModal(null)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7C3AED', flex: 1 }]} onPress={() => {
                if (qtyModal) { addItem(qtyModal, qtyModal.qty); setQtyModal(null); setSearch('') }
              }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )

  // ── STEP: Review ──
  if (step === 'review') return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('search')}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <Text style={styles.title}>Riepilogo</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Richiedente</Text>
        <Text style={styles.reviewValue}>{selectedUser}</Text>
        <Text style={styles.reviewLabel}>Tipo</Text>
        <Text style={styles.reviewValue}>{isOrdine ? 'Ordine' : 'Prelievo'}</Text>
      </View>
      {items.map(i => (
        <View key={i.product_id} style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>{i.product_name}</Text>
          <Text style={styles.reviewItemQty}>{i.quantity} {i.unit}</Text>
        </View>
      ))}
      <TextInput style={[styles.input, { marginTop: 16 }]} placeholder="Note (opzionale)" value={notes} onChangeText={setNotes} multiline placeholderTextColor="#9CA3AF" />
      {isOrdine && (
        <TextInput style={styles.input} placeholder="Data prevista (YYYY-MM-DD)" value={expectedDate} onChangeText={setExpectedDate} placeholderTextColor="#9CA3AF" />
      )}
      <TouchableOpacity style={[styles.continueBtn, { marginTop: 24 }]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Invia richiesta ✓</Text>}
      </TouchableOpacity>
    </ScrollView>
  )

  // ── STEP: Done ──
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 64 }}>✅</Text>
      <Text style={[styles.title, { textAlign: 'center', marginTop: 16 }]}>Richiesta inviata!</Text>
      <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 32 }}>La tua richiesta è stata registrata</Text>
      <TouchableOpacity style={styles.continueBtn} onPress={() => { setStep('user'); setItems([]); setSelectedUser(''); setNotes(''); setExpectedDate(''); navigation.goBack() }}>
        <Text style={styles.continueBtnText}>Torna alla Home</Text>
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
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  userAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#7C3AED', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  productSku: { fontSize: 12, color: '#9CA3AF' },
  productQty: { fontSize: 12, color: '#059669', fontWeight: '600' },
  cartBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, shadowColor: '#7C3AED', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cartTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cartName: { flex: 1, fontSize: 13, color: '#111827' },
  cartQty: { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginRight: 8 },
  removeBtn: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  continueBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  qtyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '80%' },
  qtyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 22, color: '#7C3AED', fontWeight: '700' },
  qtyValue: { fontSize: 28, fontWeight: '800', color: '#111827', minWidth: 40, textAlign: 'center' },
  modalBtn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  reviewLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  reviewValue: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  reviewItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6 },
  reviewItemName: { fontSize: 14, color: '#111827', flex: 1 },
  reviewItemQty: { fontSize: 14, color: '#7C3AED', fontWeight: '700' },
})
