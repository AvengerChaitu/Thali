import { useAuthStore } from '../../src/stores/authStore'
import HistoryScreen from '../../src/screens/HistoryScreen'
import MembersScreen from '../../src/screens/MembersScreen'

export default function TabHistory() {
  const role = useAuthStore((s) => s.role)

  if (role === 'owner') {
    return <MembersScreen />
  }

  return <HistoryScreen />
}
