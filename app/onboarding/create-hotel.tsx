import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import MapView, { Marker, type MapPressEvent } from 'react-native-maps'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/authStore'
import { colors, spacing, font, radius, layout, shadow, rs } from '../../tokens'

export default function CreateHotelScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const mapRef = useRef<MapView>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [marker, setMarker] = useState({ latitude: 23.2599, longitude: 77.4126 })
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setMarker(loc)
        }
      } catch {} finally {
        setLoadingLocation(false)
      }
    })()
  }, [])

  const handleMapPress = (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate
    setMarker({ latitude: coord.latitude, longitude: coord.longitude })
    mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 300)
  }

  const handleMarkerDragEnd = (e: any) => {
    const coord = e.nativeEvent.coordinate
    setMarker({ latitude: coord.latitude, longitude: coord.longitude })
  }

  const handleSubmit = async () => {
    const cleanName = name.trim()
    const cleanAddress = address.trim()
    if (!cleanName) { Alert.alert('Required', 'Enter hotel name'); return }
    if (!cleanAddress) { Alert.alert('Required', 'Enter hotel address'); return }
    if (!userId) { Alert.alert('Error', 'Not authenticated'); return }

    setSubmitting(true)
    try {
      const { data: hotelId, error } = await supabase.rpc('create_hotel', {
        owner_id: userId,
        name: cleanName,
        address: cleanAddress,
        lat: marker.latitude,
        lng: marker.longitude,
      })
      if (error) throw error
      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create hotel')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/onboarding/role')}>
          <Text style={styles.backTx}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register your hotel</Text>
        <View style={{ width: layout.touchTarget }} />
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Hotel name"
          placeholderTextColor={colors.textHint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor={colors.textHint}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />

        <Text style={styles.mapLabel}>Tap on the map to drop a pin (or drag to adjust)</Text>
        {loadingLocation ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.mapPlaceholderTx}>Getting your location…</Text>
          </View>
        ) : (
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{ ...marker, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={handleMarkerDragEnd}
                title="Your hotel"
              />
            </MapView>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitTx}>{submitting ? 'Creating…' : 'Register hotel'}</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: { minHeight: layout.touchTarget, justifyContent: 'center', width: layout.touchTarget },
  backTx: { fontSize: font.size.base, color: colors.primary, fontWeight: font.weight.medium },
  headerTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  form: { flex: 1, padding: layout.screenPadding, gap: spacing.md },
  input: {
    height: layout.touchTarget,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, fontSize: font.size.base,
    backgroundColor: colors.surface, color: colors.textPrimary,
  },
  mapLabel: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.medium },
  mapPlaceholder: { height: 200, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  mapPlaceholderTx: { fontSize: font.size.sm, color: colors.textHint },
  mapWrap: { height: 220, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  map: { width: '100%', height: '100%' },
  submitBtn: {
    height: layout.touchTarget, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  btnDisabled: { opacity: 0.5 },
  submitTx: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
})
