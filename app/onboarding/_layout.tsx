import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="role" />
      <Stack.Screen name="create-hotel" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="find" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  )
}
