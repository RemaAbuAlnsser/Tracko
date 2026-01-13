-- Add number_of_students column to Internships table
ALTER TABLE Internships 
ADD COLUMN number_of_students INT DEFAULT 0 NOT NULL AFTER capacity;

-- Update existing internships to count current students
UPDATE Internships i
SET number_of_students = (
    SELECT COUNT(*) 
    FROM Students s 
    WHERE s.internship_id = i.id
);

-- Show updated table structure
DESCRIBE Internships;

-- Show sample data
SELECT id, title, capacity, number_of_students FROM Internships LIMIT 5;
