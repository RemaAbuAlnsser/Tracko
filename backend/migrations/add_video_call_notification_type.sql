-- Add video_call to notification type enum
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
  'video_call'
) NOT NULL DEFAULT 'general';
