-- Add domain column to Universities table
ALTER TABLE Universities 
ADD COLUMN domain VARCHAR(255) NULL AFTER email;

-- Update existing universities to extract domain from email
UPDATE Universities 
SET domain = SUBSTRING_INDEX(email, '@', -1) 
WHERE email IS NOT NULL AND email != '';

-- Show updated table
SELECT id, name, email, domain FROM Universities;
