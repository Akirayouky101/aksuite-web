import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'

const { width } = Dimensions.get('window')
const CARD_W = (width - 52) / 2

interface MenuCard {
  icon: string
  label: string
  sublabel: string
  colors: [string, string, string]
  screen: string
  accent: string
}

const MENU: MenuCard[] = [
  { icon: '📦', label: 'Prelievo',    sublabel: 'Ritira materiale',   colors: ['#6D28D9','#7C3AED','#8B5CF6'], accent: '#C4B5FD', screen: 'Request' },
  { icon: '🛒', label: 'Ordine',      sublabel: 'Richiedi materiale', colors: ['#0369A1','#0891B2','#06B6D4'], accent: '#A5F3FC', screen: 'Order' },
  { icon: '🧰', label: 'KIT',         sublabel: 'Visualizza kit',     colors: ['#065F46','#059669','#10B981'], accent: '#A7F3D0', screen: 'Kits' },
  { icon: '🎫', label: 'Ticket',      sublabel: 'Comunicazioni',      colors: ['#991B1B','#DC2626','#EF4444'], accent: '#FCA5A5', screen: 'Ticket' },
  { icon: '⏱',  label: 'Timbrature', sublabel: 'Entrata / Uscita',   colors: ['#B45309','#D97706','#F59E0B'], accent: '#FDE68A', screen: 'Timbrature' },
  { icon: '🔧', label: 'Lavorazioni', sublabel: 'Le mie attività',    colors: ['#0F766E','#0D9488','#14B8A6'], accent: '#99F6E4', screen: 'Lavorazioni' },
]

function useClock() {
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toTimeString().slice(0, 5)), 10_000)
    return () => clearInterval(t)
  }, [])
  return time
}

export default function HomeScreen({ navigation }: any) {
  const { profile, signOut } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'Utente'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const time = useClock()
  const dateStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient colors={['#3B0FAB', '#5B21B6', '#7C3AED']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative blobs */}
          <View style={s.blob1} />
          <View style={s.blob2} />

          {/* Top row */}
          <View style={s.headerRow}>
            <View>
              <Text style={s.greetLabel}>{greeting} 👋</Text>
              <Text style={s.greetName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={s.avatar}
              onPress={() => Alert.alert('Esci', 'Vuoi disconnetterti?', [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Esci', style: 'destructive', onPress: signOut },
              ])}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['rgba(255,255,255,0.35)','rgba(255,255,255,0.15)']} style={s.avatarGrad}>
                <Text style={s.avatarLetter}>{firstName[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Time + date */}
          <View style={s.timeRow}>
            <Text style={s.timeBig}>{time}</Text>
            <View style={s.dateBadge}>
              <Text style={s.dateBadgeText}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Section label ── */}
        <Text style={s.sectionLabel}>Cosa vuoi fare?</Text>

        {/* ── Grid ── */}
        <View style={s.grid}>
          {MENU.map(card => (
            <TouchableOpacity
              key={card.screen}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.88}
              style={s.cardOuter}
            >
              <LinearGradient
                colors={card.colors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.card}
              >
                {/* Subtle top shine */}
                <View style={s.cardShine} />

                {/* Icon bubble */}
                <View style={[s.iconBubble, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <Text style={s.iconText}>{card.icon}</Text>
                </View>

                <Text style={s.cardLabel} adjustsFontSizeToFit numberOfLines={1}>{card.label}</Text>
                <Text style={s.cardSub} numberOfLines={2}>{card.sublabel}</Text>

                {/* Arrow chip */}
                <View style={[s.arrowChip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={s.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.footer}>AKSUITE MAGAZZINO</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F0F6' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Header ──
  header: {
    paddingTop: 64,
    paddingBottom: 38,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blob2: {
    position: 'absolute', bottom: -20, left: 20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  greetLabel: { fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  greetName: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 1 },
  avatar: { borderRadius: 26, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  avatarGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  avatarLetter: { fontSize: 22, fontWeight: '900', color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  timeBig: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 52 },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  dateBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ── Section label ──
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: '#9B9BAD',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 28, marginBottom: 14, marginLeft: 22,
  },

  // ── Grid ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 14 },
  cardOuter: {
    width: CARD_W,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  card: {
    width: CARD_W,
    height: CARD_W * 1.18,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardShine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '45%', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconBubble: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 28 },
  cardLabel: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', lineHeight: 15 },
  arrowChip: {
    alignSelf: 'flex-end',
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  footer: {
    textAlign: 'center', color: '#BCBCCC', fontSize: 10,
    marginTop: 28, fontWeight: '700', letterSpacing: 2.5,
  },
})

