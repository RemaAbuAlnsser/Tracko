-- Add weekly_report and weekly_report_review to notification types
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'general',
  'task_submission',
  'task_review',
  'weekly_report',
  'weekly_report_review',
  'plan_assigned',
  'schedule',
  'message',
  'application',
  'training_complete'
) DEFAULT 'general';
