import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

interface HistoryItem {
  id: string; date: string; meal: 'lunch' | 'dinner'
  status: 'present' | 'absent' | 'pending'; hotelName: string
}

const MOCK_DATA: HistoryItem[] = [
  { id: '1', date: 'Wed, 28 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '2', date: 'Tue, 27 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '3', date: 'Mon, 26 May', meal: 'dinner', status: 'absent', hotelName: 'Sharma Lunch Home' },
  { id: '4', date: 'Sun, 25 May', meal: 'lunch', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '5', date: 'Sat, 24 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '6', date: 'Fri, 23 May', meal: 'dinner', status: 'absent', hotelName: 'Sharma Lunch Home' },
  { id: '7', date: 'Thu, 22 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '8', date: 'Wed, 21 May', meal: 'lunch', status: 'pending', hotelName: 'Sharma Lunch Home' },
]

export default function HistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all')
  const data = filter === 'all' ? MOCK_DATA : MOCK_DATA.filter(h => h.status === filter)

  const tabs = [
    { key: 'all' as const, label: `All (${MOCK_DATA.length})` },
    { key: 'present' as const, label: `Present (${MOCK_DATA.filter(h => h.status === 'present').length})` },
    { key: 'absent' as const, label: `Absent (${MOCK_DATA.filter(h => h.status === 'absent').length})` },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>History</Text>
      </View>

      <View style={styles.filterRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[styles.filterTab, filter === t.key && styles.filterTabActive]} onPress={() => setFilter(t.key)}>
            <Text style={[styles.filterText, filter === t.key && styles.filterTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {data.map((item, i) => {
            const dotColor = item.status === 'present' ? colors.success : item.status === 'absent' ? colors.danger : colors.warning
            const statusLabel = item.status === 'present' ? 'Present' : item.status === 'absent' ? 'Absent' : 'Pending'
            return (
              <View key={item.id}>
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                  <View style={styles.meta}>
                    <Text style={styles.date}>{item.date}</Text>
                    <Text style={styles.meal}>{item.meal === 'dinner' ? 'Dinner' : 'Lunch'} · {item.hotelName}</Text>
                  </View>
                  <Text style={[styles.status, { color: dotColor }]}>{statusLabel}</Text>
                </View>
                {i < data.length - 1 && <View style={styles.divider} />}
              </View>
            )
          })}
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
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: layout.screenPadding, paddingVertical: spacing.sm },
  filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.medium },
  filterTextActive: { color: colors.white },
  scrollContent: { padding: layout.screenPadding },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm, minHeight: layout.touchTarget },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  meta: { flex: 1 },
  date: { fontSize: font.size.base, color: colors.textPrimary, fontWeight: font.weight.medium },
  meal: { fontSize: font.size.xs, color: colors.textHint, marginTop: 1 },
  status: { fontSize: font.size.sm, fontWeight: font.weight.medium },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
})
