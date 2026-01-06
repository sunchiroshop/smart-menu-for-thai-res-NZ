-- Add is_active column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Set first restaurant of each user as active
DO $$
DECLARE
    r RECORD;
BEGIN
    -- For each user, set their first restaurant (oldest) as active
    FOR r IN 
        SELECT DISTINCT user_id 
        FROM restaurants 
        WHERE is_active IS NULL OR is_active = FALSE
    LOOP
        -- Get first restaurant ID for this user
        UPDATE restaurants
        SET is_active = TRUE
        WHERE id = (
            SELECT id 
            FROM restaurants 
            WHERE user_id = r.user_id 
            ORDER BY created_at ASC 
            LIMIT 1
        );
        
        RAISE NOTICE 'Set active restaurant for user %', r.user_id;
    END LOOP;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(user_id, is_active) WHERE is_active = TRUE;

-- Verify
SELECT id, name, user_id, slug, is_active FROM restaurants ORDER BY user_id, created_at;

