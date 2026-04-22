import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native'
import { useKits } from '../hooks/useKits'
import { useWarehouse } from '../hooks/useWarehouse'

export default function KitsScreen({ navigation }: any) {
  const { kits, loading } = useKits()
  const { products } = useWarehouse()
  const [selected, setSelected] = useState<string | null>(null)

  const selectedKit = kits.find(k => k.id === selected)

  const getAvailability = (kitId: string) => {
    const kit = kits.find(k => k.id === kitId)
    if (!kit?.items) return []
    return kit.items.map(item => {
      const prod = products.find(p => p.id === item.product_id)
      return {
        ...item,
        current_qty: prod?.quantity ?? 0,
        is_available: (prod?.quantity ?? 0) >= item.quantity,
      }
    })
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /></View>

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Indietro</Text></TouchableOpacity>
      <Text style={styles.title}>🧰 KIT</Text>

      <FlatList
        data={kits}
        keyExtractor={k => k.id}
        renderItem={({ item: kit }) => {
          const avail = getAvailability(kit.id)
          const allOk = avail.length > 0 && avail.every(a => a.is_available)
          const someOk = avail.some(a => a.is_available)
          return (
            <TouchableOpacity style={styles.kitCard} onPress={() => setSelected(kit.id)}>
              <View style={styles.kitHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kitName}>{kit.name}</Text>
                  {kit.sku && <Text style={styles.kitSku}>{kit.sku}</Text>}
                  <Text style={styles.kitCategory}>{kit.category}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: allOk ? '#D1FAE5' : someOk ? '#FEF3C7' : '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: allOk ? '#059669' : someOk ? '#D97706' : '#DC2626' }]}>
                    {allOk ? 'Disponibile' : someOk ? 'Parziale' : 'Non disp.'}
                  </Text>
                </View>
              </View>
              {kit.description && <Text style={styles.kitDesc}>{kit.description}</Text>}
              <Text style={styles.kitItems}>{kit.items?.length ?? 0} componenti</Text>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nessun kit disponibile</Text>}
      />

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedKit?.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {selected && getAvailability(selected).map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    {item.product_sku && <Text style={styles.itemSku}>{item.product_sku}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemNeed}>Serve: {item.quantity}</Text>
                    <Text style={[styles.itemHave, { color: item.is_available ? '#059669' : '#DC2626' }]}>
                      Disp: {item.current_qty}
                    </Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: item.is_available ? '#059669' : '#DC2626' }]} />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  kitCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  kitHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  kitName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  kitSku: { fontSize: 12, color: '#9CA3AF' },
  kitCategory: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
  kitDesc: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  kitItems: { fontSize: 12, color: '#9CA3AF' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  closeBtn: { fontSize: 20, color: '#9CA3AF', padding: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSku: { fontSize: 11, color: '#9CA3AF' },
  itemNeed: { fontSize: 12, color: '#6B7280' },
  itemHave: { fontSize: 13, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
})
