import React, { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface Props {
  dateLabel: string   // es. "giovedì 23 aprile"
  onClose: () => void
  onGoToTimbrature: () => void
}

export default function HRTimbratureModifiedModal({ dateLabel, onClose, onGoToTimbrature }: Props) {
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const checkScale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start()
    })
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
        {/* Header verde */}
        <LinearGradient
          colors={['#059669', '#10B981', '#34D399']}
          style={s.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.handle} />

          <Animated.View style={[s.iconCircle, { transform: [{ scale: checkScale }] }]}>
            <Text style={s.iconText}>✅</Text>
          </Animated.View>

          <Text style={s.headerTitle}>Timbratura aggiornata</Text>
          <Text style={s.headerSub}>Il responsabile ha salvato le modifiche</Text>
        </LinearGradient>

        {/* Body */}
        <View style={s.body}>
          {dateLabel ? (
            <View style={s.datePill}>
              <Text style={s.datePillIcon}>📅</Text>
              <Text style={s.datePillText}>{dateLabel}</Text>
            </View>
          ) : null}

          <Text style={s.hint}>
            La tua timbratura è stata modificata dal responsabile.{'\n'}
            Puoi controllare i dettagli nella sezione Timbrature.
          </Text>

          <View style={s.infoBox}>
            <Text style={s.infoIcon}>💾</Text>
            <Text style={s.infoText}>Le modifiche sono già disponibili nel tuo storico</Text>
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
              colors={['#059669', '#10B981']}
              style={s.primaryBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={s.primaryBtnText}>Vai alle Timbrature →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>Ok, ho capito</Text>
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
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: { fontSize: 36 },
  headerTitle: {
    fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4, textAlign: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 8,
    alignItems: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 16,
  },
  datePillIcon: { fontSize: 14 },
  datePillText: {
    fontSize: 14, fontWeight: '700', color: '#065F46', textTransform: 'capitalize',
  },
  hint: {
    fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'center', marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  infoIcon: { fontSize: 18 },
  infoText: {
    fontSize: 13, fontWeight: '600', color: '#065F46', flex: 1,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2,
  },
  secondaryBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
  },
  secondaryBtnText: {
    fontSize: 15, fontWeight: '700', color: '#374151',
  },
})
