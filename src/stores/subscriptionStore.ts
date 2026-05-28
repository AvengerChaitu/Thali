import { create } from 'zustand'
import type { Subscription, Hotel } from '../types'

interface SubscriptionState {
  activeSubscription: Subscription | null
  activeHotel: Hotel | null
  setActiveSubscription: (sub: Subscription | null) => void
  setActiveHotel: (hotel: Hotel | null) => void
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  activeSubscription: null,
  activeHotel: null,
  setActiveSubscription: (activeSubscription) => set({ activeSubscription }),
  setActiveHotel: (activeHotel) => set({ activeHotel }),
}))
