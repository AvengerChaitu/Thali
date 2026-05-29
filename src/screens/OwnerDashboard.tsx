import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useOwnerDashboard } from '../hooks/useAttendance'
import { colors, spacing, font, radius, layout, shadow, duration, screen, rs } from '../../tokens'
import type { DashboardSubscriber } from '../types'

type SubscriberStatus = 'coming' | 'absent' | 'pending'

const CutoffBanner = ({ stats }: { stats: DayStats }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const tick = () => {
      const diff = stats.cutoffTime.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Count locked'); return }
      const hrs = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m until cutoff` : `${mins}m until cutoff`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [stats.cutoffTime])

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start()
  }, [])

  const isPassed = stats.cutoffTime.getTime() < Date.now()

  return (
    <View style={[styles.cutoffBanner, isPassed ? styles.bannerLocked : styles.bannerOpen]}>
      <View style={styles.bannerLeft}>
        <Animated.View style={[styles.bannerDot, { backgroundColor: isPassed ? colors.textHint : colors.warning, opacity: pulseAnim }]} />
        <View>
          <Text style={styles.bannerTitle}>{isPassed ? 'Window closed' : 'Window open'}</Text>
          <Text style={styles.bannerSub}>{timeLeft}</Text>
        </View>
      </View>
    </View>
  )
}

const StatCard = ({ value, label, color, accent, delay = 0 }: {
  value: number; label: string; color: string; accent?: string; delay?: number
}) => {
  const translateY = useRef(new Animated.Value(16)).current
  const opacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
    ]).start()
  }, [])
  return (
    <Animated.View style={[styles.statCard, accent ? { borderTopWidth: 3, borderTopColor: accent } : {}, { transform: [{ translateY }], opacity }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  )
}

const FilterTabs = ({ active, onChange, counts }: {
  active: SubscriberStatus | 'all'
  onChange: (f: SubscriberStatus | 'all') => void
  counts: Record<string, number>
}) => {
  const tabs = [
    { key: 'all' as const, label: `All (${counts.all})` },
    { key: 'coming' as const, label: `Coming (${counts.coming})` },
    { key: 'absent' as const, label: `Absent (${counts.absent})` },
    { key: 'pending' as const, label: `Pending (${counts.pending})` },
  ]
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
      {tabs.map(t => (
        <TouchableOpacity key={t.key} style={[styles.filterTab, active === t.key && styles.filterTabActive]} onPress={() => onChange(t.key)}>
          <Text style={[styles.filterTabText, active === t.key && styles.filterTabTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const StatusBadge = ({ status }: { status: SubscriberStatus }) => {
  const cfg = {
    coming: { bg: colors.successBg, text: colors.primaryDeep, label: 'Coming' },
    absent: { bg: colors.dangerBg, text: colors.dangerDark, label: 'Absent' },
    pending: { bg: colors.warningBg, text: colors.warningDark, label: 'Pending' },
  }[status]
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
}

const SubscriberRow = ({ item }: { item: Subscriber }) => {
  const avatarBg = { coming: colors.successBg, absent: colors.dangerBg, pending: colors.surfaceAlt }[item.status]
  const avatarTx = { coming: colors.primaryDark, absent: colors.dangerDark, pending: colors.textSecondary }[item.status]
  return (
    <View style={styles.subRow}>
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[styles.avatarText, { color: avatarTx }]}>{item.avatarInitials}</Text>
      </View>
      <View style={styles.subInfo}>
        <Text style={styles.subName}>{item.name}</Text>
        <Text style={[styles.subMeta, !item.markedAt && { color: colors.warningDark }]}>
          {item.markedAt ? `Marked at ${item.markedAt}` : 'Not marked yet'}
        </Text>
      </View>
      <StatusBadge status={item.status} />
    </View>
  )
}

export default function OwnerDashboard() {
  const userId = useAuthStore((s) => s.user?.id)
  const [filter, setFilter] = useState<SubscriberStatus | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [mealType, setMealType] = useState<'dinner' | 'lunch'>('dinner')
  const [ownerHotel, setOwnerHotel] = useState<any>(null)

  useEffect(() => {
    if (!userId) return
    supabase.from('hotels').select('*').eq('owner_id', userId).limit(1).single()
      .then(({ data, error }) => { if (!error && data) setOwnerHotel(data) })
  }, [userId])

  const { data: dashData, isLoading, refetch } = useOwnerDashboard(ownerHotel?.id ?? '', mealType)

  const stats = dashData?.stats ?? { total: 0, coming: 0, absent: 0, pending: 0, cutoffTime: new Date() }
  const subscribers: DashboardSubscriber[] = dashData?.subscribers ?? []

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const visible = (filter === 'all' ? subscribers : subscribers.filter(s => s.status === filter))
    .slice().sort((a, b) => {
      const ord: Record<SubscriberStatus, number> = { coming: 0, pending: 1, absent: 2 }
      return ord[a.status] - ord[b.status]
    })

  const pct = stats.total > 0 ? Math.round((stats.coming / stats.total) * 100) : 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.hotelName}>{ownerHotel?.name ?? 'My Hotel'}</Text>
          <View style={styles.mealToggleRow}>
            <TouchableOpacity onPress={() => setMealType('dinner')} style={[styles.mealToggleBtn, mealType === 'dinner' && styles.mealToggleActive]}>
              <Text style={[styles.mealToggleTx, mealType === 'dinner' && styles.mealToggleTxActive]}>Dinner</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMealType('lunch')} style={[styles.mealToggleBtn, mealType === 'lunch' && styles.mealToggleActive]}>
              <Text style={[styles.mealToggleTx, mealType === 'lunch' && styles.mealToggleTxActive]}>Lunch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading && !dashData ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <CutoffBanner stats={stats} />

        <View style={styles.statsGrid}>
          <StatCard value={stats.coming} label="Confirmed" color={colors.primary} accent={colors.primary} delay={0} />
          <StatCard value={stats.absent} label="Absent" color={colors.danger} delay={80} />
          <StatCard value={stats.pending} label="Pending" color={colors.warning} delay={160} />
          <StatCard value={stats.total} label="Total" color={colors.textSecondary} delay={240} />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLbl}>Attendance today</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fillGreen, { flex: stats.coming }]} />
            <View style={[styles.fillRed, { flex: stats.absent }]} />
            <View style={[styles.fillGray, { flex: stats.pending }]} />
          </View>
          <View style={styles.legend}>
            {[
              { color: colors.primary, label: `Coming (${stats.coming})` },
              { color: colors.danger, label: `Absent (${stats.absent})` },
              { color: '#D0D0CE', label: `Pending (${stats.pending})` },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendTx}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subscribers</Text>
        <FilterTabs active={filter} onChange={setFilter} counts={{ all: stats.total, coming: stats.coming, absent: stats.absent, pending: stats.pending }} />
        <View style={styles.listCard}>
          {visible.map((item, i) => (
            <View key={item.id}>
              <SubscriberRow item={item} />
              {i < visible.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
        <View style={{ height: layout.navHeight + spacing.md }} />
      </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  hotelName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, letterSpacing: -0.3 },
  mealToggleRow: { flexDirection: 'row', gap: spacing.xxs, marginTop: spacing.xxs },
  mealToggleBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, minHeight: rs(28), justifyContent: 'center' },
  mealToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mealToggleTx: { fontSize: font.size.xs, color: colors.textSecondary, fontWeight: font.weight.medium },
  mealToggleTxActive: { color: colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  cutoffBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  bannerOpen: { backgroundColor: colors.warningBg },
  bannerLocked: { backgroundColor: colors.surfaceAlt },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerTitle: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  bannerSub: { fontSize: font.size.xs, color: colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  statCard: {
    flex: 1, minWidth: screen.isSmall ? rs(70) : rs(75),
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.sm, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm,
  },
  statValue: { fontSize: font.size.xxl, fontWeight: font.weight.bold, letterSpacing: -0.5 },
  statLabel: { fontSize: font.size.xs, color: colors.textHint, marginTop: 3, textAlign: 'center' },
  progressBlock: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLbl: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  progressPct: { fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.primary },
  track: { height: rs(10), borderRadius: radius.full, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.surfaceAlt, marginBottom: spacing.sm },
  fillGreen: { backgroundColor: colors.primary },
  fillRed: { backgroundColor: colors.danger },
  fillGray: { backgroundColor: '#D0D0CE' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTx: { fontSize: font.size.xs, color: colors.textHint },
  sectionTitle: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.textHint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: spacing.xs },
  filterScroll: { gap: spacing.xs, paddingBottom: spacing.sm },
  filterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, minHeight: rs(32), justifyContent: 'center' },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.medium },
  filterTabTextActive: { color: colors.white },
  listCard: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm, minHeight: layout.touchTarget },
  avatar: { width: rs(36), height: rs(36), borderRadius: rs(18), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: font.size.sm, fontWeight: font.weight.bold },
  subInfo: { flex: 1 },
  subName: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  subMeta: { fontSize: font.size.xs, color: colors.textHint, marginTop: 2 },
  badge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: font.size.xs, fontWeight: font.weight.medium },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: rs(36) + spacing.sm },
})
