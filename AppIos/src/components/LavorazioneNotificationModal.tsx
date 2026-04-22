import React, { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export interface LavorazioneNotif {
  id: string
  title: string
  status: string
  priority: string | null
  client_name: string | null
  description: string | null
  created_at: string
  due_date: string | null
  assignee_id: string | null
}

interface Props {
  lavorazione: LavorazioneNotif
  onClose: () => void
  onGoToLavorazioni: () => void
}

const PRIORITY: Record<string, { bg: string; text: string; label: string }> = {
  alta:   { bg: '#FEF2F2', text: '#DC2626', label: '🔴 Alta' },
  media:  { bg: '#FFFBEB', text: '#D97706', label: '🟡 Media' },
  bassa:  { bg: '#F0FDF4', text: '#16A34A', label: '🟢 Bassa' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function LavorazioneNotificationModal({ lavorazione, onClose, onGoToLavorazioni }: Props) {
  const translateY = useRef(new Animated.Value(400)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 400, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  const prio = PRIORITY[lavorazione.priority || 'media'] ?? PRIORITY.media

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
        <LinearGradient colors={['#0F766E', '#0D9488']} style={s.header}>
          <View style={s.headerPill}>
            <Text style={s.headerPillText}>🔧 Nuova Lavorazione Assegnata</Text>
          </View>
          <Text style={s.title} numberOfLines={2}>{lavorazione.title}</Text>
          {lavorazione.client_name ? (
            <Text style={s.client}>👤 {lavorazione.client_name}</Text>
          ) : null}
        </LinearGradient>

        <View style={s.body}>
          <View style={s.pills}>
            <View style={[s.pill, { backgroundColor: prio.bg }]}>
              <Text style={[s.pillText, { color: prio.text }]}>Priorità {prio.label}</Text>
            </View>
            <View style={[s.pill, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[s.pillText, { color: '#2563EB' }]}>{fmtDate(lavorazione.created_at)}</Text>
            </View>
          </View>

          {lavorazione.description ? (
            <Text style={s.desc} numberOfLines={3}>{lavorazione.description}</Text>
          ) : null}

          {lavorazione.due_date ? (
            <Text style={s.due}>⏰ Scadenza: {fmtDate(lavorazione.due_date)}</Text>
          ) : null}
        </View>

        <View style={s.footer}>
          <TouchableOpacity style={s.btnPrimary} onPress={onGoToLavorazioni} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>Vedi Lavorazioni →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={handleClose} activeOpacity={0.85}>
            <Text style={s.btnSecondaryText}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    padding: 22,
    paddingTop: 26,
  },
  headerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  headerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  client: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 7,
  },
  body: {
    padding: 20,
    paddingBottom: 10,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  desc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 10,
  },
  due: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 6,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#0F766E',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
})
