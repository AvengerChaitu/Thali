import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/authStore'
import { colors, spacing, font, radius, layout, shadow, rs } from '../../tokens'

const ROLES = [
  {
    key: 'subscriber',
    title: 'I eat here',
    desc: 'Mark daily attendance, track your meals, and never lose a meal credit.',
    emoji: '🍽️',
  },
  {
    key: 'owner',
    title: 'I run a hotel',
    desc: 'Real-time headcount, reduce food waste, manage subscribers digitally.',
    emoji: '🏪',
  },
] as const

export default function RoleSelectScreen() {
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setRole = useAuthStore((s) => s.setRole)
  const setOnboarded = useAuthStore((s) => s.setOnboarded)

  const selectRole = async (role: 'subscriber' | 'owner') => {
    setLoading(true)
    try {
      const userId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id
      if (!userId) return
      const initials = (user?.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        phone: user?.phone || '',
        name: user?.name || '',
        role,
        avatar_initials: initials,
        language: 'en',
      })
      if (error) throw error
      setRole(role)
      setOnboarded(true)

      if (role === 'subscriber') {
        router.replace('/onboarding/find')
      } else {
        router.replace('/(tabs)')
      }
    } catch (err) {
      console.error('Role select error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.heading}>Who are you?</Text>
        <Text style={styles.sub}>Choose how you will use Thali</Text>

        <View style={styles.cardRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.roleCard}
              onPress={() => selectRole(r.key)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{r.emoji}</Text>
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
  },
  heading: {
    fontSize: font.size.xxl, fontWeight: font.weight.bold,
    color: colors.textPrimary, letterSpacing: -0.3,
  },
  sub: {
    fontSize: font.size.base, color: colors.textSecondary,
    marginTop: spacing.xs, marginBottom: spacing.xxl,
  },
  cardRow: { gap: spacing.md },
  roleCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
    ...shadow.md,
  },
  emoji: { fontSize: rs(36), marginBottom: spacing.sm },
  roleTitle: {
    fontSize: font.size.xl, fontWeight: font.weight.bold,
    color: colors.textPrimary, marginBottom: spacing.xxs,
  },
  roleDesc: {
    fontSize: font.size.base, color: colors.textSecondary,
    lineHeight: 22,
  },
})
