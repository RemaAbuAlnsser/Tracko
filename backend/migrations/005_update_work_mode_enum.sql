-- Update work_mode ENUM to include 'online' option
-- This fixes the "Data truncated for column 'work_mode'" error

ALTER TABLE Internships 
MODIFY COLUMN work_mode ENUM('remote', 'on-site', 'hybrid', 'online') DEFAULT NULL 
COMMENT 'Work mode for the internship';
