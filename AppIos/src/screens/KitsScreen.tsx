import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#059669" />
    </View>
  )

  const availableCount = kits.filter(k => {
    const avail = getAvailability(k.id)
    return avail.length > 0 && avail.every(a => a.is_available)
  }).length

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#059669', '#047857']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Indietro</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>🧰 KIT</Text>
        </View>
        <Text style={s.headerSub}>{availableCount}/{kits.length} disponibili</Text>
      </LinearGradient>

      <FlatList
        data={kits}
        keyExtractor={k => k.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: kit }) => {
          const avail = getAvailability(kit.id)
          const allOk = avail.length > 0 && avail.every(a => a.is_available)
          const someOk = avail.some(a => a.is_available)
          const statusColor = allOk ? '#059669' : someOk ? '#D97706' : '#DC2626'
          const statusBg = allOk ? '#ECFDF5' : someOk ? '#FFFBEB' : '#FEF2F2'
          const statusLabel = allOk ? 'Disponibile' : someOk ? 'Parziale' : 'Non disp.'
          return (
            <TouchableOpacity style={s.card} onPress={() => setSelected(kit.id)} activeOpacity={0.8}>
              <View style={s.cardTop}>
                <View style={[s.kitIcon, { backgroundColor: statusBg }]}>
                  <Text style={[s.kitIconText, { color: statusColor }]}>🧰</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={s.kitName}>{kit.name}</Text>
                  {kit.sku && <Text style={s.kitSku}>{kit.sku}</Text>}
                  {kit.category && <Text style={s.kitCat}>{kit.category}</Text>}
                </View>
                <View style={[s.badge, { backgroundColor: statusBg }]}>
                  <Text style={[s.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
              {kit.description ? <Text style={s.kitDesc} numberOfLines={2}>{kit.description}</Text> : null}
              <View style={s.cardBottom}>
                <Text style={s.kitItemsCount}>{kit.items?.length ?? 0} componenti</Text>
                {avail.length > 0 && (
                  <View style={s.progressRow}>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${Math.round((avail.filter(a => a.is_available).length / avail.length) * 100)}%`, backgroundColor: statusColor }]} />
                    </View>
                    <Text style={[s.progressLabel, { color: statusColor }]}>
                      {avail.filter(a => a.is_available).length}/{avail.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🧰</Text>
            <Text style={s.emptyText}>Nessun kit disponibile</Text>
          </View>
        }
      />

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.sheetHeaderRow}>
              <Text style={s.sheetTitle}>{selectedKit?.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={s.closeX}>
                <Text style={s.closeXText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedKit?.description ? (
              <Text style={s.sheetDesc}>{selectedKit.description}</Text>
            ) : null}
            <Text style={s.sheetSectionLabel}>Componenti</Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {selected && getAvailability(selected).map((item, i) => (
                <View key={i} style={s.itemRow}>
                  <View style={[s.itemDot, { backgroundColor: item.is_available ? '#059669' : '#DC2626' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.product_name}</Text>
                    {item.product_sku && <Text style={s.itemSku}>{item.product_sku}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.itemNeed}>Serve: {item.quantity}</Text>
                    <Text style={[s.itemHave, { color: item.is_available ? '#059669' : '#DC2626' }]}>
                      Disp: {item.current_qty}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0FDF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF7' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#059669', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  kitIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  kitIconText: { fontSize: 22 },
  kitName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  kitSku: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  kitCat: { fontSize: 11, color: '#059669', fontWeight: '600', marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  kitDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitItemsCount: { fontSize: 12, color: '#9CA3AF' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressBg: { width: 60, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 },
  sheetDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  sheetSectionLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  closeX: { padding: 4 },
  closeXText: { fontSize: 20, color: '#9CA3AF' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10 },
  itemDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSku: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  itemNeed: { fontSize: 12, color: '#6B7280' },
  itemHave: { fontSize: 13, fontWeight: '700' },
})
