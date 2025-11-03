-- Complete migration for mergevideocall branch updates
-- Run this after merging mergevideocall into videacall

-- 1. Add hours_per_week to Internship_Matches (if not exists)
ALTER TABLE Internship_Matches 
ADD COLUMN IF NOT EXISTS hours_per_week INT DEFAULT NULL 
COMMENT 'Number of hours per week the student commits to work (minimum 20)';

-- 2. Add due_date to Plan_Weeks (if not exists)
ALTER TABLE Plan_Weeks 
ADD COLUMN IF NOT EXISTS due_date DATE NULL 
COMMENT 'Due date for completing this week tasks';

-- 3. Add due_date to Internship_Plans (if not exists)
ALTER TABLE Internship_Plans 
ADD COLUMN IF NOT EXISTS due_date DATE NULL 
COMMENT 'Overall due date for the internship plan';

-- 4. Verify columns were added
SELECT 'Internship_Matches columns:' as '';
DESCRIBE Internship_Matches;

SELECT 'Plan_Weeks columns:' as '';
DESCRIBE Plan_Weeks;

SELECT 'Internship_Plans columns:' as '';
DESCRIBE Internship_Plans;

SELECT 'Notifications type enum:' as '';
SHOW COLUMNS FROM notifications WHERE Field = 'type';
