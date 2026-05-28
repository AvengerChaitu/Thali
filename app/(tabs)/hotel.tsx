import { useAuthStore } from '../../src/stores/authStore'
import MyHotelScreen from '../../src/screens/MyHotelScreen'
import ReportsScreen from '../../src/screens/ReportsScreen'

export default function TabHotel() {
  const role = useAuthStore((s) => s.role)

  if (role === 'owner') {
    return <ReportsScreen />
  }

  return <MyHotelScreen />
}
