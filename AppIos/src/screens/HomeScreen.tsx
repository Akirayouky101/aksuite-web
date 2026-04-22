import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useAuth } from '../hooks/useAuth'

interface MenuCard {
  icon: string
  label: string
  sublabel: string
  color: string
  bg: string
  screen: string
  permission?: keyof import('../hooks/useAuth').UserPermissions
}

const MENU: MenuCard[] = [
  { icon: '📦', label: 'Prelievo', sublabel: 'Ritira materiale', color: '#7C3AED', bg: '#EDE9FE', screen: 'Request', permission: 'can_prelievo' },
  { icon: '🛒', label: 'Ordine', sublabel: 'Richiedi materiale', color: '#0891B2', bg: '#E0F2FE', screen: 'Order', permission: 'can_warehouse' },
  { icon: '🧰', label: 'KIT', sublabel: 'Visualizza kit', color: '#059669', bg: '#D1FAE5', screen: 'Kits', permission: 'can_warehouse' },
  { icon: '🎫', label: 'Ticket', sublabel: 'Nuova comunicazione', color: '#DC2626', bg: '#FEE2E2', screen: 'Ticket', permission: 'can_tickets' },
]

export default function HomeScreen({ navigation }: any) {
  const { profile, permissions, signOut } = useAuth()

  const canAccess = (p?: keyof import('../hooks/useAuth').UserPermissions) => {
    if (!p || !permissions) return true
    return permissions.is_admin || permissions[p]
  }

  const handleNav = (card: MenuCard) => {
    if (!canAccess(card.permission)) {
      Alert.alert('Accesso negato', 'Non hai i permessi per questa sezione')
      return
    }
    navigation.navigate(card.screen)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ciao, {profile?.full_name?.split(' ')[0] || 'Utente'} 👋</Text>
          <Text style={styles.subtitle}>Cosa vuoi fare oggi?</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Esci', 'Vuoi disconnetterti?', [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Esci', style: 'destructive', onPress: signOut },
        ])}>
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {MENU.map(card => {
          const enabled = canAccess(card.permission)
          return (
            <TouchableOpacity
              key={card.screen}
              style={[styles.card, { opacity: enabled ? 1 : 0.4 }]}
              onPress={() => handleNav(card)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: card.bg }]}>
                <Text style={styles.iconText}>{card.icon}</Text>
              </View>
              <Text style={[styles.cardLabel, { color: card.color }]}>{card.label}</Text>
              <Text style={styles.cardSub}>{card.sublabel}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  logoutText: { fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  iconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconText: { fontSize: 26 },
  cardLabel: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#9CA3AF' },
})
