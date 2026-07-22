
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS dealership_id uuid REFERENCES dealerships(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_dealership ON inquiries(dealership_id);
ALTER TABLE inquiries DROP COLUMN IF EXISTS in_progress;
