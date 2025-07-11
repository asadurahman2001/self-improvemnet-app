-- Add notes column to exams table if it doesn't exist
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS notes TEXT; 