export type UserRole = 'subscriber' | 'owner'

export type AttendanceStatus = 'pending' | 'coming' | 'absent'
export type MealType = 'lunch' | 'dinner'

export interface Profile {
  id: string
  phone: string
  name: string
  role: UserRole
  avatarInitials: string
  language: 'en' | 'hi'
  createdAt: string
}

export interface Hotel {
  id: string
  ownerId: string
  name: string
  address: string
  location: { lat: number; lng: number }
  isVerified: boolean
  qrCode: string
  createdAt: string
}

export interface MealSlot {
  id: string
  hotelId: string
  mealType: MealType
  startTime: string
  cutoffTime: string
  isActive: boolean
}

export interface Subscription {
  id: string
  userId: string
  hotelId: string
  hotelName: string
  mealType: MealType
  totalMeals: number
  mealsUsed: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Attendance {
  id: string
  subscriptionId: string
  userId: string
  hotelId: string
  date: string
  mealType: MealType
  status: AttendanceStatus
  markedAt: string | null
}

export interface DayStats {
  total: number
  coming: number
  absent: number
  pending: number
  cutoffTime: Date
}

export interface DashboardSubscriber {
  id: string
  name: string
  status: AttendanceStatus
  markedAt?: string
  avatarInitials: string
}
