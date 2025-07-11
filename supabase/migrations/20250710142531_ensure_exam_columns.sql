-- Ensure all required columns exist in exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS time TIME NULL;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS location TEXT NULL;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'class_test';

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS target_hours INTEGER DEFAULT 10;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS study_hours INTEGER DEFAULT 0;

-- Make sure time column is nullable
ALTER TABLE exams 
ALTER COLUMN time DROP NOT NULL; 