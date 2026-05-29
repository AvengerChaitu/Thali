import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const fallbackUrl = 'https://injjmyibdidnvnlzqhkf.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluampteWliZGlkbnZubHpxaGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MDAwNDksImV4cCI6MjA5NTA3NjA0OX0.9lei36RGNLT2dvpGUl6rsmvK_fOE30gBxZsNuDQH5vc'

const supabaseUrl: string =
  Constants.expoConfig?.extra?.supabaseUrl ?? fallbackUrl

const supabaseAnonKey: string =
  Constants.expoConfig?.extra?.supabaseAnonKey ?? fallbackKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
