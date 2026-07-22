
-- 1. Add missing columns to cars
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS engine_capacity text,
  ADD COLUMN IF NOT EXISTS dealership_name text;

-- city is already registration_city alias - handled in types

-- 2. Add missing columns to auctions
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS car_images text[];

-- starting_price / current_price handled as aliases in types (starting_bid / current_bid)

-- 3. Add missing columns to testimonials
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS customer_title text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 4. Add missing columns to homepage_sections
ALTER TABLE homepage_sections
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 5. Add page_key to seo_settings
ALTER TABLE seo_settings
  ADD COLUMN IF NOT EXISTS page_key text;

UPDATE seo_settings SET page_key = page WHERE page_key IS NULL;

-- 6. Add country_of_origin to car_brands
ALTER TABLE car_brands
  ADD COLUMN IF NOT EXISTS country_of_origin text;

-- 7. Add notes to inquiries (actual table name)
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS notes text;

-- 8. Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  cta_label text DEFAULT 'Browse Inventory',
  cta_url text DEFAULT '/inventory',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Seed homepage_sections if not already populated
INSERT INTO homepage_sections (section_key, label, is_visible, is_active, display_order)
VALUES
  ('hero',          'Hero Banner',       true, true, 1),
  ('featured_cars', 'Featured Cars',     true, true, 2),
  ('auctions',      'Live Auctions',     true, true, 3),
  ('brands',        'Brand Carousel',    true, true, 4),
  ('stats',         'Platform Stats',    true, true, 5),
  ('testimonials',  'Testimonials',      true, true, 6),
  ('dealerships',   'Top Dealerships',   true, true, 7),
  ('why_us',        'Why Choose Us',     true, true, 8),
  ('blog',          'Latest Blog Posts', true, true, 9),
  ('cta',           'Call to Action',    true, true, 10)
ON CONFLICT (section_key) DO NOTHING;

-- 10. Enable RLS on hero_banners
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active hero banners"
  ON hero_banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage hero banners"
  ON hero_banners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
