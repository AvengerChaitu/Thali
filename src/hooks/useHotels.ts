import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Hotel } from '../types'

export function useNearbyHotels(lat: number, lng: number, radiusKm = 5) {
  return useQuery({
    queryKey: ['hotels', 'nearby', lat, lng, radiusKm],
    queryFn: async () => {
      const { data } = await supabase.rpc('nearby_hotels', {
        lat,
        lng,
        radius_km: radiusKm,
      })
      return data as (Hotel & { distance_km: number; subscriber_count: number })[]
    },
    enabled: !!lat && !!lng,
  })
}

export function useHotelById(id: string) {
  return useQuery({
    queryKey: ['hotels', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .single()
      return data as Hotel
    },
    enabled: !!id,
  })
}
