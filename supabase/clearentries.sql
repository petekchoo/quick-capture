-- Clear all entries from all tables while preserving table structures and policies
-- This script is for testing purposes only

-- Disable triggers temporarily to avoid any potential issues
SET session_replication_role = 'replica';

-- Clear entries in order of dependencies
DELETE FROM entry_metadata;
DELETE FROM time_frames;
DELETE FROM entry_prefixes;
DELETE FROM prefixes;
DELETE FROM entries;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences if they exist
ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS prefixes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS time_frames_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS entry_metadata_id_seq RESTART WITH 1;

-- Output confirmation
SELECT 'All entries cleared successfully' as message; 