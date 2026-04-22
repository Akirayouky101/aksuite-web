import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'

const { width } = Dimensions.get('window')
const CARD_SIZE = (width - 48 - 16) / 2

interface MenuCard {
  icon: string
  label: string
  sublabel: string
  gradient: [string, string]
  screen: string
}

const MENU: MenuCard[] = [
  { icon: '📦', label: 'Prelievo', sublabel: 'Ritira materiale', gradient: ['#7C3AED', '#9F67F8'], screen: 'Request' },
  { icon: '🛒', label: 'Ordine', sublabel: 'Richiedi materiale', gradient: ['#0891B2', '#22D3EE'], screen: 'Order' },
  { icon: '🧰', label: 'KIT', sublabel: 'Visualizza kit', gradient: ['#059669', '#34D399'], screen: 'Kits' },
  { icon: '🎫', label: 'Ticket', sublabel: 'Nuova comunicazione', gradient: ['#DC2626', '#F87171'], screen: 'Ticket' },
  { icon: '🕐', label: 'Timbrature', sublabel: 'Entrata / Uscita', gradient: ['#D97706', '#F59E0B'], screen: 'Timbrature' },
  { icon: '🔧', label: 'Lavorazioni', sublabel: 'Le mie attività', gradient: ['#0F766E', '#14B8A6'], screen: 'Lavorazioni' },
]

export default function HomeScreen({ navigation }: any) {
  const { profile, signOut } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'Utente'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header gradient */}
      <LinearGradient
        colors={['#4F1FBF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingSmall}>{greeting},</Text>
            <Text style={styles.greetingName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() =>
              Alert.alert('Esci', 'Vuoi disconnetterti?', [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Esci', style: 'destructive', onPress: signOut },
              ])
            }
          >
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Cosa vuoi fare oggi?</Text>
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </LinearGradient>

      {/* Cards grid */}
      <View style={styles.grid}>
        {MENU.map(card => (
          <TouchableOpacity
            key={card.screen}
            style={styles.cardWrapper}
            onPress={() => navigation.navigate(card.screen)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={card.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardSub}>{card.sublabel}</Text>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>AKSuite Magazzino</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F8' },
  header: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingSmall: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  greetingName: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 16,
  },
  datePillText: { color: '#fff', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 16, marginTop: 8 },
  cardWrapper: {
    width: CARD_SIZE,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardIcon: { fontSize: 36 },
  cardLabel: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 8 },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardArrowText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: {
    textAlign: 'center', color: '#C4C4D0', fontSize: 11,
    marginBottom: 40, marginTop: 4, fontWeight: '600',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
})
