import React, { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export interface HRCodeNotif {
  id: string
  code: string
  record_date: string | null  // filled by AppNavigator after lookup
  created_at: string
}

interface Props {
  notif: HRCodeNotif
  onClose: () => void
  onGoToTimbrature: () => void
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function HRCodeNotificationModal({ notif, onClose, onGoToTimbrature }: Props) {
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 500, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
        {/* Header */}
        <LinearGradient
          colors={['#D97706', '#F59E0B', '#FCD34D']}
          style={s.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Handle */}
          <View style={s.handle} />

          {/* Icon */}
          <View style={s.iconCircle}>
            <Text style={s.iconText}>⏱</Text>
          </View>

          <Text style={s.headerTitle}>Codice di Modifica</Text>
          <Text style={s.headerSub}>Timbratura</Text>
        </LinearGradient>

        {/* Body */}
        <View style={s.body}>
          <Text style={s.bodyTitle}>È stato generato un codice per te</Text>
          {notif.record_date && (
            <View style={s.datePill}>
              <Text style={s.datePillIcon}>📅</Text>
              <Text style={s.datePillText}>{fmtDate(notif.record_date)}</Text>
            </View>
          )}

          <Text style={s.hint}>
            Il responsabile ha generato un codice di modifica per la tua timbratura.
            Vai nella sezione Timbrature per visualizzarlo e comunicarlo al responsabile.
          </Text>

          {/* Big code preview (blurred hint) */}
          <View style={s.codePreviewBox}>
            <Text style={s.codePreviewLabel}>Codice disponibile</Text>
            <View style={s.codeRow}>
              {notif.code.split('').map((ch, i) => (
                <View key={i} style={s.codeLetter}>
                  <Text style={s.codeLetterText}>{ch}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => { handleClose(); setTimeout(onGoToTimbrature, 300) }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D97706', '#F59E0B']}
              style={s.primaryBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={s.primaryBtnText}>Vai alle Timbrature →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>Dopo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: { fontSize: 32 },
  headerTitle: {
    fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  bodyTitle: {
    fontSize: 17, fontWeight: '800', color: '#1F2937', marginBottom: 12, textAlign: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'center',
    marginBottom: 14,
  },
  datePillIcon: { fontSize: 14 },
  datePillText: {
    fontSize: 13, fontWeight: '700', color: '#92400E',
  },
  hint: {
    fontSize: 13, color: '#6B7280', lineHeight: 20, textAlign: 'center', marginBottom: 16,
  },
  codePreviewBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  codePreviewLabel: {
    fontSize: 10, fontWeight: '800', color: '#92400E',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  codeLetter: {
    width: 36, height: 40,
    backgroundColor: '#D97706',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLetterText: {
    fontSize: 20, fontWeight: '900', color: '#fff',
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGrad: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16, fontWeight: '800', color: '#fff',
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15, fontWeight: '700', color: '#6B7280',
  },
})
