-- Add show_contact_type column to cars table
ALTER TABLE cars ADD COLUMN show_contact_type text NOT NULL DEFAULT 'admin' CHECK (show_contact_type IN ('admin', 'dealer'));

-- Ensure car_brands has country_of_origin
ALTER TABLE car_brands ADD COLUMN IF NOT EXISTS country_of_origin text;
ALTER TABLE car_brands ADD COLUMN IF NOT EXISTS brand_type text DEFAULT 'other';
