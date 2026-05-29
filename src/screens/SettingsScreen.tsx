import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

export default function SettingsScreen() {
  const { signOut } = useAuthStore()
  const userId = useAuthStore((s) => s.user?.id)
  const [ownerHotel, setOwnerHotel] = useState<any>(null)
  const [loadingHotel, setLoadingHotel] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('hotels').select('*').eq('owner_id', userId).limit(1).single()
      .then(({ data, error }) => {
        if (!error && data) setOwnerHotel(data)
        setLoadingHotel(false)
      })
  }, [userId])

  const handleRegenerateQR = async () => {
    if (!ownerHotel?.id) return
    Alert.alert('Regenerate QR', 'This will invalidate the existing QR code. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Regenerate', style: 'destructive', onPress: async () => {
        setRegenerating(true)
        try {
          const { error } = await supabase
            .from('hotels')
            .update({ qr_code: ownerHotel.id })
            .eq('id', ownerHotel.id)
          if (error) throw error
          setOwnerHotel((prev: any) => ({ ...prev, qr_code: prev.id }))
          Alert.alert('Done', 'QR code has been regenerated. Print the new QR from the hotel screen.')
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to regenerate QR')
        } finally {
          setRegenerating(false)
        }
      }},
    ])
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          await signOut()
        } catch {}
        router.replace('/')
      }},
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Meal schedule</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Lunch time</Text>
            <Text style={styles.settingValue}>12:00 PM</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dinner time</Text>
            <Text style={styles.settingValue}>7:30 PM</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Cutoff window</Text>
            <Text style={styles.settingValue}>45 min before</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Hotel</Text>
        <View style={styles.card}>
          {loadingHotel ? (
            <View style={styles.settingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : ownerHotel ? (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Hotel name</Text>
                <Text style={styles.settingValue}>{ownerHotel.name}</Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={() => { if (ownerHotel?.id) { setQrError(false); setShowQR(true) } else { Alert.alert('No hotel', 'No hotel registered yet.') } }}>
                <Text style={styles.settingLabel}>Print QR</Text>
                <Text style={[styles.settingValue, { color: colors.primary }]}>View QR</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={handleRegenerateQR} disabled={regenerating}>
                <Text style={styles.settingLabel}>Regenerate QR</Text>
                <Text style={[styles.settingValue, { color: colors.primary }]}>
                  {regenerating ? '...' : 'Regenerate'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>No hotel registered</Text>
            </View>
          )}
        </View>

        <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.qrModal}>
              <Text style={styles.qrTitle}>{ownerHotel?.name}</Text>
              <View style={styles.qrWrap}>
                {qrError ? (
                  <View style={styles.qrFallback}>
                    <Text style={styles.qrFallbackLabel}>Hotel ID</Text>
                    <Text style={styles.qrFallbackId}>{ownerHotel?.id}</Text>
                    <Text style={styles.qrFallbackHint}>Enter this ID manually in the app</Text>
                  </View>
                ) : (
                  <QRCode value={ownerHotel?.id ?? ''} size={200} backgroundColor="white" onError={() => setQrError(true)} />
                )}
              </View>
              <Text style={styles.qrSub}>Ask subscribers to scan this QR code to join</Text>
              <TouchableOpacity style={styles.qrCloseBtn} onPress={() => { setShowQR(false); setQrError(false) }}>
                <Text style={styles.qrCloseTx}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>English</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <Text style={[styles.settingLabel, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: layout.screenPadding, height: layout.headerHeight,
    justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  screenTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  scrollContent: { padding: layout.screenPadding },
  sectionTitle: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.textHint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: spacing.xs, marginTop: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm, marginBottom: spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, minHeight: layout.touchTarget },
  settingLabel: { fontSize: font.size.base, color: colors.textPrimary },
  settingValue: { fontSize: font.size.base, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  qrModal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', width: '100%', maxWidth: 320, gap: spacing.md },
  qrTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  qrWrap: { padding: spacing.md, backgroundColor: 'white', borderRadius: radius.md, width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  qrFallback: { alignItems: 'center', gap: spacing.sm },
  qrFallbackLabel: { fontSize: font.size.sm, color: colors.textHint, fontWeight: font.weight.medium },
  qrFallbackId: { fontSize: font.size.sm, color: colors.textPrimary, fontFamily: 'monospace', textAlign: 'center' },
  qrFallbackHint: { fontSize: font.size.xs, color: colors.textHint, textAlign: 'center' },
  qrSub: { fontSize: font.size.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  qrCloseBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', width: '100%' },
  qrCloseTx: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
})
