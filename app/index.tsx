import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { colors, spacing, font, radius, layout, shadow, rs } from '../tokens'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const validatePhone = (p: string) => /^[6-9]\d{9}$/.test(p)

  const sendOtp = async () => {
    if (!validatePhone(phone)) { Alert.alert('Invalid number', 'Enter a valid 10-digit Indian mobile number'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
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
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      })
      if (error) throw error
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()
        if (profile) {
          router.replace('/(tabs)')
        } else {
          router.replace('/onboarding/role')
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid OTP')
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
          {step === 'phone' ? (
            <>
              <Text style={styles.inputLabel}>Phone number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.ccText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textHint}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, !validatePhone(phone) && styles.btnDisabled]}
                onPress={sendOtp}
                disabled={loading || !validatePhone(phone)}
              >
                <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Enter OTP sent to +91 {phone}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="0000"
                placeholderTextColor={colors.textHint}
                keyboardType="number-pad"
                maxLength={6}
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
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp('') }}>
                <Text style={styles.backLink}>Change number</Text>
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
  phoneRow: {
    flexDirection: 'row', gap: spacing.xs,
  },
  countryCode: {
    height: layout.touchTarget, minWidth: rs(60),
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  ccText: { fontSize: font.size.lg, color: colors.textPrimary, fontWeight: font.weight.medium },
  phoneInput: {
    flex: 1, height: layout.touchTarget,
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
