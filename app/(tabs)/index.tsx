import { useAuthStore } from '../../src/stores/authStore'
import HomeScreen from '../../src/screens/HomeScreen'
import OwnerDashboard from '../../src/screens/OwnerDashboard'

export default function TabIndex() {
  const role = useAuthStore((s) => s.role)

  if (role === 'owner') {
    return <OwnerDashboard />
  }

  return <HomeScreen />
}
