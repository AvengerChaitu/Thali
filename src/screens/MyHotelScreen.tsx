import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

export default function MyHotelScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Hotel</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hotelCard}>
          <View style={styles.hotelTop}>
            <View style={styles.iconWrap}><Text style={styles.icon}>🍽️</Text></View>
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>Sharma Lunch Home</Text>
              <Text style={styles.hotelAddr}>Arera Colony, Bhopal</Text>
            </View>
            <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your subscription</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Plan</Text>
              <Text style={styles.statValue}>Dinner</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>1 May – 31 May</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Meals used</Text>
              <Text style={styles.statValue}>22 / 30</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Meals remaining</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>8</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.switchBtn}>
          <Text style={styles.switchBtnText}>Switch hotel</Text>
        </TouchableOpacity>

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
  hotelCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: layout.cardPadding,
    borderWidth: 1, borderColor: colors.border, ...shadow.md, marginBottom: spacing.lg,
  },
  hotelTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  hotelInfo: { flex: 1 },
  hotelName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  hotelAddr: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 2 },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { fontSize: 11, color: colors.white, fontWeight: font.weight.bold },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.textHint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, minHeight: layout.touchTarget },
  statLabel: { fontSize: font.size.base, color: colors.textSecondary },
  statValue: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  switchBtn: {
    height: layout.touchTarget, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  switchBtnText: { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.medium },
})
