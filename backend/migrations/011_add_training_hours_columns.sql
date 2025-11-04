-- Add training hours tracking columns
-- These columns are part of the mergevideocall branch features

-- 1. Add training_hours to University_Company_Partnerships
-- This stores the total required training hours for the partnership
ALTER TABLE University_Company_Partnerships 
ADD COLUMN IF NOT EXISTS training_hours INT DEFAULT NULL 
COMMENT 'Total number of training hours required to complete the internship';

-- 2. Add completed_hours to Internship_Matches
-- This tracks the hours completed by each student
ALTER TABLE Internship_Matches 
ADD COLUMN IF NOT EXISTS completed_hours INT DEFAULT 0 
COMMENT 'Total training hours completed by the student';

-- Verify the changes
SELECT 'University_Company_Partnerships columns:' as '';
DESCRIBE University_Company_Partnerships;

SELECT 'Internship_Matches columns:' as '';
DESCRIBE Internship_Matches;
