import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Dimensions, StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'

const { width } = Dimensions.get('window')
const CARD_W = (width - 44) / 2   // 16px padding each side + 12px gap

const MENU = [
  { icon: '📦', label: 'Prelievo',    sub: 'Ritira materiale',   grad: ['#5B21B6','#8B5CF6'] as [string,string], glow: '#6D28D9', screen: 'Request' },
  { icon: '🛒', label: 'Ordine',      sub: 'Richiedi materiale', grad: ['#0369A1','#38BDF8'] as [string,string], glow: '#0284C7', screen: 'Order' },
  { icon: '🧰', label: 'KIT',         sub: 'Visualizza kit',     grad: ['#065F46','#34D399'] as [string,string], glow: '#059669', screen: 'Kits' },
  { icon: '🎫', label: 'Ticket',      sub: 'Comunicazioni',      grad: ['#9B1C1C','#F87171'] as [string,string], glow: '#DC2626', screen: 'Ticket' },
  { icon: '⏱',  label: 'Timbrature', sub: 'Entrata / Uscita',   grad: ['#92400E','#FCD34D'] as [string,string], glow: '#D97706', screen: 'Timbrature' },
  { icon: '🔧', label: 'Lavorazioni', sub: 'Le mie attività',    grad: ['#134E4A','#5EEAD4'] as [string,string], glow: '#0D9488', screen: 'Lavorazioni' },
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
        <View style={s.header}>
          {/* Brand row */}
          <View style={s.brandRow}>
            <LinearGradient colors={['#6D28D9','#8B5CF6']} style={s.brandPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.brandMark}>AK</Text>
            </LinearGradient>
            <Text style={s.brandName}>AKSUITE</Text>
            <View style={s.spacer} />
            <TouchableOpacity
              style={s.avatarBtn}
              onPress={() => Alert.alert('Esci', 'Vuoi disconnetterti?', [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Esci', style: 'destructive', onPress: signOut },
              ])}
              activeOpacity={0.75}
            >
              <Text style={s.avatarText}>{firstName[0].toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Greeting + name */}
          <Text style={s.greetSmall}>{greeting},</Text>
          <Text style={s.greetName}>{firstName} 👋</Text>

          {/* Big clock */}
          <Text style={s.timeBig}>{time}</Text>

          {/* Date pill */}
          <View style={s.datePill}>
            <Text style={s.datePillText}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
          </View>

          {/* Divider */}
          <View style={s.headerDivider} />
        </View>

        {/* ── Section label ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Accesso rapido</Text>
          <View style={s.sectionLine} />
        </View>

        {/* ── Grid ── */}
        <View style={s.grid}>
          {MENU.map(card => (
            <TouchableOpacity
              key={card.screen}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.82}
              style={[s.cardWrap, { shadowColor: card.glow }]}
            >
              {/* Colored strip with icon */}
              <LinearGradient
                colors={card.grad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.cardStrip}
              >
                <Text style={s.cardIcon}>{card.icon}</Text>
              </LinearGradient>

              {/* Text body */}
              <View style={s.cardBody}>
                <Text style={s.cardLabel} adjustsFontSizeToFit numberOfLines={1}>
                  {card.label}
                </Text>
                <Text style={s.cardSub} numberOfLines={1}>{card.sub}</Text>
                <View style={[s.arrowChip, { backgroundColor: card.glow + '28' }]}>
                  <Text style={[s.arrowText, { color: card.grad[1] }]}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.footer}>AKSUITE MAGAZZINO</Text>
      </ScrollView>
    </View>
  )
}

const STRIP_H = CARD_W * 0.54

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0D17' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 50 },

  // ── Header ──
  header: {
    paddingTop: 66,
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  brandPill: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  brandMark: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  brandName: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.28)', letterSpacing: 2.5 },
  spacer: { flex: 1 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  greetSmall: { fontSize: 15, color: 'rgba(255,255,255,0.38)', fontWeight: '500', marginBottom: 3 },
  greetName: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 16 },
  timeBig: { fontSize: 68, fontWeight: '800', color: '#FFFFFF', letterSpacing: -3, lineHeight: 72 },
  datePill: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  datePillText: { color: 'rgba(255,255,255,0.42)', fontSize: 12, fontWeight: '600' },
  headerDivider: {
    marginTop: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // ── Section ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, marginTop: 22, marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  // ── Grid ──
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12,
  },
  cardWrap: {
    width: CARD_W,
    borderRadius: 20,
    backgroundColor: '#14172A',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0.38,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardStrip: {
    width: '100%',
    height: STRIP_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 46 },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardLabel: {
    fontSize: 16, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -0.2, marginBottom: 3,
  },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: '500' },
  arrowChip: {
    marginTop: 10, alignSelf: 'flex-end',
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: 18, fontWeight: '900', lineHeight: 22 },

  footer: {
    textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: 10,
    marginTop: 26, fontWeight: '700', letterSpacing: 2.5,
  },
})

