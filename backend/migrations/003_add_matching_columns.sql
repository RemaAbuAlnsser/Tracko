-- Add new columns to Internship_Matches table
ALTER TABLE Internship_Matches
ADD COLUMN gpa_match BOOLEAN DEFAULT NULL,
ADD COLUMN gpa_message TEXT DEFAULT NULL,
ADD COLUMN work_mode_match BOOLEAN DEFAULT NULL,
ADD COLUMN work_mode_message TEXT DEFAULT NULL;
