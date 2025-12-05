-- Update one of student 13's applications to 'accepted' for testing
UPDATE Internship_Matches 
SET status = 'accepted' 
WHERE student_id = 13 AND id = 1992;

-- To check the result:
SELECT * FROM Internship_Matches WHERE student_id = 13;
