import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { colors, spacing, font, radius, layout, duration, rs } from '../../tokens'

type ScanState = 'idle' | 'scanning' | 'success' | 'error'

export default function ScanScreen() {
  const { hotelId, hotelName } = useLocalSearchParams<{ hotelId: string; hotelName: string }>()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const scanLineAnim = useRef(new Animated.Value(0)).current
  const successScale = useRef(new Animated.Value(0.5)).current
  const successOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const simulateScan = () => {
    setScanState('success')
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(successOpacity, { toValue: 1, duration: duration.normal, useNativeDriver: true }),
    ]).start()
    setTimeout(() => router.replace('/(tabs)'), 1400)
  }

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [rs(-80), rs(80)] })

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeTx}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{hotelName ?? 'Scan QR'}</Text>
        <View style={{ width: layout.touchTarget }} />
      </View>

      <View style={styles.scanBody}>
        {scanState !== 'success' ? (
          <>
            <Text style={styles.scanInstruction}>
              Point camera at the QR code at the hotel counter
            </Text>
            <View style={styles.viewfinderWrap}>
              <View style={styles.viewfinderBox}>
                <View style={[styles.corner, { top: rs(12), left: rs(12), borderTopWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[styles.corner, { top: rs(12), right: rs(12), borderTopWidth: 3, borderRightWidth: 3 }]} />
                <View style={[styles.corner, { bottom: rs(12), left: rs(12), borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[styles.corner, { bottom: rs(12), right: rs(12), borderBottomWidth: 3, borderRightWidth: 3 }]} />
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraEmoji}>📷</Text>
                  <Text style={styles.cameraHint}>Camera preview</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.simulateBtn} onPress={simulateScan}>
              <Text style={styles.simulateTx}>Simulate scan (dev)</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Animated.View style={[styles.successBlock, { transform: [{ scale: successScale }], opacity: successOpacity }]}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Joined!</Text>
            <Text style={styles.successSub}>You are now linked to{'\n'}{hotelName}</Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          </Animated.View>
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
  scanInstruction: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
  viewfinderWrap: { alignItems: 'center', justifyContent: 'center' },
  viewfinderBox: { width: rs(220), height: rs(220), backgroundColor: '#111', borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: rs(24), height: rs(24), borderColor: colors.primary },
  scanLine: { position: 'absolute', width: rs(180), height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  cameraPlaceholder: { alignItems: 'center', gap: spacing.xs },
  cameraEmoji: { fontSize: rs(40), opacity: 0.25 },
  cameraHint: { fontSize: font.size.xs, color: 'rgba(255,255,255,0.3)' },
  simulateBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  simulateTx: { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.medium },
  successBlock: { alignItems: 'center', gap: spacing.md },
  successCircle: { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  successIcon: { fontSize: rs(36), color: colors.primary },
  successTitle: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.textPrimary },
  successSub: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
