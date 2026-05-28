import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

interface MonthData {
  month: string; total: number; coming: number; absent: number; revenue: string
}

const MOCK_DATA: MonthData[] = [
  { month: 'May 2026', total: 930, coming: 682, absent: 248, revenue: '₹46,500' },
  { month: 'Apr 2026', total: 900, coming: 671, absent: 229, revenue: '₹45,000' },
  { month: 'Mar 2026', total: 930, coming: 703, absent: 227, revenue: '₹46,500' },
]

export default function ReportsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(0)
  const m = MOCK_DATA[selectedMonth]
  const pct = Math.round((m.coming / m.total) * 100)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Reports</Text>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportTx}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.monthSelector}>
          {MOCK_DATA.map((m, i) => (
            <TouchableOpacity
              key={m.month}
              style={[styles.monthTab, selectedMonth === i && styles.monthTabActive]}
              onPress={() => setSelectedMonth(i)}
            >
              <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m.month}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{m.month} summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total meals</Text>
            <Text style={styles.statValue}>{m.total}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Attendance rate</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{pct}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Coming</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{m.coming}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>{m.absent}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{m.revenue}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, height: layout.headerHeight,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  screenTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  exportBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary, minHeight: layout.touchTarget, justifyContent: 'center' },
  exportTx: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.primary },
  scrollContent: { padding: layout.screenPadding },
  monthSelector: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  monthTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  monthTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthText: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.medium },
  monthTextActive: { color: colors.white },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  cardTitle: { fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.textPrimary, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, minHeight: layout.touchTarget },
  statLabel: { fontSize: font.size.base, color: colors.textSecondary },
  statValue: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
})
