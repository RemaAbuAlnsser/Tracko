-- Add min_gpa and work_mode columns to Internships table
ALTER TABLE Internships
ADD COLUMN min_gpa DECIMAL(3,2) DEFAULT NULL COMMENT 'Minimum GPA requirement (e.g., 3.50)',
ADD COLUMN work_mode ENUM('remote', 'on-site', 'hybrid') DEFAULT NULL COMMENT 'Work mode for the internship';
