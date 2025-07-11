-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NULL,
    location TEXT NULL,
    type TEXT DEFAULT 'class_test',
    target_hours INTEGER DEFAULT 10,
    study_hours INTEGER DEFAULT 0,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_user_date ON exams(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exams_user_type ON exams(user_id, type);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exams" ON exams;
DROP POLICY IF EXISTS "Users can insert their own exams" ON exams;
DROP POLICY IF EXISTS "Users can update their own exams" ON exams;
DROP POLICY IF EXISTS "Users can delete their own exams" ON exams;

-- Create RLS policies
CREATE POLICY "Users can view their own exams" ON exams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams" ON exams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams" ON exams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams" ON exams
    FOR DELETE USING (auth.uid() = user_id); 