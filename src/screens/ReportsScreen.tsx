import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { colors, spacing, font, radius, layout, shadow } from '../../tokens'

interface MonthData {
  month: string; total: number; coming: number; absent: number
}

export default function ReportsScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const [ownerHotel, setOwnerHotel] = useState<any>(null)
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('hotels').select('*').eq('owner_id', userId).limit(1).single()
      .then(({ data, error }) => {
        if (!error && data) setOwnerHotel(data)
        else setOwnerHotel(null)
      })
  }, [userId])

  useEffect(() => {
    if (!ownerHotel?.id) { setLoading(false); return }
    setLoading(true)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    supabase
      .from('attendance')
      .select('date, status')
      .eq('hotel_id', ownerHotel.id)
      .gte('date', threeMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .then(({ data: records, error }) => {
        if (error) { console.error(error); setLoading(false); return }
        const grouped: Record<string, { total: number; coming: number; absent: number }> = {}
        for (const r of records ?? []) {
          const month = r.date.slice(0, 7)
          if (!grouped[month]) grouped[month] = { total: 0, coming: 0, absent: 0 }
          grouped[month].total++
          if (r.status === 'coming') grouped[month].coming++
          else if (r.status === 'absent') grouped[month].absent++
        }
        setData(Object.entries(grouped).map(([month, v]) => ({ month, ...v })).sort((a, b) => b.month.localeCompare(a.month)))
        setLoading(false)
      })
  }, [ownerHotel?.id])

  const [selectedMonth, setSelectedMonth] = useState(0)
  const m = data[selectedMonth]
  const pct = m ? Math.round((m.coming / m.total) * 100) : 0

  const exportCSV = async () => {
    if (data.length === 0) { Alert.alert('No data', 'No data to export.'); return }
    setExporting(true)
    try {
      let csv = 'Month,Total,Coming,Absent,Attendance Rate\n'
      for (const d of data) {
        const rate = d.total > 0 ? Math.round((d.coming / d.total) * 100) : 0
        csv += `${d.month},${d.total},${d.coming},${d.absent},${rate}%\n`
      }
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory
      if (!dir) { Alert.alert('Error', 'Cannot access file system'); return }
      const uri = dir + 'thali_report.csv'
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 })
      const fileUri = uri.startsWith('file://') ? uri : 'file://' + uri
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' })
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Reports</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportCSV} disabled={exporting || loading}>
          <Text style={styles.exportTx}>{exporting ? '...' : 'Export CSV'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBody}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTx}>Loading reports…</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>Attendance data will appear here once subscribers start marking.</Text>
          </View>
        ) : (
          <>
            <View style={styles.monthSelector}>
              {data.map((d, i) => (
                <TouchableOpacity
                  key={d.month}
                  style={[styles.monthTab, selectedMonth === i && styles.monthTabActive]}
                  onPress={() => setSelectedMonth(i)}
                >
                  <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>
                    {d.month}
                  </Text>
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
            </View>
          </>
        )}
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
  loadingBody: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  loadingTx: { fontSize: font.size.base, color: colors.textSecondary },
  emptyBody: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  emptySub: { fontSize: font.size.base, color: colors.textHint, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
  monthSelector: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg, flexWrap: 'wrap' },
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
