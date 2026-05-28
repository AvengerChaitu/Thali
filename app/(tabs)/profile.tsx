import { useAuthStore } from '../../src/stores/authStore'
import ProfileScreen from '../../src/screens/ProfileScreen'
import SettingsScreen from '../../src/screens/SettingsScreen'

export default function TabProfile() {
  const role = useAuthStore((s) => s.role)

  if (role === 'owner') {
    return <SettingsScreen />
  }

  return <ProfileScreen />
}
