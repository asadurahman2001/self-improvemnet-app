-- Create quran_readings table
CREATE TABLE IF NOT EXISTS quran_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pages INTEGER NOT NULL,
    surah TEXT,
    verses TEXT,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quran_bookmarks table
CREATE TABLE IF NOT EXISTS quran_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    surah TEXT NOT NULL,
    verse TEXT,
    page TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, surah)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quran_readings_user_date ON quran_readings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quran_bookmarks_user ON quran_bookmarks(user_id);

-- Enable RLS
ALTER TABLE quran_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quran readings" ON quran_readings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quran readings" ON quran_readings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quran readings" ON quran_readings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quran readings" ON quran_readings
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quran bookmarks" ON quran_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quran bookmarks" ON quran_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quran bookmarks" ON quran_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quran bookmarks" ON quran_bookmarks
    FOR DELETE USING (auth.uid() = user_id); 