/**
 * BottomNav.tsx — Tab bar + root layout wrapper
 *
 * Works correctly across:
 *  - Android gesture navigation (Android 10+) — no overlap with home bar
 *  - Android 3-button nav
 *  - iOS home indicator
 *  - All screen densities
 *
 * Use with expo-router layout file:
 *   app/(tabs)/_layout.tsx  ->  export { default } from '@/BottomNav'
 *
 * Or wrap your screens manually with <AppLayout>.
 */

import React, { useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, font, radius, layout, rs, duration } from './tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = 'home' | 'history' | 'hotel' | 'profile'

interface TabItem {
  key: TabKey
  label: string
  emoji: string
  ownerOnly?: boolean
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const SUBSCRIBER_TABS: TabItem[] = [
  { key: 'home',    label: 'Home',    emoji: '🏠' },
  { key: 'history', label: 'History', emoji: '📅' },
  { key: 'hotel',   label: 'Hotel',   emoji: '🍽️' },
  { key: 'profile', label: 'Profile', emoji: '👤' },
]

const OWNER_TABS: TabItem[] = [
  { key: 'home',    label: 'Today',    emoji: '📊' },
  { key: 'history', label: 'Members',  emoji: '👥' },
  { key: 'hotel',   label: 'Reports',  emoji: '📋' },
  { key: 'profile', label: 'Settings', emoji: '⚙️' },
]

// ─── Single tab button ────────────────────────────────────────────────────────

const TabButton = ({
  item,
  isActive,
  onPress,
}: {
  item: TabItem
  isActive: boolean
  onPress: () => void
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const dotAnim   = useRef(new Animated.Value(isActive ? 1 : 0)).current

  const handlePress = useCallback(() => {
    // Bounce feedback on tap
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
    ]).start()

    Animated.timing(dotAnim, {
      toValue: 1, duration: duration.fast, useNativeDriver: true,
    }).start()

    onPress()
  }, [onPress])

  // Animate dot in/out when active changes
  React.useEffect(() => {
    Animated.timing(dotAnim, {
      toValue: isActive ? 1 : 0,
      duration: duration.fast,
      useNativeDriver: true,
    }).start()
  }, [isActive])

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={handlePress}
      activeOpacity={1}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Pill background for active state */}
        {isActive && (
          <View style={styles.activePill} />
        )}

        <Text style={[styles.tabEmoji, isActive && styles.tabEmojiActive]}>
          {item.emoji}
        </Text>

        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {item.label}
        </Text>

        {/* Active dot indicator */}
        <Animated.View style={[styles.activeDot, { opacity: dotAnim }]} />
      </Animated.View>
    </TouchableOpacity>
  )
}

// ─── Bottom Nav bar ───────────────────────────────────────────────────────────

interface BottomNavProps {
  activeTab: TabKey
  onTabPress: (tab: TabKey) => void
  isOwner?: boolean
}

export const BottomNav = ({ activeTab, onTabPress, isOwner = false }: BottomNavProps) => {
  const insets = useSafeAreaInsets()
  const tabs = isOwner ? OWNER_TABS : SUBSCRIBER_TABS

  // Bottom padding: safe area inset + small buffer
  // Android gesture nav: insets.bottom is ~28-48dp
  // Android 3-button:    insets.bottom is 0 (buttons are outside app window)
  // iOS home indicator:  insets.bottom is 34pt
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0)

  return (
    <View style={[styles.navBar, { paddingBottom: bottomPad }]}>
      <View style={styles.navInner}>
        {tabs.map(tab => (
          <TabButton
            key={tab.key}
            item={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  )
}

// ─── App layout wrapper ───────────────────────────────────────────────────────
// Wraps screens with header + bottom nav in a consistent container.
// Use this in your expo-router layout file.

interface AppLayoutProps {
  children: React.ReactNode
  activeTab: TabKey
  onTabPress: (tab: TabKey) => void
  isOwner?: boolean
}

export const AppLayout = ({ children, activeTab, onTabPress, isOwner }: AppLayoutProps) => {
  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>
        {children}
      </View>
      <BottomNav activeTab={activeTab} onTabPress={onTabPress} isOwner={isOwner} />
    </View>
  )
}

// ─── Expo Router usage example ────────────────────────────────────────────────
// app/(tabs)/_layout.tsx:
//
// import { Tabs } from 'expo-router'
// import { BottomNav } from '@/BottomNav'
//
// export default function TabLayout() {
//   return (
//     <Tabs
//       tabBar={props => (
//         <BottomNav
//           activeTab={props.state.routeNames[props.state.index] as TabKey}
//           onTabPress={key => props.navigation.navigate(key)}
//         />
//       )}
//       screenOptions={{ headerShown: false }}
//     >
//       <Tabs.Screen name="home"    options={{ title: 'Home'    }} />
//       <Tabs.Screen name="history" options={{ title: 'History' }} />
//       <Tabs.Screen name="hotel"   options={{ title: 'Hotel'   }} />
//       <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
//     </Tabs>
//   )
// }

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenArea: {
    flex: 1,
  },
  navBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    // Android elevation so nav appears above screen content
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  navInner: {
    flexDirection: 'row',
    height: layout.navHeight,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Ensure minimum touch target even on small phones
    minHeight: 44,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    position: 'relative',
    gap: 2,
    minWidth: rs(48),
  },
  activePill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  tabEmoji: {
    fontSize: rs(18),
    opacity: 0.45,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: font.size.xs,
    color: colors.navInactive,
    fontWeight: font.weight.medium,
  },
  tabLabelActive: {
    color: colors.navActive,
    fontWeight: font.weight.bold,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
})
