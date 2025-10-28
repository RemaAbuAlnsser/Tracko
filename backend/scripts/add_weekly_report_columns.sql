-- Add columns to support weekly reports in Task_Submissions table

-- Add week_number column
ALTER TABLE Task_Submissions 
ADD COLUMN week_number INT NULL AFTER task_title;

-- Add task_type column
ALTER TABLE Task_Submissions 
ADD COLUMN task_type ENUM('task', 'weekly_report') DEFAULT 'task' AFTER week_number;

-- Modify existing columns to allow NULL (for weekly reports)
ALTER TABLE Task_Submissions 
MODIFY COLUMN trainer_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN week_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN plan_id INT NULL;

ALTER TABLE Task_Submissions 
MODIFY COLUMN task_title VARCHAR(255) NULL;

-- Add indexes
CREATE INDEX idx_task_type ON Task_Submissions(task_type);
CREATE INDEX idx_week_number ON Task_Submissions(week_number);
