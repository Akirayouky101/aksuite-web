import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useAuth } from '../hooks/useAuth'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Attenzione', 'Inserisci email e password'); return }
    setLoading(true)
    const error = await signIn(email.trim(), password)
    setLoading(false)
    if (error) Alert.alert('Errore', error.message)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>AK</Text>
        </View>
        <Text style={styles.title}>AKSuite</Text>
        <Text style={styles.subtitle}>Magazzino</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Accedi</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  card: { width: '88%', backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  input: { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827', marginBottom: 12 },
  btn: { width: '100%', backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
