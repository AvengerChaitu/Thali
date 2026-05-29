import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types'

interface AuthState {
  session: string | null
  user: Profile | null
  role: UserRole | null
  isLoading: boolean
  isOnboarded: boolean
  setSession: (session: string | null) => void
  setUser: (user: Profile | null) => void
  setRole: (role: UserRole | null) => void
  setOnboarded: (v: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  isLoading: true,
  isOnboarded: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user, role: user?.role ?? null }),
  setRole: (role) => set({ role }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, role: null, isLoading: true })
    await new Promise(r => setTimeout(r, 50))
    set({ isLoading: false })
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({
          session: session.access_token,
          user: profile as Profile,
          role: (profile as Profile)?.role ?? null,
          isOnboarded: !!profile,
        })
      }
    } catch {
      // No session
    } finally {
      set({ isLoading: false })
    }
  },
}))
