import React, { useRef, useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
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
    </>
  )
}
