import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors, spacing, font, radius, layout, shadow, duration, screen, rs } from '../../tokens'

interface Hotel {
  id: string; name: string; address: string
  distanceKm: number; meals: string[]
  subscriberCount: number; isVerified: boolean; ownerName: string
}

const MOCK_HOTELS: Hotel[] = [
  { id: 'h1', name: 'Sharma Lunch Home',    address: 'Arera Colony, Bhopal',  distanceKm: 0.3, meals: ['Dinner'],           subscriberCount: 45, isVerified: true,  ownerName: 'Ramesh Sharma'  },
  { id: 'h2', name: 'Maa Ki Rasoi',         address: 'MP Nagar, Bhopal',      distanceKm: 0.7, meals: ['Lunch', 'Dinner'],  subscriberCount: 32, isVerified: true,  ownerName: 'Sunita Verma'   },
  { id: 'h3', name: 'Punjabi Dhaba',        address: 'Habibganj, Bhopal',     distanceKm: 1.2, meals: ['Dinner'],           subscriberCount: 28, isVerified: false, ownerName: 'Gurpreet Singh' },
  { id: 'h4', name: 'South Indian Corner',  address: 'TT Nagar, Bhopal',      distanceKm: 1.8, meals: ['Lunch', 'Dinner'],  subscriberCount: 20, isVerified: true,  ownerName: 'Venkat Rao'     },
  { id: 'h5', name: 'Ghar Ka Khana',        address: 'Shahpura, Bhopal',      distanceKm: 2.4, meals: ['Dinner'],           subscriberCount: 15, isVerified: false, ownerName: 'Meena Tiwari'   },
]

const HotelCard = ({ hotel, onPress, index }: { hotel: Hotel; onPress: (h: Hotel) => void; index: number }) => {
  const slideAnim = useRef(new Animated.Value(24)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start()
  }, [])

  const distLabel = hotel.distanceKm < 1
    ? `${Math.round(hotel.distanceKm * 1000)} m away`
    : `${hotel.distanceKm.toFixed(1)} km away`

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
              <Text style={styles.metaTx}>{distLabel}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTx}>{hotel.meals.join(' & ')}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTx}>{hotel.subscriberCount} members</Text>
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
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(async () => {
    setPermission('granted')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setHotels(MOCK_HOTELS)
    setLoading(false)
  }, [])

  if (permission !== 'granted') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>thali</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>thali</Text>
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
      </View>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Hotels near you</Text>
        <Text style={styles.listSub}>{hotels.length} registered · within 5 km</Text>
      </View>
      <FlatList
        data={hotels}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <HotelCard hotel={item} onPress={(h) => router.push({ pathname: '/onboarding/scan', params: { hotelId: h.id, hotelName: h.name } })} index={index} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListFooterComponent={() => <View style={{ height: spacing.xxl }} />}
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
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(40), gap: spacing.md },
  gateEmoji: { fontSize: rs(48), marginBottom: spacing.xs },
  gateTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  gateSub: { fontSize: font.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  gateBtnText: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingTx: { fontSize: font.size.base, color: colors.textSecondary },
  listHeader: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md, paddingBottom: spacing.sm },
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
})
