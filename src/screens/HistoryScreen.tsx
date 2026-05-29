import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMySubscriptions } from '../hooks/useSubscriptions'
import { useMyAttendance } from '../hooks/useAttendance'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

export default function HistoryScreen() {
  const { data: subscriptions } = useMySubscriptions()
  const sub = subscriptions?.[0]
  const { data: attendance, isLoading } = useMyAttendance(sub?.id ?? '')
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all')

  const records = (attendance ?? []).map(r => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    meal: r.mealType,
    status: r.status === 'coming' ? 'present' as const : r.status === 'absent' ? 'absent' as const : 'pending' as const,
  }))

  const data = filter === 'all' ? records : records.filter(h => h.status === filter)

  const counts = { all: records.length, present: records.filter(r => r.status === 'present').length, absent: records.filter(r => r.status === 'absent').length }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>History</Text>
      </View>

      {subscriptions && subscriptions.length > 0 ? (
        <>
          <View style={styles.filterRow}>
            {(['all', 'present', 'absent'] as const).map(key => (
              <TouchableOpacity key={key} style={[styles.filterTab, filter === key && styles.filterTabActive]} onPress={() => setFilter(key)}>
                <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                  {key === 'all' ? 'All' : key === 'present' ? 'Present' : 'Absent'} ({counts[key]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
            ) : data.length === 0 ? (
              <View style={styles.emptyBody}>
                <Text style={styles.emptyTitle}>No records</Text>
                <Text style={styles.emptySub}>Attendance history will appear here.</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {data.map((item, i) => {
                  const dotColor = item.status === 'present' ? colors.success : colors.danger
                  const statusLabel = item.status === 'present' ? 'Present' : 'Absent'
                  return (
                    <View key={`${item.date}-${item.meal}`}>
                      <View style={styles.row}>
                        <View style={[styles.dot, { backgroundColor: dotColor }]} />
                        <View style={styles.meta}>
                          <Text style={styles.date}>{item.date}</Text>
                          <Text style={styles.meal}>{item.meal === 'dinner' ? 'Dinner' : 'Lunch'}</Text>
                        </View>
                        <Text style={[styles.status, { color: dotColor }]}>{statusLabel}</Text>
                      </View>
                      {i < data.length - 1 && <View style={styles.divider} />}
                    </View>
                  )
                })}
              </View>
            )}
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>No subscription</Text>
          <Text style={styles.emptySub}>Join a hotel to see your attendance history.</Text>
        </View>
      )}
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
  emptyBody: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  emptySub: { fontSize: font.size.base, color: colors.textHint, textAlign: 'center', paddingHorizontal: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm, minHeight: layout.touchTarget },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  meta: { flex: 1 },
  date: { fontSize: font.size.base, color: colors.textPrimary, fontWeight: font.weight.medium },
  meal: { fontSize: font.size.xs, color: colors.textHint, marginTop: 1 },
  status: { fontSize: font.size.sm, fontWeight: font.weight.medium },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
})
