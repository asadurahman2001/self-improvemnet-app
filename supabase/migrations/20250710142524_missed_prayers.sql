-- Create missed_prayers table to track automatically detected missed prayers
CREATE TABLE IF NOT EXISTS missed_prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prayer_name TEXT NOT NULL,
    missed_date DATE NOT NULL,
    prayer_time TIME NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    completed_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prayer_name, missed_date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_missed_prayers_user_id ON missed_prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_missed_prayers_missed_date ON missed_prayers(missed_date);
CREATE INDEX IF NOT EXISTS idx_missed_prayers_is_completed ON missed_prayers(is_completed);

-- Add RLS policies
ALTER TABLE missed_prayers ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own missed prayers
CREATE POLICY "Users can view their own missed prayers" ON missed_prayers
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own missed prayers
CREATE POLICY "Users can insert their own missed prayers" ON missed_prayers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own missed prayers
CREATE POLICY "Users can update their own missed prayers" ON missed_prayers
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own missed prayers
CREATE POLICY "Users can delete their own missed prayers" ON missed_prayers
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically detect and insert missed prayers
CREATE OR REPLACE FUNCTION detect_missed_prayers()
RETURNS TRIGGER AS $$
DECLARE
    prayer_times RECORD;
    current_time_val TIME;
    prayer_date DATE;
BEGIN
    -- Get current time and date
    current_time_val := CURRENT_TIME;
    prayer_date := CURRENT_DATE;
    
    -- Define prayer times (can be made configurable later)
    -- Check each prayer time and see if it has passed without being completed
    
    -- Fajr (5:00 AM) - check if it's past 5 AM and prayer not completed
    IF current_time_val > '05:00:00' THEN
        INSERT INTO missed_prayers (user_id, prayer_name, missed_date, prayer_time)
        VALUES (NEW.user_id, 'Fajr', prayer_date, '05:00:00')
        ON CONFLICT (user_id, prayer_name, missed_date) DO NOTHING;
    END IF;
    
    -- Dhuhr (12:00 PM) - check if it's past 12 PM and prayer not completed
    IF current_time_val > '12:00:00' THEN
        INSERT INTO missed_prayers (user_id, prayer_name, missed_date, prayer_time)
        VALUES (NEW.user_id, 'Dhuhr', prayer_date, '12:00:00')
        ON CONFLICT (user_id, prayer_name, missed_date) DO NOTHING;
    END IF;
    
    -- Asr (4:00 PM) - check if it's past 4 PM and prayer not completed
    IF current_time_val > '16:00:00' THEN
        INSERT INTO missed_prayers (user_id, prayer_name, missed_date, prayer_time)
        VALUES (NEW.user_id, 'Asr', prayer_date, '16:00:00')
        ON CONFLICT (user_id, prayer_name, missed_date) DO NOTHING;
    END IF;
    
    -- Maghrib (6:00 PM) - check if it's past 6 PM and prayer not completed
    IF current_time_val > '18:00:00' THEN
        INSERT INTO missed_prayers (user_id, prayer_name, missed_date, prayer_time)
        VALUES (NEW.user_id, 'Maghrib', prayer_date, '18:00:00')
        ON CONFLICT (user_id, prayer_name, missed_date) DO NOTHING;
    END IF;
    
    -- Isha (8:00 PM) - check if it's past 8 PM and prayer not completed
    IF current_time_val > '20:00:00' THEN
        INSERT INTO missed_prayers (user_id, prayer_name, missed_date, prayer_time)
        VALUES (NEW.user_id, 'Isha', prayer_date, '20:00:00')
        ON CONFLICT (user_id, prayer_name, missed_date) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically detect missed prayers when a prayer is logged
CREATE TRIGGER trigger_detect_missed_prayers
    AFTER INSERT ON prayer_records
    FOR EACH ROW
    EXECUTE FUNCTION detect_missed_prayers(); 