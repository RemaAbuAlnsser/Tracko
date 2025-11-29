-- Add university_id and university_approved columns to Weekly_Reports table
ALTER TABLE Weekly_Reports 
ADD COLUMN university_id INT NULL AFTER trainer_id,
ADD COLUMN university_approved BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN university_comment TEXT NULL AFTER trainer_comment,
ADD COLUMN university_reviewed_at TIMESTAMP NULL AFTER reviewed_at,
ADD FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE SET NULL;

-- Add index for university_id
CREATE INDEX idx_university_id ON Weekly_Reports(university_id);
