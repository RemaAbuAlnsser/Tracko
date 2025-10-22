-- Add 'application' type to notifications table
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('appointment', 'submission', 'meeting', 'general', 'application') NOT NULL DEFAULT 'general';
