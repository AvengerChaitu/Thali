import { Tabs } from 'expo-router'
import { useAuthStore } from '../../src/stores/authStore'
import { BottomNav } from '../../BottomNav'
import type { TabKey } from '../../BottomNav'

export default function TabLayout() {
  const role = useAuthStore((s) => s.role)

  return (
    <Tabs
      tabBar={({ state, navigation }) => {
        const currentName = state.routes[state.index]?.name
        const mappedTab: TabKey =
          currentName === 'index' ? 'home' :
          currentName === 'history' ? 'history' :
          currentName === 'hotel' ? 'hotel' :
          currentName === 'profile' ? 'profile' : 'home'
        return (
          <BottomNav
            activeTab={mappedTab}
            onTabPress={(key) => {
              const routeName = key === 'home' ? 'index' : key
              navigation.navigate(routeName)
            }}
            isOwner={role === 'owner'}
          />
        )
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="hotel" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
