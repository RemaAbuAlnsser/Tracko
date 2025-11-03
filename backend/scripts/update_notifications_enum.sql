-- Add new notification types to the notifications table
-- Add: task_deadline, task_submission, task_review, training_completion

ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'appointment', 
  'submission', 
  'meeting', 
  'general', 
  'training_plan', 
  'training_report', 
  'application',
  'task_deadline',
  'task_submission',
  'task_review',
  'training_completion'
) NOT NULL DEFAULT 'general';
