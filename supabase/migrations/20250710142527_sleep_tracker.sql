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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_id ON sleep_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_date ON sleep_records(date);
CREATE INDEX IF NOT EXISTS idx_sleep_records_quality ON sleep_records(quality);

-- Enable Row Level Security
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sleep_records
CREATE POLICY "Users can view their own sleep records" ON sleep_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep records" ON sleep_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep records" ON sleep_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep records" ON sleep_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sleep_records_updated_at 
  BEFORE UPDATE ON sleep_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 