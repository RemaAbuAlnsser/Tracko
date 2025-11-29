-- Add data column to notifications table for storing video call and other metadata

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data TEXT AFTER type;

-- Update description
COMMENT ON COLUMN notifications.data IS 'JSON data for additional notification information (e.g., video call links, room IDs)';
