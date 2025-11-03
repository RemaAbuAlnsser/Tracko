-- Update notifications type enum to include new notification types
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'general',
  'application',
  'interview',
  'acceptance',
  'rejection',
  'task_submission',
  'task_review',
  'weekly_report',
  'event',
  'video_call',
  'registration_approved',
  'registration_request',
  'task_deadline'
) NOT NULL DEFAULT 'general';

-- Show updated column
SHOW COLUMNS FROM notifications WHERE Field = 'type';
