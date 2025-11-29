-- Add completed_hours column to Internship_Matches table
-- This column tracks the total hours completed by the student
-- Initial value is 0, increases by hours_per_week each time student submits a task

ALTER TABLE Internship_Matches 
ADD COLUMN completed_hours INT DEFAULT 0 
COMMENT 'Total training hours completed by the student';
