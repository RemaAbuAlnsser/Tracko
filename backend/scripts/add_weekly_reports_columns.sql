-- Add missing columns to Weekly_Reports table
-- Run each ALTER statement separately, ignore errors if column exists

-- Add trainer_id
ALTER TABLE Weekly_Reports 
ADD COLUMN trainer_id INT NULL AFTER student_id;

-- Add plan_id
ALTER TABLE Weekly_Reports
ADD COLUMN plan_id INT NULL AFTER trainer_id;

-- Add foreign keys
ALTER TABLE Weekly_Reports
ADD CONSTRAINT fk_weekly_reports_trainer 
FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL;

ALTER TABLE Weekly_Reports
ADD CONSTRAINT fk_weekly_reports_plan
FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_weekly_reports_trainer_id ON Weekly_Reports(trainer_id);
CREATE INDEX idx_weekly_reports_plan_id ON Weekly_Reports(plan_id);
