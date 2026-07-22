
-- Insert homepage sections
INSERT INTO public.homepage_sections (section_key, label, is_visible, display_order) VALUES
  ('hero', 'Hero Banner', true, 1),
  ('featured_cars', 'Featured Cars', true, 2),
  ('live_auction_ticker', 'Live Auction Ticker', true, 3),
  ('browse_by_brand', 'Browse By Brand', true, 4),
  ('browse_by_body_type', 'Browse By Body Type', true, 5),
  ('latest_listings', 'Latest Listings', true, 6),
  ('why_choose_us', 'Why Choose Us', true, 7),
  ('stats_counter', 'Stats Counter', true, 8),
  ('testimonials', 'Testimonials', true, 9),
  ('blog_news', 'Blog & News', true, 10),
  ('newsletter', 'Newsletter Signup', true, 11),
  ('sell_cta', 'Sell Your Car CTA', true, 12);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'XYZ Automobiles'),
  ('site_tagline', 'Premium Automotive Marketplace'),
  ('contact_phone', '+92 300 1234567'),
  ('contact_email', 'info@xyzautos.com'),
  ('contact_address', 'Karachi, Pakistan'),
  ('whatsapp_number', '+923001234567'),
  ('facebook_url', 'https://facebook.com'),
  ('instagram_url', 'https://instagram.com'),
  ('twitter_url', 'https://twitter.com'),
  ('youtube_url', 'https://youtube.com'),
  ('hero_headline', 'Find Your Perfect Drive'),
  ('hero_subheadline', 'Pakistan''s Premier Luxury Automotive Marketplace'),
  ('hero_cta_primary', 'Browse Inventory'),
  ('hero_cta_secondary', 'Sell Your Car'),
  ('source_code_download_enabled', 'true'),
  ('image_compression_level', 'medium'),
  ('primary_color', '220 13% 10%'),
  ('accent_color', '43 59% 44%'),
  ('default_mode', 'light'),
  ('font_family', 'Montserrat');

-- Insert default SEO settings
INSERT INTO public.seo_settings (page, meta_title, meta_description, meta_keywords) VALUES
  ('home', 'XYZ Automobiles - Premium Automotive Marketplace', 'Browse thousands of luxury and standard vehicles. Buy, sell, and auction cars in Pakistan.', 'cars, automobiles, buy car, sell car, Pakistan'),
  ('inventory', 'Car Inventory - XYZ Automobiles', 'Browse our full inventory of new and used vehicles available for sale.', 'car inventory, used cars, new cars, Pakistan'),
  ('auctions', 'Live Car Auctions - XYZ Automobiles', 'Participate in live vehicle auctions. Place bids on premium automobiles.', 'car auction, live auction, bid on cars'),
  ('sell', 'Sell Your Car - XYZ Automobiles', 'List your vehicle for sale on XYZ Automobiles. Reach thousands of buyers.', 'sell car, list vehicle, car dealer Pakistan');

-- Insert sample car brands (Pakistani market)
INSERT INTO public.car_brands (name, is_active, display_order) VALUES
  ('Toyota', true, 1),
  ('Honda', true, 2),
  ('Suzuki', true, 3),
  ('Hyundai', true, 4),
  ('KIA', true, 5),
  ('Nissan', true, 6),
  ('Mitsubishi', true, 7),
  ('BMW', true, 8),
  ('Mercedes-Benz', true, 9),
  ('Audi', true, 10),
  ('Lexus', true, 11),
  ('Land Rover', true, 12),
  ('Porsche', true, 13),
  ('Changan', true, 14),
  ('DFSK', true, 15),
  ('MG', true, 16),
  ('Haval', true, 17),
  ('FAW', true, 18),
  ('Prince', true, 19),
  ('United', true, 20),
  ('Other', true, 99);

-- Insert car models for Toyota
INSERT INTO public.car_models (brand_id, name, is_active) 
SELECT id, unnest(ARRAY['Corolla','Yaris','Camry','Prius','Land Cruiser','Fortuner','Hilux','Vitz','Aqua','Rush','Raize','Crown','86']) AS name, true FROM public.car_brands WHERE name = 'Toyota';

-- Insert car models for Honda
INSERT INTO public.car_models (brand_id, name, is_active) 
SELECT id, unnest(ARRAY['Civic','City','HR-V','BR-V','CR-V','Fit','Jazz','Accord','Freed','Stream','Vezel']) AS name, true FROM public.car_brands WHERE name = 'Honda';

-- Insert car models for Suzuki
INSERT INTO public.car_models (brand_id, name, is_active) 
SELECT id, unnest(ARRAY['Alto','Mehran','Cultus','Wagon R','Swift','Jimny','Vitara','Ciaz','Bolan','Ravi','Every']) AS name, true FROM public.car_brands WHERE name = 'Suzuki';

-- Insert car models for Hyundai
INSERT INTO public.car_models (brand_id, name, is_active) 
SELECT id, unnest(ARRAY['Tucson','Sonata','Elantra','Santa Fe','Creta','i10','i20','Porter']) AS name, true FROM public.car_brands WHERE name = 'Hyundai';

-- Insert car models for KIA
INSERT INTO public.car_models (brand_id, name, is_active) 
SELECT id, unnest(ARRAY['Sportage','Stonic','Picanto','Sorento','Carnival','Cerato','Stinger']) AS name, true FROM public.car_brands WHERE name = 'KIA';

-- Insert brand carousel entries
INSERT INTO public.brand_carousel (brand_name, display_order, is_active) VALUES
  ('Toyota', 1, true),
  ('Honda', 2, true),
  ('Suzuki', 3, true),
  ('Hyundai', 4, true),
  ('KIA', 5, true),
  ('BMW', 6, true),
  ('Mercedes-Benz', 7, true),
  ('Audi', 8, true),
  ('MG', 9, true),
  ('Haval', 10, true);

-- Insert testimonials
INSERT INTO public.testimonials (customer_name, testimonial_text, rating, display_order, is_active) VALUES
  ('Ahmed Khan', 'Found my dream Toyota Corolla at an unbeatable price. The process was seamless and the team was very helpful!', 5, 1, true),
  ('Sara Malik', 'Excellent platform! I sold my car within a week. Highly recommend XYZ Automobiles to everyone.', 5, 2, true),
  ('Usman Ali', 'The auction feature is fantastic. Won a great deal on a Honda Civic. Very transparent and fair.', 4, 3, true),
  ('Fatima Zahra', 'Best car marketplace in Pakistan. Huge selection and verified dealers. 10/10 experience!', 5, 4, true),
  ('Bilal Hassan', 'The comparison tool helped me make an informed decision. Bought a Hyundai Tucson and love it!', 5, 5, true);
