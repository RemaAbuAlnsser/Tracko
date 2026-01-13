-- Migration script to update Task_Submissions table to support weekly reports
-- This adds the necessary columns and modifies existing constraints

-- Add new columns if they don't exist
ALTER TABLE Task_Submissions 
ADD COLUMN IF NOT EXISTS week_number INT NULL AFTER task_title;

ALTER TABLE Task_Submissions 
ADD COLUMN IF NOT EXISTS task_type ENUM('task', 'weekly_report') DEFAULT 'task' AFTER week_number;

-- Modify existing columns to allow NULL (for weekly reports that don't need these fields)
ALTER TABLE Task_Submissions 
MODIFY COLUMN trainer_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN week_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN plan_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN task_title VARCHAR(255) NULL;

-- Add index for task_type
ALTER TABLE Task_Submissions 
ADD INDEX IF NOT EXISTS idx_task_type (task_type);

-- Add index for week_number
ALTER TABLE Task_Submissions 
ADD INDEX IF NOT EXISTS idx_week_number (week_number);
