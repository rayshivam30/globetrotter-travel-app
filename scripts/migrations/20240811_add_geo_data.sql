-- Drop existing foreign key constraints that reference cities
ALTER TABLE trip_stops DROP CONSTRAINT IF EXISTS trip_stops_city_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_city_id_fkey;

-- Add new columns to cities table for better geo data
ALTER TABLE cities 
  ADD COLUMN IF NOT EXISTS geo_name_id INTEGER,
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cities_geo_name_id ON cities(geo_name_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_code ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);

-- Update cities table to use new geo data
UPDATE cities SET 
  is_active = TRUE,
  last_updated = CURRENT_TIMESTAMP
WHERE is_active IS NULL;

-- Recreate foreign key constraints with ON DELETE SET NULL
ALTER TABLE trip_stops 
  ADD CONSTRAINT trip_stops_city_id_fkey 
  FOREIGN KEY (city_id) REFERENCES cities(id) 
  ON DELETE SET NULL;

ALTER TABLE activities 
  ADD CONSTRAINT activities_city_id_fkey 
  FOREIGN KEY (city_id) REFERENCES cities(id) 
  ON DELETE CASCADE;
