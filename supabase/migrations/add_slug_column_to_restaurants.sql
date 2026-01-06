-- Add slug column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

-- Backfill slugs for existing restaurants
DO $$
DECLARE
    r RECORD;
    new_slug TEXT;
    base_slug TEXT;
    counter INT;
BEGIN
    FOR r IN SELECT id, name FROM restaurants WHERE slug IS NULL OR slug = ''
    LOOP
        -- Generate base slug from name
        base_slug := LOWER(REGEXP_REPLACE(r.name, '[^a-zA-Z0-9\s-]', '', 'g'));
        base_slug := REGEXP_REPLACE(base_slug, '[\s_]+', '-', 'g');
        base_slug := TRIM(BOTH '-' FROM base_slug);
        
        -- If slug is empty, use 'restaurant'
        IF base_slug = '' THEN
            base_slug := 'restaurant';
        END IF;
        
        -- Check for uniqueness
        new_slug := base_slug;
        counter := 1;
        
        WHILE EXISTS (SELECT 1 FROM restaurants WHERE slug = new_slug AND id != r.id) LOOP
            counter := counter + 1;
            new_slug := base_slug || '-' || counter;
        END LOOP;
        
        -- Update the restaurant with the new slug
        UPDATE restaurants SET slug = new_slug WHERE id = r.id;
        
        RAISE NOTICE 'Generated slug for restaurant %: %', r.name, new_slug;
    END LOOP;
END $$;

-- Verify results
SELECT id, name, slug FROM restaurants ORDER BY created_at DESC LIMIT 10;

