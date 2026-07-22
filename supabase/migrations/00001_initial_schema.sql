
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'dealership_manager', 'dealership_salesperson', 'dealership_viewer');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'user',
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-sync trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (NEW.id, NEW.email, NEW.phone, 'user'::public.user_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for role check
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

-- Profiles RLS
CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

CREATE VIEW public.public_profiles AS SELECT id, full_name, avatar_url, role FROM public.profiles;

-- Dealerships
CREATE TABLE public.dealerships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  logo_url text,
  description text,
  website text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active dealerships" ON public.dealerships
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access to dealerships" ON public.dealerships
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Dealership members
CREATE TABLE public.dealership_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'dealership_viewer',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dealership_id, user_id)
);

ALTER TABLE public.dealership_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to dealership members" ON public.dealership_members
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "Members view own dealership members" ON public.dealership_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    dealership_id IN (SELECT dealership_id FROM public.dealership_members WHERE user_id = auth.uid())
  );

-- Car brands
CREATE TABLE public.car_brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read car brands" ON public.car_brands FOR SELECT USING (true);
CREATE POLICY "Admins manage car brands" ON public.car_brands FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Car models
CREATE TABLE public.car_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read car models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Admins manage car models" ON public.car_models FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Car variants
CREATE TABLE public.car_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id uuid NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_id, name)
);

ALTER TABLE public.car_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read car variants" ON public.car_variants FOR SELECT USING (true);
CREATE POLICY "Admins manage car variants" ON public.car_variants FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Cars table
CREATE TABLE public.cars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  brand_id uuid REFERENCES public.car_brands(id),
  model_id uuid REFERENCES public.car_models(id),
  variant_id uuid REFERENCES public.car_variants(id),
  brand_name text,
  model_name text,
  variant_name text,
  year integer NOT NULL,
  price numeric(12,2) NOT NULL,
  is_negotiable boolean NOT NULL DEFAULT false,
  mileage integer,
  condition text,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  drive_type text,
  doors integer,
  seating_capacity integer,
  cylinders integer,
  engine_size text,
  assembly text,
  is_imported boolean NOT NULL DEFAULT false,
  registration_city text,
  description text,
  features text[],
  images text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','sold','reserved','rejected')),
  is_featured boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  dealership_id uuid REFERENCES public.dealerships(id),
  seller_id uuid REFERENCES public.profiles(id),
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active/sold cars" ON public.cars
  FOR SELECT USING (status IN ('active', 'sold', 'reserved'));

CREATE POLICY "Admins full access to cars" ON public.cars
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

CREATE POLICY "Dealership members manage own cars" ON public.cars
  FOR ALL TO authenticated USING (
    dealership_id IN (SELECT dealership_id FROM public.dealership_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Users manage own submitted cars" ON public.cars
  FOR ALL TO authenticated USING (seller_id = auth.uid());

-- Car version history
CREATE TABLE public.car_version_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.car_version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view car history" ON public.car_version_history FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);
CREATE POLICY "Dealership members view own car history" ON public.car_version_history FOR SELECT TO authenticated USING (
  car_id IN (SELECT id FROM public.cars WHERE dealership_id IN (SELECT dealership_id FROM public.dealership_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Insert car history" ON public.car_version_history FOR INSERT TO authenticated WITH CHECK (true);

-- Inquiries
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid REFERENCES public.cars(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','responded','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public submit inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own inquiries" ON public.inquiries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins full access to inquiries" ON public.inquiries FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);
CREATE POLICY "Dealership members view own inquiries" ON public.inquiries FOR SELECT TO authenticated USING (
  car_id IN (SELECT id FROM public.cars WHERE dealership_id IN (SELECT dealership_id FROM public.dealership_members WHERE user_id = auth.uid()))
);

-- Wishlist
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, car_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auctions
CREATE TABLE public.auctions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  title text NOT NULL,
  starting_bid numeric(12,2) NOT NULL,
  reserve_price numeric(12,2),
  bid_increment numeric(12,2) NOT NULL DEFAULT 100,
  deposit_amount numeric(12,2) NOT NULL DEFAULT 0,
  current_bid numeric(12,2),
  winning_bidder_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended','sold')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  streaming_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view auctions" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Admins full access to auctions" ON public.auctions FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Bids
CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  is_auto_bid boolean NOT NULL DEFAULT false,
  max_bid_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view bids" ON public.bids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users place own bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access to bids" ON public.bids FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Auction deposits
CREATE TABLE public.auction_deposits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

ALTER TABLE public.auction_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deposits" ON public.auction_deposits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users submit deposits" ON public.auction_deposits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access to deposits" ON public.auction_deposits FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Auction watchlist
CREATE TABLE public.auction_watchlist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, auction_id)
);

ALTER TABLE public.auction_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own auction watchlist" ON public.auction_watchlist FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  image_url text,
  author_id uuid REFERENCES public.profiles(id),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  meta_title text,
  meta_description text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins full access to blog posts" ON public.blog_posts FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Testimonials
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name text NOT NULL,
  customer_photo_url text,
  testimonial_text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins full access to testimonials" ON public.testimonials FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Site settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- SEO settings
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  page text UNIQUE NOT NULL,
  meta_title text,
  meta_description text,
  meta_keywords text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read seo settings" ON public.seo_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage seo settings" ON public.seo_settings FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Homepage brand carousel
CREATE TABLE public.brand_carousel (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name text NOT NULL,
  logo_url text,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_carousel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view brand carousel" ON public.brand_carousel FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage brand carousel" ON public.brand_carousel FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Homepage sections
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key text UNIQUE NOT NULL,
  label text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read homepage sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage sections" ON public.homepage_sections FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Dealership activity log
CREATE TABLE public.dealership_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dealership_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all activity logs" ON public.dealership_activity_log FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);
CREATE POLICY "Dealership members view own logs" ON public.dealership_activity_log FOR SELECT TO authenticated USING (
  dealership_id IN (SELECT dealership_id FROM public.dealership_members WHERE user_id = auth.uid())
);
CREATE POLICY "Insert activity logs" ON public.dealership_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public subscribe newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);

-- Vehicle database version history
CREATE TABLE public.vehicle_db_version_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL CHECK (entity_type IN ('brand', 'model', 'variant')),
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_db_version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage vehicle db history" ON public.vehicle_db_version_history FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::public.user_role);
CREATE POLICY "Insert vehicle db history" ON public.vehicle_db_version_history FOR INSERT TO authenticated WITH CHECK (true);

-- Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.cars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
