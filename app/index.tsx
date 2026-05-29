import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { colors, spacing, font, radius, layout, shadow, rs } from '../tokens'

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

async function handleSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  if (profile) {
    if (!profile.name) {
      router.replace('/onboarding/role')
    } else {
      router.replace('/(tabs)')
    }
  } else {
    router.replace('/onboarding/role')
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const sendOtp = async () => {
    const cleanEmail = email.trim()
    if (!validateEmail(cleanEmail)) { Alert.alert('Invalid email', 'Enter a valid email address'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail })
      if (error) throw error
      setStep('otp')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.length < 4) { Alert.alert('Incomplete', 'Enter the full OTP'); return }
    const cleanEmail = email.trim()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp,
        type: 'email',
      })
      if (error) throw error
      await handleSession()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topSection}>
          <Text style={styles.logo}>thali</Text>
          <Text style={styles.tagline}>Meal attendance, simplified.</Text>
        </View>

        <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
          {step === 'email' ? (
            <>
              <Text style={styles.inputLabel}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.primaryBtn, !validateEmail(email) && styles.btnDisabled]}
                onPress={sendOtp}
                disabled={loading || !validateEmail(email)}
              >
                <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Enter OTP sent to {email}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="00000000"
                placeholderTextColor={colors.textHint}
                keyboardType="number-pad"
                maxLength={8}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={verifyOtp}
                disabled={loading || otp.length < 4}
              >
                <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Login'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('email'); setOtp('') }}>
                <Text style={styles.backLink}>Change email</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  logo: {
    fontSize: font.size.hero, fontWeight: font.weight.bold,
    color: colors.primary, letterSpacing: -1,
  },
  tagline: {
    fontSize: font.size.md, color: colors.textSecondary, marginTop: spacing.sm,
  },
  formSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: font.size.sm, color: colors.textSecondary,
    fontWeight: font.weight.medium,
  },
  input: {
    height: layout.touchTarget,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, fontSize: font.size.lg,
    backgroundColor: colors.surface, color: colors.textPrimary,
  },
  otpInput: {
    height: layout.touchTarget,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, fontSize: font.size.xl,
    textAlign: 'center', letterSpacing: 8,
    backgroundColor: colors.surface, color: colors.textPrimary,
  },
  primaryBtn: {
    height: layout.touchTarget,
    borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
  backLink: {
    fontSize: font.size.sm, color: colors.primary,
    textAlign: 'center', fontWeight: font.weight.medium,
  },
})
