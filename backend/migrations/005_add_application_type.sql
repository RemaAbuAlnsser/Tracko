-- Add 'application' type to Notifications table
ALTER TABLE Notifications 
MODIFY COLUMN type ENUM('appointment', 'submission', 'meeting', 'general', 'application') NOT NULL DEFAULT 'general';
