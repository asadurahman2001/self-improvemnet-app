-- Complete database setup for Self Improvement App
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  university TEXT,
  major TEXT,
  year TEXT CHECK (year IN ('1st', '2nd', '3rd', '4th')),
  location TEXT,
  timezone TEXT DEFAULT 'UTC+2',
  daily_study_goal INTEGER DEFAULT 6,
  sleep_goal INTEGER DEFAULT 8,
  weekly_quran_goal INTEGER DEFAULT 14,
  phone TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  duration DECIMAL(4,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prayer_records table
CREATE TABLE IF NOT EXISTS prayer_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prayer_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quran_sessions table
CREATE TABLE IF NOT EXISTS quran_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  pages_read INTEGER NOT NULL,
  time_spent INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habit_records table
CREATE TABLE IF NOT EXISTS habit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_name TEXT NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  instructor TEXT,
  day TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sleep_records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  bedtime TIME NOT NULL,
  wake_time TIME NOT NULL,
  duration DECIMAL(3,1) NOT NULL,
  quality INTEGER CHECK (quality >= 1 AND quality <= 5) NOT NULL DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_prayer_records_user_id ON prayer_records(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_records_date ON prayer_records(date);
CREATE INDEX IF NOT EXISTS idx_quran_sessions_user_id ON quran_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quran_sessions_date ON quran_sessions(date);
CREATE INDEX IF NOT EXISTS idx_habit_records_user_id ON habit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_records_date ON habit_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_subject ON attendance_records(subject);
CREATE INDEX IF NOT EXISTS idx_class_schedules_user_id ON class_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day);
CREATE INDEX IF NOT EXISTS idx_class_schedules_time ON class_schedules(time);
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_id ON sleep_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_date ON sleep_records(date);
CREATE INDEX IF NOT EXISTS idx_sleep_records_quality ON sleep_records(quality);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study sessions" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for prayer_records
CREATE POLICY "Users can view their own prayer records" ON prayer_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prayer records" ON prayer_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prayer records" ON prayer_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prayer records" ON prayer_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for quran_sessions
CREATE POLICY "Users can view their own quran sessions" ON quran_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quran sessions" ON quran_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quran sessions" ON quran_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quran sessions" ON quran_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for habit_records
CREATE POLICY "Users can view their own habit records" ON habit_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habit records" ON habit_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habit records" ON habit_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit records" ON habit_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for attendance_records
CREATE POLICY "Users can view their own attendance records" ON attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attendance records" ON attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance records" ON attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attendance records" ON attendance_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for class_schedules
CREATE POLICY "Users can view their own class schedules" ON class_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own class schedules" ON class_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own class schedules" ON class_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own class schedules" ON class_schedules FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sleep_records
CREATE POLICY "Users can view their own sleep records" ON sleep_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sleep records" ON sleep_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep records" ON sleep_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep records" ON sleep_records FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for exams
CREATE POLICY "Users can view their own exams" ON exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exams" ON exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exams" ON exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exams" ON exams FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sleep_records_updated_at BEFORE UPDATE ON sleep_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 