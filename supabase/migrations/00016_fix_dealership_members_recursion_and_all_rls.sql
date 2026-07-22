
-- ══════════════════════════════════════════════════════════════════
-- STEP 1: Create a SECURITY DEFINER helper that reads dealership_members
--         without triggering RLS (bypasses the recursion entirely)
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_my_dealership_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT dealership_id
      FROM dealership_members
      WHERE user_id = auth.uid()
        AND is_active = true
    ),
    ARRAY[]::uuid[]
  );
$$;

-- ══════════════════════════════════════════════════════════════════
-- STEP 2: Fix dealership_members itself — drop the self-referencing
--         SELECT policy and replace with a simple, non-recursive one
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Members view own dealership members" ON dealership_members;

-- Simple: a user can see rows where they are the member, OR where they
-- share a dealership — use the SECURITY DEFINER fn to avoid recursion
CREATE POLICY "members_view_own_membership" ON dealership_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR dealership_id = ANY(get_my_dealership_ids())
  );

-- ══════════════════════════════════════════════════════════════════
-- STEP 3: Rebuild ALL cars policies using the helper fn
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "anon_view_active_cars"    ON cars;
DROP POLICY IF EXISTS "auth_view_active_cars"    ON cars;
DROP POLICY IF EXISTS "admin_all_cars"           ON cars;
DROP POLICY IF EXISTS "dealer_manage_own_cars"   ON cars;
DROP POLICY IF EXISTS "user_manage_own_cars"     ON cars;

-- Public (anon) can see active/sold/reserved cars
CREATE POLICY "anon_view_cars" ON cars
  FOR SELECT TO anon
  USING (status = ANY (ARRAY['active','sold','reserved']));

-- Authenticated SELECT: active listings OR own seller OR own dealership OR admin
CREATE POLICY "auth_select_cars" ON cars
  FOR SELECT TO authenticated
  USING (
    status = ANY (ARRAY['active','sold','reserved'])
    OR seller_id = auth.uid()
    OR dealership_id = ANY(get_my_dealership_ids())
    OR get_user_role(auth.uid()) = 'admin'::user_role
  );

-- Admin: full access to ALL cars (any status, any owner)
CREATE POLICY "admin_all_cars" ON cars
  FOR ALL TO authenticated
  USING    (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Dealer: manage cars belonging to their dealership
CREATE POLICY "dealer_own_cars" ON cars
  FOR ALL TO authenticated
  USING    (dealership_id = ANY(get_my_dealership_ids()))
  WITH CHECK (dealership_id = ANY(get_my_dealership_ids()));

-- Seller: manage own privately submitted cars
CREATE POLICY "seller_own_cars" ON cars
  FOR ALL TO authenticated
  USING    (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- STEP 4: Fix all other tables whose policies reference dealership_members
-- ══════════════════════════════════════════════════════════════════

-- dealership_activity_log
DROP POLICY IF EXISTS "Dealership members view own logs" ON dealership_activity_log;
CREATE POLICY "dealer_view_own_logs" ON dealership_activity_log
  FOR SELECT TO authenticated
  USING (dealership_id = ANY(get_my_dealership_ids()));

-- car_version_history (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_version_history') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Dealership members view own car history" ON car_version_history';
    EXECUTE '
      CREATE POLICY "dealer_view_car_history" ON car_version_history
        FOR SELECT TO authenticated
        USING (
          car_id IN (
            SELECT id FROM cars
            WHERE dealership_id = ANY(get_my_dealership_ids())
          )
          OR get_user_role(auth.uid()) = ''admin''::user_role
        )
    ';
  END IF;
END $$;

-- inquiries: fix the chained subquery
DROP POLICY IF EXISTS "Dealership members view own inquiries" ON inquiries;
CREATE POLICY "dealer_view_own_inquiries" ON inquiries
  FOR SELECT TO authenticated
  USING (
    car_id IN (
      SELECT id FROM cars
      WHERE dealership_id = ANY(get_my_dealership_ids())
    )
    OR user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'admin'::user_role
  );
