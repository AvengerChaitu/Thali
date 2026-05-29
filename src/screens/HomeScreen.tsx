import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../stores/authStore'
import { useMyAttendance, useMarkAttendance } from '../hooks/useAttendance'
import { useMySubscriptions } from '../hooks/useSubscriptions'
import { colors, spacing, font, radius, layout, shadow, duration, screen } from '../../tokens'

type AttendanceStatus = 'pending' | 'coming' | 'absent'

interface HistoryItem {
  id: string; date: string; meal: 'lunch' | 'dinner'
  status: 'present' | 'absent' | 'pending'; hotelName: string
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: '1', date: 'Today', meal: 'dinner', status: 'pending', hotelName: 'Sharma Lunch Home' },
  { id: '2', date: 'Yesterday', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '3', date: 'Mon, 26 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '4', date: 'Sun, 25 May', meal: 'lunch', status: 'absent', hotelName: 'Sharma Lunch Home' },
  { id: '5', date: 'Sat, 24 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
  { id: '6', date: 'Fri, 23 May', meal: 'dinner', status: 'present', hotelName: 'Sharma Lunch Home' },
]

const CutoffTimer = ({ cutoffTime }: { cutoffTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = cutoffTime.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Cutoff passed'); setUrgent(true); return }
      const hrs = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setUrgent(diff < 60 * 60 * 1000)
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [cutoffTime])

  return (
    <View style={[styles.timerRow, urgent && styles.timerRowUrgent]}>
      <View style={[styles.timerDot, urgent && styles.timerDotUrgent]} />
      <Text style={[styles.timerText, urgent && styles.timerTextUrgent]}>
        Cutoff {cutoffTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        {'  ·  '}{timeLeft}
      </Text>
    </View>
  )
}

const HistoryRow = ({ item }: { item: HistoryItem }) => {
  const dotColor = item.status === 'present' ? colors.success : item.status === 'absent' ? colors.danger : colors.warning
  const statusLabel = item.status === 'present' ? 'Present' : item.status === 'absent' ? 'Absent' : 'Pending'
  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyDot, { backgroundColor: dotColor }]} />
      <View style={styles.historyMeta}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <Text style={styles.historyMeal}>{item.meal === 'dinner' ? 'Dinner' : 'Lunch'}</Text>
      </View>
      <Text style={[styles.historyStatus, { color: dotColor }]}>{statusLabel}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const [refreshing, setRefreshing] = useState(false)
  const [history] = useState<HistoryItem[]>(MOCK_HISTORY)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const { data: subscriptions } = useMySubscriptions()
  const sub = subscriptions?.[0]
  const { data: attendance } = useMyAttendance(sub?.id ?? '')
  const markAttendance = useMarkAttendance()

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 800))
    setRefreshing(false)
  }, [])

  const handleMark = useCallback((status: 'coming' | 'absent') => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
    ]).start()
    if (sub) {
      markAttendance.mutate({
        subscriptionId: sub.id,
        hotelId: sub.hotelId,
        mealType: sub.mealType,
        status,
      }, {
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to mark attendance'),
      })
    }
  }, [sub, markAttendance])

  const attendanceRate = history.length > 0
    ? Math.round((history.filter(h => h.status === 'present').length / history.length) * 100)
    : 0

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'short' })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.appName}>thali</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={styles.headerBtnIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingLabel}>Good evening,</Text>
          <Text style={styles.greetingName}>{user?.name || 'Rahul'}</Text>
        </View>

        {sub ? (
          <Animated.View style={[styles.attendanceCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardMealType}>{(sub.mealType === 'dinner' ? 'Dinner' : 'Lunch') + ' today'}</Text>
                <Text style={styles.cardHotelName} numberOfLines={1}>{sub.hotelName}</Text>
              </View>
              <View style={styles.mealIconWrap}>
                <Text style={styles.mealEmoji}>{sub.mealType === 'dinner' ? '🌙' : '☀️'}</Text>
              </View>
            </View>
            <CutoffTimer cutoffTime={new Date(Date.now() + 2.5 * 60 * 60 * 1000)} />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.attendBtn, styles.comingBtn]} onPress={() => handleMark('coming')} activeOpacity={0.8} disabled={markAttendance.isPending}>
                <Text style={styles.attendBtnIcon}>✓</Text>
                <Text style={styles.attendBtnText}>{markAttendance.isPending ? '...' : 'Coming'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.attendBtn, styles.absentBtn]} onPress={() => handleMark('absent')} activeOpacity={0.8} disabled={markAttendance.isPending}>
                <Text style={styles.attendBtnIcon}>✕</Text>
                <Text style={styles.attendBtnText}>{markAttendance.isPending ? '...' : 'Not coming'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <View style={[styles.attendanceCard, { paddingVertical: spacing.xl }]}>
            <Text style={[styles.cardMealType, { textAlign: 'center' }]}>
              No active subscription
            </Text>
            <Text style={[styles.cardHotelName, { textAlign: 'center', fontSize: font.size.base }]}>
              Join a hotel to start marking attendance
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{attendanceRate}%</Text>
            <Text style={styles.statLabel}>This month</Text>
          </View>
          <View style={[styles.statChip, styles.statChipMid]}>
            <Text style={styles.statValue}>{history.filter(h => h.status === 'present').length}</Text>
            <Text style={styles.statLabel}>Days present</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{history.filter(h => h.status === 'absent').length}</Text>
            <Text style={styles.statLabel}>Days absent</Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent history</Text>
          <View style={styles.historyCard}>
            {history.map(item => (<HistoryRow key={item.id} item={item} />))}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, height: layout.headerHeight,
    backgroundColor: colors.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  appName: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.primary, letterSpacing: -0.5 },
  headerBtn: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { fontSize: font.size.lg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },
  greetingBlock: { marginBottom: spacing.lg },
  greetingLabel: { fontSize: font.size.sm, color: colors.textSecondary, marginBottom: 2 },
  greetingName: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.textPrimary, letterSpacing: -0.3 },
  attendanceCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: layout.cardPadding,
    marginBottom: spacing.md, ...shadow.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardMealType: { fontSize: font.size.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  cardHotelName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textOnGreen, maxWidth: screen.width * 0.58 },
  mealIconWrap: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  mealEmoji: { fontSize: font.size.lg },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginBottom: spacing.md },
  timerRowUrgent: {},
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  timerDotUrgent: { backgroundColor: colors.warning },
  timerText: { fontSize: font.size.sm, color: 'rgba(255,255,255,0.85)' },
  timerTextUrgent: { color: colors.warning, fontWeight: font.weight.medium },
  btnRow: { flexDirection: 'row', gap: spacing.xs },
  attendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xxs, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)',
    minHeight: layout.touchTarget,
  },
  comingBtn: {},
  absentBtn: {},
  attendBtnIcon: { fontSize: font.size.base, color: 'rgba(255,255,255,0.85)', fontWeight: font.weight.bold },
  attendBtnText: { fontSize: font.size.base, fontWeight: font.weight.medium, color: 'rgba(255,255,255,0.9)' },
  statsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  statChip: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  statChipMid: { borderTopWidth: 2, borderTopColor: colors.primary },
  statValue: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: font.size.xs, color: colors.textHint, textAlign: 'center' },
  historySection: { marginBottom: spacing.md },
  sectionTitle: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.textHint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: spacing.xs },
  historyCard: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: spacing.sm, minHeight: layout.touchTarget },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyMeta: { flex: 1 },
  historyDate: { fontSize: font.size.base, color: colors.textPrimary, fontWeight: font.weight.medium },
  historyMeal: { fontSize: font.size.xs, color: colors.textHint, marginTop: 1 },
  historyStatus: { fontSize: font.size.sm, fontWeight: font.weight.medium },
  bottomSpacer: { height: layout.navHeight + spacing.md },
})
