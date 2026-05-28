import { create } from 'zustand'

interface OfflineAction {
  id: string
  type: 'MARK_ATTENDANCE'
  payload: Record<string, unknown>
  timestamp: number
}

interface OfflineState {
  queue: OfflineAction[]
  isOnline: boolean
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void
  removeFromQueue: (id: string) => void
  setOnline: (v: boolean) => void
  clearQueue: () => void
}

export const useOfflineStore = create<OfflineState>((set) => ({
  queue: [],
  isOnline: true,
  addToQueue: (action) =>
    set((s) => ({
      queue: [...s.queue, { ...action, id: Date.now().toString(), timestamp: Date.now() }],
    })),
  removeFromQueue: (id) =>
    set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),
  setOnline: (isOnline) => set({ isOnline }),
  clearQueue: () => set({ queue: [] }),
}))
