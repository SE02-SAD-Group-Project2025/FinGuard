-- Add profile_photo column to users table
-- Run this in your PostgreSQL database

-- Check if column exists first, then add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' and column_name='profile_photo'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255);
        RAISE NOTICE 'Column profile_photo added to users table';
    ELSE
        RAISE NOTICE 'Column profile_photo already exists in users table';
    END IF;
END $$;