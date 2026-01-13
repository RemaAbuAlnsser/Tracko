-- Add LinkedIn and GitHub URL columns to Trainers table
ALTER TABLE Trainers 
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) AFTER bio,
ADD COLUMN IF NOT EXISTS github_url VARCHAR(255) AFTER linkedin_url;

-- Display updated table structure
DESCRIBE Trainers;

-- Show sample data
SELECT id, user_id, specialization, linkedin_url, github_url FROM Trainers LIMIT 5;
