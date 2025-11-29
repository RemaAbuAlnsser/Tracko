-- Add hours_per_week column to Internship_Matches table
-- This column stores the number of hours per week the student commits to work on the internship
-- Minimum value is 20 hours per week

ALTER TABLE Internship_Matches 
ADD COLUMN hours_per_week INT DEFAULT NULL 
COMMENT 'Number of hours per week the student commits to work (minimum 20)';

-- Add a check constraint to ensure hours_per_week is at least 20 if provided
ALTER TABLE Internship_Matches 
ADD CONSTRAINT chk_hours_per_week CHECK (hours_per_week IS NULL OR hours_per_week >= 20);
