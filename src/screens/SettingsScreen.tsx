import { Alert } from 'react-native'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '../stores/authStore'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

export default function SettingsScreen() {
  const { signOut } = useAuthStore()

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await signOut()
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
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Hotel name</Text>
            <Text style={styles.settingValue}>Sharma Lunch Home</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Regenerate QR</Text>
            <Text style={[styles.settingValue, { color: colors.primary }]}>Regenerate</Text>
          </TouchableOpacity>
        </View>

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
})
