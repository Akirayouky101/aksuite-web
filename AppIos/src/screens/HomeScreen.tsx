import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Dimensions, StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../hooks/useAuth'

const { width } = Dimensions.get('window')
const CARD_W = (width - 44) / 2

// ── Theme tokens ─────────────────────────────────────────────
const DARK = {
  bg:          '#0B0D17',
  cardBg:      '#14172A',
  cardBorder:  'rgba(255,255,255,0.05)',
  headerText:  '#FFFFFF',
  greetDim:    'rgba(255,255,255,0.38)',
  timeDim:     'rgba(255,255,255,0.42)',
  divider:     'rgba(255,255,255,0.05)',
  section:     'rgba(255,255,255,0.25)',
  cardLabel:   '#FFFFFF',
  cardSub:     'rgba(255,255,255,0.32)',
  footer:      'rgba(255,255,255,0.1)',
  avatarBg:    'rgba(255,255,255,0.07)',
  avatarBorder:'rgba(255,255,255,0.1)',
  pillBg:      'rgba(255,255,255,0.06)',
  pillBorder:  'rgba(255,255,255,0.09)',
  statusBar:   'light-content' as const,
  themeIcon:   '☀️',
}
const LIGHT = {
  bg:          '#F2F3FA',
  cardBg:      '#FFFFFF',
  cardBorder:  'rgba(0,0,0,0.07)',
  headerText:  '#1A1A2E',
  greetDim:    'rgba(0,0,0,0.38)',
  timeDim:     'rgba(0,0,0,0.4)',
  divider:     'rgba(0,0,0,0.07)',
  section:     'rgba(0,0,0,0.28)',
  cardLabel:   '#FFFFFF',
  cardSub:     'rgba(255,255,255,0.7)',
  footer:      'rgba(0,0,0,0.18)',
  avatarBg:    'rgba(0,0,0,0.06)',
  avatarBorder:'rgba(0,0,0,0.1)',
  pillBg:      'rgba(0,0,0,0.05)',
  pillBorder:  'rgba(0,0,0,0.08)',
  statusBar:   'dark-content' as const,
  themeIcon:   '🌙',
}

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

  const [dark, setDark] = useState(true)
  const T = dark ? DARK : LIGHT

  // Persist theme
  useEffect(() => {
    AsyncStorage.getItem('theme').then(v => { if (v !== null) setDark(v === 'dark') })
  }, [])
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    AsyncStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar} />
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          {/* Top bar: AK brand left, controls right */}
          <View style={s.topBar}>
            <LinearGradient colors={['#6D28D9','#8B5CF6']} style={s.brandPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.brandMark}>AK</Text>
            </LinearGradient>
            <Text style={[s.brandName, { color: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)' }]}>AKSUITE</Text>
            <View style={s.spacer} />
            {/* Theme toggle */}
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: T.avatarBg, borderColor: T.avatarBorder }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={s.iconBtnText}>{T.themeIcon}</Text>
            </TouchableOpacity>
            {/* Avatar / logout */}
            <TouchableOpacity
              style={[s.avatarBtn, { backgroundColor: T.avatarBg, borderColor: T.avatarBorder }]}
              onPress={() => Alert.alert('Esci', 'Vuoi disconnetterti?', [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Esci', style: 'destructive', onPress: signOut },
              ])}
              activeOpacity={0.75}
            >
              <Text style={[s.avatarText, { color: T.headerText }]}>{firstName[0].toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Centered greeting + clock + date */}
          <View style={s.headerCenter}>
            <Text style={[s.greetSmall, { color: T.greetDim }]}>{greeting} 👋</Text>
            <Text style={[s.greetName, { color: T.headerText }]}>{firstName}</Text>
            <Text style={[s.timeBig, { color: T.headerText }]}>{time}</Text>
            <View style={[s.datePill, { backgroundColor: T.pillBg, borderColor: T.pillBorder }]}>
              <Text style={[s.datePillText, { color: T.timeDim }]}>
                {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
              </Text>
            </View>
          </View>

          <View style={[s.headerDivider, { backgroundColor: T.divider }]} />
        </View>

        {/* ── Section label ── */}
        <View style={s.sectionRow}>
          <View style={[s.sectionLine, { backgroundColor: T.divider }]} />
          <Text style={[s.sectionLabel, { color: T.section }]}>Accesso rapido</Text>
          <View style={[s.sectionLine, { backgroundColor: T.divider }]} />
        </View>

        {/* ── Grid ── */}
        <View style={s.grid}>
          {MENU.map(card => (
            <TouchableOpacity
              key={card.screen}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.82}
              style={[s.cardWrap, {
                backgroundColor: T.cardBg,
                borderColor: T.cardBorder,
                shadowColor: card.glow,
              }]}
            >
              <LinearGradient
                colors={card.grad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.cardStrip}
              >
                <Text style={s.cardIcon}>{card.icon}</Text>
              </LinearGradient>
              <View style={s.cardBody}>
                <Text style={[s.cardLabel, { color: T.cardLabel }]} adjustsFontSizeToFit numberOfLines={1}>
                  {card.label}
                </Text>
                <Text style={[s.cardSub, { color: dark ? T.cardSub : '#555' }]} numberOfLines={1}>{card.sub}</Text>
                <View style={[s.arrowChip, { backgroundColor: card.glow + '28' }]}>
                  <Text style={[s.arrowText, { color: card.grad[1] }]}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.footer, { color: T.footer }]}>AKSUITE MAGAZZINO</Text>
      </ScrollView>
    </View>
  )
}

const STRIP_H = CARD_W * 0.54

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 50 },

  // ── Header ──
  header: { paddingTop: 60, paddingHorizontal: 22, paddingBottom: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 },
  brandPill: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandMark: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  brandName: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5 },
  spacer: { flex: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  iconBtnText: { fontSize: 16 },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },

  headerCenter: { alignItems: 'center', gap: 4 },
  greetSmall: { fontSize: 15, fontWeight: '500' },
  greetName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  timeBig: { fontSize: 72, fontWeight: '800', letterSpacing: -3, lineHeight: 76, marginTop: 4 },
  datePill: {
    marginTop: 10, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1,
  },
  datePillText: { fontSize: 12, fontWeight: '600' },
  headerDivider: { marginTop: 28, height: 1 },

  // ── Section ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, marginTop: 22, marginBottom: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1 },

  // ── Grid ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  cardWrap: {
    width: CARD_W, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, shadowOpacity: 0.38, shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  cardStrip: { width: '100%', height: STRIP_H, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 46 },
  cardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  cardLabel: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2, marginBottom: 3 },
  cardSub: { fontSize: 11, fontWeight: '500' },
  arrowChip: {
    marginTop: 10, alignSelf: 'flex-end',
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: 18, fontWeight: '900', lineHeight: 22 },

  footer: { textAlign: 'center', fontSize: 10, marginTop: 26, fontWeight: '700', letterSpacing: 2.5 },
})

