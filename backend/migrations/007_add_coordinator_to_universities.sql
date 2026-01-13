-- Add coordinator_name column to Universities table
ALTER TABLE `Universities`
ADD COLUMN coordinator_name VARCHAR(255) DEFAULT NULL COMMENT 'Training coordinator name for the university';
