import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, font, radius, layout, shadow, rs } from '../../tokens'

interface Member {
  id: string; name: string; phone: string
  mealsUsed: number; totalMeals: number; isActive: boolean
  joinedDate: string; avatarInitials: string
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Rahul Sharma', phone: '9876543210', mealsUsed: 22, totalMeals: 30, isActive: true, joinedDate: '1 May', avatarInitials: 'RS' },
  { id: '2', name: 'Priya Kulkarni', phone: '9876543211', mealsUsed: 15, totalMeals: 30, isActive: true, joinedDate: '5 May', avatarInitials: 'PK' },
  { id: '3', name: 'Arjun Mehta', phone: '9876543212', mealsUsed: 28, totalMeals: 30, isActive: true, joinedDate: '1 Apr', avatarInitials: 'AM' },
  { id: '4', name: 'Neha Joshi', phone: '9876543213', mealsUsed: 30, totalMeals: 30, isActive: true, joinedDate: '1 May', avatarInitials: 'NJ' },
  { id: '5', name: 'Vijay Rao', phone: '9876543214', mealsUsed: 10, totalMeals: 30, isActive: false, joinedDate: '10 May', avatarInitials: 'VR' },
]

export default function MembersScreen() {
  const [search, setSearch] = useState('')
  const filtered = MOCK_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Members</Text>
        <Text style={styles.count}>{MOCK_MEMBERS.length} total</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or phone..."
        placeholderTextColor={colors.textHint}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
