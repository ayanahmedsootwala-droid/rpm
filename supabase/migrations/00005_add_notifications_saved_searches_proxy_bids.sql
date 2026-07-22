
-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bid_outbid','bid_won','listing_approved','listing_rejected','inquiry_response','saved_search_match','auction_ending','general')),
  title text NOT NULL,
  message text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_id_idx ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Saved searches table
CREATE TABLE saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  alert_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_saved_searches" ON saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Proxy bids table
CREATE TABLE proxy_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_amount numeric(15,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);
ALTER TABLE proxy_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_proxy_bids" ON proxy_bids FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "proxy_bids_insert" ON proxy_bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add reserve_price and bid_increment to auctions if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='reserve_price') THEN
    ALTER TABLE auctions ADD COLUMN reserve_price numeric(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='bid_increment') THEN
    ALTER TABLE auctions ADD COLUMN bid_increment numeric(15,2) NOT NULL DEFAULT 5000;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='auto_close') THEN
    ALTER TABLE auctions ADD COLUMN auto_close boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add is_verified to dealerships if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dealerships' AND column_name='is_verified') THEN
    ALTER TABLE dealerships ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE proxy_bids;
