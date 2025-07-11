/*
  # Initial Schema for Islamic Self-Improvement Tracker

  1. New Tables
    - `profiles` - User profile information
    - `study_sessions` - Study tracking records
    - `prayer_records` - Prayer completion tracking
    - `quran_readings` - Quran reading progress
    - `habits` - Good and bad habit tracking
    - `class_schedules` - Class routine management
    - `attendance_records` - Class attendance tracking
    - `sleep_records` - Sleep pattern tracking
    - `exams` - Exam countdown and preparation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  university text,
  major text,
  year text,
  location text,
  daily_study_goal integer DEFAULT 6,
  sleep_goal integer DEFAULT 8,
  weekly_quran_goal integer DEFAULT 14,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  duration numeric NOT NULL,
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create prayer_records table
CREATE TABLE IF NOT EXISTS prayer_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_name text NOT NULL,
  prayer_type text NOT NULL CHECK (prayer_type IN ('jamat', 'individual', 'kaza')),
  date date NOT NULL,
  time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prayer_name, date)
);

-- Create quran_readings table
CREATE TABLE IF NOT EXISTS quran_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pages integer NOT NULL,
  surah text NOT NULL,
  verses text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('good', 'bad')),
  streak integer DEFAULT 0,
  last_completed date,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create class_schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  instructor text NOT NULL,
  day text NOT NULL CHECK (day IN ('Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday')),
  color text DEFAULT 'bg-blue-500',
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subject, date)
);

-- Create sleep_records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bedtime time NOT NULL,
  wake_time time NOT NULL,
  duration numeric NOT NULL,
  quality integer NOT NULL CHECK (quality >= 1 AND quality <= 5),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  study_hours numeric DEFAULT 0,
  target_hours numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for study_sessions
CREATE POLICY "Users can manage own study sessions"
  ON study_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for prayer_records
CREATE POLICY "Users can manage own prayer records"
  ON prayer_records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for quran_readings
CREATE POLICY "Users can manage own quran readings"
  ON quran_readings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for habits
CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for class_schedules
CREATE POLICY "Users can manage own class schedules"
  ON class_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for attendance_records
CREATE POLICY "Users can manage own attendance records"
  ON attendance_records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for sleep_records
CREATE POLICY "Users can manage own sleep records"
  ON sleep_records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for exams
CREATE POLICY "Users can manage own exams"
  ON exams FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();