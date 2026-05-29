import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/authStore'
import { colors, spacing, font, radius, layout, duration, rs } from '../../tokens'

type ScanState = 'permitting' | 'scanning' | 'success' | 'error'

export default function ScanScreen() {
  const { hotelId, hotelName } = useLocalSearchParams<{ hotelId: string; hotelName: string }>()
  const user = useAuthStore((s) => s.user)
  const [permission, requestPermission] = useCameraPermissions()
  const [scanState, setScanState] = useState<ScanState>('permitting')
  const [scanError, setScanError] = useState('')
  const queryClient = useQueryClient()
  const scannedRef = useRef(false)
  const successScale = useRef(new Animated.Value(0.5)).current
  const successOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!permission) {
      requestPermission()
    } else if (permission.granted) {
      setScanState('scanning')
    } else if (!permission.canAskAgain) {
      setScanState('error')
      setScanError('Camera permission denied. Enable it in Settings.')
    }
  }, [permission])

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scannedRef.current || scanState !== 'scanning') return
    scannedRef.current = true

    try {
      const qrHotelId = data.trim()
      if (!qrHotelId) { throw new Error('Invalid QR code') }
      if (hotelId && qrHotelId !== hotelId) { throw new Error('QR code does not match the selected hotel') }

      const userId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id
      if (!userId) { throw new Error('Not authenticated') }

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('hotel_id', qrHotelId)
        .eq('is_active', true)
        .maybeSingle()

      if (existing) {
      setScanState('success')
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: duration.normal, useNativeDriver: true }),
      ]).start()
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setTimeout(() => router.replace('/(tabs)'), 1400)
      return
    }

    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      hotel_id: qrHotelId,
      meal_type: 'dinner',
      total_meals: 30,
      meals_used: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
    })
    if (subError) throw subError

    setScanState('success')
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(successOpacity, { toValue: 1, duration: duration.normal, useNativeDriver: true }),
    ]).start()
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    setTimeout(() => router.replace('/(tabs)'), 1400)
    } catch (err: any) {
      setScanState('error')
      setScanError(err.message || 'Failed to join hotel')
      scannedRef.current = false
    }
  }, [scanState, user?.id])

  if (scanState === 'permitting') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTx}>Requesting camera…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => router.replace('/onboarding/find')} style={styles.closeBtn}>
          <Text style={styles.closeTx}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{hotelName ?? 'Scan QR'}</Text>
        <View style={{ width: layout.touchTarget }} />
      </View>

      <View style={styles.scanBody}>
        {scanState === 'scanning' && (
          <>
            <Text style={styles.scanInstruction}>
              Point camera at the QR code at the hotel counter
            </Text>
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              <View style={styles.viewfinderOverlay}>
                <View style={styles.viewfinderBox}>
                  <View style={[styles.corner, { top: rs(12), left: rs(12), borderTopWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.corner, { top: rs(12), right: rs(12), borderTopWidth: 3, borderRightWidth: 3 }]} />
                  <View style={[styles.corner, { bottom: rs(12), left: rs(12), borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.corner, { bottom: rs(12), right: rs(12), borderBottomWidth: 3, borderRightWidth: 3 }]} />
                </View>
              </View>
            </View>
          </>
        )}

        {scanState === 'success' && (
          <Animated.View style={[styles.successBlock, { transform: [{ scale: successScale }], opacity: successOpacity }]}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Joined!</Text>
            <Text style={styles.successSub}>You are now linked to{'\n'}{hotelName}</Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          </Animated.View>
        )}

        {scanState === 'error' && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorTitle}>Scan failed</Text>
            <Text style={styles.errorMsg}>{scanError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setScanState('scanning'); scannedRef.current = false; setScanError('') }}>
              <Text style={styles.retryTx}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, height: layout.headerHeight,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  closeBtn: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  closeTx: { fontSize: font.size.lg, color: colors.textSecondary },
  modalTitle: { fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scanBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.screenPadding, gap: spacing.lg },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingTx: { fontSize: font.size.base, color: colors.textSecondary },
  scanInstruction: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
  cameraWrap: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', position: 'relative', maxWidth: 360 },
  camera: { width: '100%', height: '100%' },
  viewfinderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  viewfinderBox: { width: '75%', height: '75%', position: 'relative' },
  corner: { position: 'absolute', width: rs(24), height: rs(24), borderColor: colors.primary },
  errorBlock: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  errorIcon: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.danger, lineHeight: rs(48), textAlign: 'center', overflow: 'hidden' },
  errorTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  errorMsg: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  retryTx: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
  successBlock: { alignItems: 'center', gap: spacing.md },
  successCircle: { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  successIcon: { fontSize: rs(36), color: colors.primary },
  successTitle: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.textPrimary },
  successSub: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
