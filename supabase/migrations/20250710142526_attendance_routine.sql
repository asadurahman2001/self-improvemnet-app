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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_subject ON attendance_records(subject);

CREATE INDEX IF NOT EXISTS idx_class_schedules_user_id ON class_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day);
CREATE INDEX IF NOT EXISTS idx_class_schedules_time ON class_schedules(time);

-- Enable Row Level Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attendance_records
CREATE POLICY "Users can view their own attendance records" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance records" ON attendance_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for class_schedules
CREATE POLICY "Users can view their own class schedules" ON class_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own class schedules" ON class_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own class schedules" ON class_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own class schedules" ON class_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_attendance_records_updated_at 
  BEFORE UPDATE ON attendance_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at 
  BEFORE UPDATE ON class_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 