-- Update existing partnerships that don't have training_hours set
-- Set default value of 300 hours for all NULL training_hours

UPDATE University_Company_Partnerships 
SET training_hours = 300 
WHERE training_hours IS NULL;
