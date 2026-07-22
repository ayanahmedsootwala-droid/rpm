
-- Add registration_year column (was missing, causing insert failure)
ALTER TABLE cars ADD COLUMN registration_year integer;

-- Backfill existing rows: use year as default registration year
UPDATE cars SET registration_year = year WHERE registration_year IS NULL;

-- Add an index for filtering
CREATE INDEX IF NOT EXISTS idx_cars_registration_year ON cars (registration_year);
