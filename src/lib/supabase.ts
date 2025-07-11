import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  university?: string
  major?: string
  year?: string
  location?: string
  daily_study_goal: number
  sleep_goal: number
  weekly_quran_goal: number
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject: string
  duration: number
  date: string
  notes?: string
  created_at: string
}

export interface PrayerRecord {
  id: string
  user_id: string
  prayer_name: string
  prayer_type: 'jamat' | 'individual' | 'kaza'
  date: string
  time: string
  created_at: string
}

export interface QuranReading {
  id: string
  user_id: string
  pages: number
  surah: string
  verses: string
  date: string
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  type: 'good' | 'bad'
  streak: number
  last_completed: string
  category: string
  created_at: string
}

export interface ClassSchedule {
  id: string
  user_id: string
  subject: string
  time: string
  end_time: string
  location: string
  instructor: string
  day: string
  color: string
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  subject: string
  date: string
  status: 'present' | 'absent' | 'late'
  notes?: string
  created_at: string
}

export interface SleepRecord {
  id: string
  user_id: string
  bedtime: string
  wake_time: string
  duration: number
  quality: number
  date: string
  notes?: string
  created_at: string
}

export interface Exam {
  id: string
  user_id: string
  subject: string
  date: string
  time: string
  location: string
  type: string
  study_hours: number
  target_hours: number
  created_at: string
}