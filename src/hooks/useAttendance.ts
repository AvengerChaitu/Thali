import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Attendance, DayStats, DashboardSubscriber } from '../types'

export function useTodayAttendance(hotelId: string) {
  const userId = useAuthStore((s) => s.user?.id)
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['attendance', 'today', hotelId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('date', today)
      return data as Attendance[]
    },
    enabled: !!userId && !!hotelId,
  })
}

export function useMyAttendance(subscriptionId: string) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['attendance', 'mine', subscriptionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('date', { ascending: false })
        .limit(30)
      return data as Attendance[]
    },
    enabled: !!userId && !!subscriptionId,
  })
}

export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      hotelId,
      mealType,
      status,
    }: {
      subscriptionId: string
      hotelId: string
      mealType: string
      status: 'coming' | 'absent'
    }) => {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('attendance').upsert(
        {
          subscription_id: subscriptionId,
          hotel_id: hotelId,
          date: today,
          meal_type: mealType,
          status,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'subscription_id,date,meal_type' }
      )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useOwnerDashboard(hotelId: string, mealType: string) {
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['dashboard', hotelId, today, mealType],
    queryFn: async () => {
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*, profiles!inner(name)')
        .eq('hotel_id', hotelId)
        .eq('date', today)
        .eq('meal_type', mealType)

      const records = (attendanceData ?? []) as any[]

      const stats: DayStats = {
        total: records.length,
        coming: records.filter((r: any) => r.status === 'coming').length,
        absent: records.filter((r: any) => r.status === 'absent').length,
        pending: records.filter((r: any) => r.status === 'pending').length,
        cutoffTime: new Date(),
      }

      const subscribers: DashboardSubscriber[] = records.map((r: any) => ({
        id: r.user_id,
        name: r.profiles?.name ?? '',
        status: r.status,
        markedAt: r.marked_at ?? undefined,
        avatarInitials: (r.profiles?.name ?? 'U')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }))

      return { stats, subscribers }
    },
    enabled: !!hotelId,
  })
}
