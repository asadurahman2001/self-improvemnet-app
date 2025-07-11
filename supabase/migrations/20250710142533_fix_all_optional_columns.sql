-- Fix all optional columns to be nullable
ALTER TABLE exams 
ALTER COLUMN time DROP NOT NULL;

ALTER TABLE exams 
ALTER COLUMN location DROP NOT NULL;

ALTER TABLE exams 
ALTER COLUMN notes DROP NOT NULL; 