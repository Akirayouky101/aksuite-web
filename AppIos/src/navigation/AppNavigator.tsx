import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import RequestScreen from '../screens/RequestScreen'
import KitsScreen from '../screens/KitsScreen'
import TicketScreen from '../screens/TicketScreen'

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  Request: { isOrdine?: boolean }
  Order: { isOrdine: boolean }
  Kits: undefined
  Ticket: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { session, loading } = useAuth()

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  )

  return (
    <NavigationContainer>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
