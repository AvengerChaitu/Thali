import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  Animated, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { supabase } from '../../src/lib/supabase'
import { useNearbyHotels } from '../../src/hooks/useHotels'
import { colors, spacing, font, radius, layout, shadow, duration, screen, rs } from '../../tokens'

interface HotelRow {
  id: string; name: string; address: string
  distanceKm?: number; subscriberCount?: number; isVerified: boolean
}

const HotelCard = ({ hotel, onPress, index, showDistance }: { hotel: HotelRow; onPress: (h: HotelRow) => void; index: number; showDistance: boolean }) => {
  const slideAnim = useRef(new Animated.Value(24)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start()
  }, [])

  const distLabel = hotel.distanceKm != null
    ? (hotel.distanceKm < 1
      ? `${Math.round(hotel.distanceKm * 1000)} m away`
      : `${hotel.distanceKm.toFixed(1)} km away`)
    : null

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity style={styles.hotelCard} onPress={() => onPress(hotel)} activeOpacity={0.75}>
        <View style={styles.hotelLeft}>
          <View style={styles.hotelIconWrap}><Text style={styles.hotelIcon}>🍽️</Text></View>
          <View style={styles.hotelInfo}>
            <View style={styles.hotelNameRow}>
              <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
              {hotel.isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>}
            </View>
            <Text style={styles.hotelAddress} numberOfLines={1}>{hotel.address}</Text>
            <View style={styles.hotelMeta}>
              {showDistance && distLabel && <Text style={styles.metaTx}>{distLabel}</Text>}
              {showDistance && distLabel && hotel.subscriberCount != null && <Text style={styles.metaDot}>·</Text>}
              {hotel.subscriberCount != null && <Text style={styles.metaTx}>{hotel.subscriberCount} members</Text>}
            </View>
          </View>
        </View>
        <View style={styles.scanPill}><Text style={styles.scanPillTx}>Scan QR</Text></View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function HotelFinder() {
  const [permission, setPermission] = useState<'undecided' | 'granted' | 'denied'>('undecided')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<HotelRow[]>([])
  const [searching, setSearching] = useState(false)
  const { data: nearbyData, isLoading } = useNearbyHotels(location?.lat ?? 0, location?.lng ?? 0)

  const nearbyHotels: HotelRow[] = (nearbyData ?? []).map((h: any) => ({
    id: h.id, name: h.name, address: h.address,
    distanceKm: h.distance_km, subscriberCount: h.subscriber_count, isVerified: h.is_verified,
  }))

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('hotels')
          .select('id, name, address, is_verified')
          .ilike('name', `%${search.trim()}%`)
          .limit(20)
        if (error) { console.error('Search error:', error); setSearchResults([]) }
        else {
          setSearchResults((data ?? []).map((h: any) => ({
            id: h.id, name: h.name, address: h.address, isVerified: h.is_verified,
          })))
        }
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const displayHotels = search.trim() ? searchResults : nearbyHotels

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to find nearby hotels.')
        setPermission('denied')
        return
      }
      setPermission('granted')
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to get location')
      setPermission('denied')
    }
  }, [])

  if (permission !== 'granted') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>thali</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/onboarding/role')}>
            <Text style={styles.backTx}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gate}>
          <Text style={styles.gateEmoji}>📍</Text>
          <Text style={styles.gateTitle}>Find hotels near you</Text>
          <Text style={styles.gateSub}>
            Thali needs your location once to show registered hotels nearby.
          </Text>
          <TouchableOpacity style={styles.gateBtn} onPress={requestLocation}>
            <Text style={styles.gateBtnText}>Allow location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading || !location) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>thali</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/onboarding/role')}>
            <Text style={styles.backTx}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTx}>Finding hotels nearby…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appHeader}>
        <Text style={styles.appName}>thali</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/onboarding/role')}>
          <Text style={styles.backTx}>Back</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by hotel name…"
        placeholderTextColor={colors.textHint}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {search.trim() ? null : (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Hotels near you</Text>
          <Text style={styles.listSub}>{nearbyHotels.length} registered · within 5 km</Text>
        </View>
      )}
      <FlatList
        data={searching && search.trim() ? [] : displayHotels}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <HotelCard hotel={item} onPress={(h) => router.push({ pathname: '/onboarding/scan', params: { hotelId: h.id, hotelName: h.name } })} index={index} showDistance={!search.trim()} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListFooterComponent={() => <View style={{ height: spacing.xxl }} />}
        ListEmptyComponent={() => {
          if (searching) return <View style={styles.emptyWrap}><ActivityIndicator size="large" color={colors.primary} /></View>
          return (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>{search.trim() ? '🔍' : '🏨'}</Text>
              <Text style={styles.emptyTitle}>{search.trim() ? 'No matching hotels' : 'No hotels nearby'}</Text>
              <Text style={styles.emptySub}>
                {search.trim()
                  ? 'Try a different name or check the spelling.'
                  : 'There are no registered hotels within 5 km of your location.'}
              </Text>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  appHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding, height: layout.headerHeight,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  appName: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.primary, letterSpacing: -0.5 },
  backBtn: { minHeight: layout.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
  backTx: { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.medium },
  searchInput: {
    marginHorizontal: layout.screenPadding, marginVertical: spacing.sm,
    height: layout.touchTarget, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, fontSize: font.size.base, backgroundColor: colors.surface, color: colors.textPrimary,
  },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(40), gap: spacing.md },
  gateEmoji: { fontSize: rs(48), marginBottom: spacing.xs },
  gateTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  gateSub: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  gateBtnText: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingTx: { fontSize: font.size.base, color: colors.textSecondary },
  listHeader: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  listTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, letterSpacing: -0.3 },
  listSub: { fontSize: font.size.sm, color: colors.textHint, marginTop: 3 },
  listContent: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.xs },
  hotelCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: layout.cardPadding, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.sm },
  hotelLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginRight: spacing.sm },
  hotelIconWrap: { width: rs(44), height: rs(44), borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hotelIcon: { fontSize: rs(20) },
  hotelInfo: { flex: 1 },
  hotelNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  hotelName: { fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.textPrimary, flex: 1 },
  verifiedBadge: { width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { fontSize: rs(9), color: colors.white, fontWeight: font.weight.bold },
  hotelAddress: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 2 },
  hotelMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 3 },
  metaTx: { fontSize: font.size.xs, color: colors.textHint },
  metaDot: { fontSize: font.size.xs, color: colors.textHint },
  scanPill: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, minHeight: rs(30), justifyContent: 'center' },
  scanPillTx: { fontSize: font.size.xs, color: colors.primaryDark, fontWeight: font.weight.medium },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm, paddingTop: rs(80) },
  emptyEmoji: { fontSize: rs(48) },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  emptySub: { fontSize: font.size.base, color: colors.textHint, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
})
