import React, { useRef, useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View, Alert } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import RequestScreen from '../screens/RequestScreen'
import KitsScreen from '../screens/KitsScreen'
import TicketScreen from '../screens/TicketScreen'
import TimbratureScreen from '../screens/TimbratureScreen'
import LavorazioniScreen from '../screens/LavorazioniScreen'
import LavorazioneNotificationModal, { LavorazioneNotif } from '../components/LavorazioneNotificationModal'
import HRCodeNotificationModal, { HRCodeNotif } from '../components/HRCodeNotificationModal'

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  Request: { isOrdine?: boolean }
  Order: { isOrdine: boolean }
  Kits: undefined
  Ticket: undefined
  Timbrature: undefined
  Lavorazioni: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { session, loading } = useAuth()
  const navRef = useRef<any>(null)
  const [pendingLav, setPendingLav] = useState<LavorazioneNotif | null>(null)
  const [pendingHRCode, setPendingHRCode] = useState<HRCodeNotif | null>(null)

  // Subscribe to new lavorazioni assigned to the current user
  useEffect(() => {
    if (!session) return
    const userId = session.user.id
    const channel = supabase
      .channel(`lav-notif-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lavorazioni',
        filter: `assignee_id=eq.${userId}`,
      }, (payload) => {
        setPendingLav(payload.new as LavorazioneNotif)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to new HR modification codes generated for current user
  useEffect(() => {
    if (!session) return
    const userId = session.user.id
    const channel = supabase
      .channel(`hr-code-notif-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hr_modification_codes',
        filter: `profile_id=eq.${userId}`,
      }, async (payload) => {
        const row = payload.new as any

        // Timbratura salvata — notifica conferma
        if (row.status === 'completed') {
          let dateLabel = ''
          try {
            const { data } = await supabase
              .from('hr_work_records')
              .select('date')
              .eq('id', row.record_id)
              .single()
            if (data?.date) {
              dateLabel = new Date(data.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
            }
          } catch {}
          Alert.alert(
            '✅ Timbratura modificata',
            dateLabel
              ? `La timbratura del ${dateLabel} è stata aggiornata dal responsabile.`
              : 'La tua timbratura è stata aggiornata dal responsabile.',
            [{ text: 'OK', onPress: () => navRef.current?.navigate('Timbrature') }]
          )
          return
        }

        // Nuovo codice generato — mostra modale
        if (row.status !== 'code_sent' || !row.code) return
        let record_date: string | null = null
        try {
          const { data } = await supabase
            .from('hr_work_records')
            .select('date')
            .eq('id', row.record_id)
            .single()
          record_date = data?.date ?? null
        } catch {}
        setPendingHRCode({ id: row.id, code: row.code, record_date, created_at: row.created_at })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  )

  return (
    <>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Request" component={RequestScreen} initialParams={{ isOrdine: false }} />
              <Stack.Screen name="Order" component={RequestScreen} initialParams={{ isOrdine: true }} />
              <Stack.Screen name="Kits" component={KitsScreen} />
              <Stack.Screen name="Ticket" component={TicketScreen} />
              <Stack.Screen name="Timbrature" component={TimbratureScreen} />
              <Stack.Screen name="Lavorazioni" component={LavorazioniScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {pendingLav && (
        <LavorazioneNotificationModal
          lavorazione={pendingLav}
          onClose={() => setPendingLav(null)}
          onGoToLavorazioni={() => {
            setPendingLav(null)
            navRef.current?.navigate('Lavorazioni')
          }}
        />
      )}
      {pendingHRCode && (
        <HRCodeNotificationModal
          notif={pendingHRCode}
          onClose={() => setPendingHRCode(null)}
          onGoToTimbrature={() => {
            setPendingHRCode(null)
            navRef.current?.navigate('Timbrature')
          }}
        />
      )}
    </>
  )
}
