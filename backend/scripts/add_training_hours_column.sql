-- Add training_hours column to University_Company_Partnerships table
-- This column stores the total number of training hours required to complete the internship

ALTER TABLE University_Company_Partnerships 
ADD COLUMN training_hours INT DEFAULT NULL 
COMMENT 'Total number of training hours required to complete the internship';
