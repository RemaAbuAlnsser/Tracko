-- Add coordinator_name column to Company table
ALTER TABLE Company
ADD COLUMN coordinator_name VARCHAR(255) DEFAULT NULL COMMENT 'Training coordinator name for the company';
