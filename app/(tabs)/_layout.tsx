import { Tabs } from 'expo-router'
import { useAuthStore } from '../../src/stores/authStore'
import { BottomNav } from '../../BottomNav'
import type { TabKey } from '../../BottomNav'

export default function TabLayout() {
  const role = useAuthStore((s) => s.role)

  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <BottomNav
          activeTab={state.routes[state.index]?.name as TabKey}
          onTabPress={(key) => navigation.navigate(key)}
          isOwner={role === 'owner'}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="hotel" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
