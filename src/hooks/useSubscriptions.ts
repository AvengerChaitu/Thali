import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Subscription } from '../types'

export function useMySubscriptions() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, hotels(name)')
        .eq('user_id', userId)
        .eq('is_active', true)
      return data as (Subscription & { hotels: { name: string } })[]
    },
    enabled: !!userId,
  })
}
