-- Remove prayer configuration tables since we now use built-in prayer times
-- This migration removes the tables that are no longer needed

-- Drop the function that was used for prayer times
DROP FUNCTION IF EXISTS get_user_prayer_times(UUID);

-- Drop user_prayer_settings table
DROP TABLE IF EXISTS user_prayer_settings;

-- Drop prayer_config table
DROP TABLE IF EXISTS prayer_config;

-- Note: We keep the following tables as they are still used:
-- - prayer_records (for tracking daily prayer completions)
-- - missed_prayers (for tracking missed prayers)
-- - All other tables remain unchanged 