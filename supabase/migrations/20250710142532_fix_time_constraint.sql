-- Make time column nullable since it's optional
ALTER TABLE exams 
ALTER COLUMN time DROP NOT NULL; 