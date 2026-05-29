import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { colors, spacing, font, radius, layout, shadow, rs } from '../../tokens'

interface Member {
  id: string; name: string; phone: string
  mealsUsed: number; totalMeals: number; isActive: boolean
  joinedDate: string; avatarInitials: string
}

export default function MembersScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const [ownerHotel, setOwnerHotel] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) return
    supabase.from('hotels').select('id').eq('owner_id', userId).limit(1).single()
      .then(async ({ data: hotel, error }) => {
        if (error || !hotel) { setLoading(false); return }
        setOwnerHotel(hotel)
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*, profiles!inner(id, name, phone, avatar_initials), hotels!inner(name)')
          .eq('hotel_id', hotel.id)
        if (!subs) { setLoading(false); return }
        setMembers(subs.map((s: any) => ({
          id: s.profiles?.id ?? s.user_id,
          name: s.profiles?.name ?? '',
          phone: s.profiles?.phone ?? '',
          mealsUsed: s.meals_used,
          totalMeals: s.total_meals,
          isActive: s.is_active,
          joinedDate: new Date(s.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          avatarInitials: s.profiles?.avatar_initials || 'U',
        })))
        setLoading(false)
      })
  }, [userId])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Members</Text>
        <Text style={styles.count}>{members.length} total</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or phone..."
        placeholderTextColor={colors.textHint}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBody}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.loadingBody}>
            <Text style={styles.emptyTitle}>{members.length === 0 ? 'No members yet' : 'No matches'}</Text>
            <Text style={styles.emptySub}>{members.length === 0 ? 'Subscribers will appear here once they join.' : 'Try a different search term.'}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {filtered.map((m, i) => (
              <View key={m.id}>
                <View style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: m.isActive ? colors.primaryLight : colors.surfaceAlt }]}>
                    <Text style={[styles.avatarText, { color: m.isActive ? colors.primaryDark : colors.textHint }]}>{m.avatarInitials}</Text>
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{m.name}</Text>
                      {!m.isActive && <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>Inactive</Text></View>}
                    </View>
                    <Text style={styles.phone}>{m.phone}</Text>
                    <Text style={styles.meals}>{m.mealsUsed}/{m.totalMeals} meals · Joined {m.joinedDate}</Text>
                  </View>
                </View>
                {i < filtered.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
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
  count: { fontSize: font.size.sm, color: colors.textHint },
  searchInput: {
    marginHorizontal: layout.screenPadding, marginVertical: spacing.sm,
    height: layout.touchTarget, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, fontSize: font.size.base, backgroundColor: colors.surface, color: colors.textPrimary,
  },
  scrollContent: { paddingHorizontal: layout.screenPadding },
  loadingBody: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  emptySub: { fontSize: font.size.base, color: colors.textHint, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm, minHeight: layout.touchTarget },
  avatar: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: font.size.sm, fontWeight: font.weight.bold },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  name: { fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.textPrimary },
  inactiveBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.surfaceAlt },
  inactiveText: { fontSize: font.size.xs, color: colors.textHint },
  phone: { fontSize: font.size.xs, color: colors.textHint, marginTop: 1 },
  meals: { fontSize: font.size.xs, color: colors.textHint, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
})
