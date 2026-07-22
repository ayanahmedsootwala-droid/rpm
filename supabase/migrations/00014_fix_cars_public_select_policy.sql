
-- Drop the old public-role policy that may not cover anon properly
DROP POLICY IF EXISTS "Public view active/sold cars" ON cars;

-- Re-create with explicit anon + authenticated roles
CREATE POLICY "anon_view_active_cars" ON cars
  FOR SELECT
  TO anon
  USING (status = ANY (ARRAY['active'::text, 'sold'::text, 'reserved'::text]));

CREATE POLICY "auth_view_active_cars" ON cars
  FOR SELECT
  TO authenticated
  USING (
    status = ANY (ARRAY['active'::text, 'sold'::text, 'reserved'::text])
    OR seller_id = auth.uid()
    OR dealership_id IN (
      SELECT dealership_id FROM dealership_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR get_user_role(auth.uid()) = 'admin'::user_role
  );

-- Drop old duplicate admin/dealer SELECT policies that conflict
DROP POLICY IF EXISTS "Admins full access to cars" ON cars;
DROP POLICY IF EXISTS "Dealership members manage own cars" ON cars;
DROP POLICY IF EXISTS "Users manage own submitted cars" ON cars;

-- Re-create write policies (INSERT/UPDATE/DELETE) cleanly
CREATE POLICY "admin_all_cars" ON cars
  FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "dealer_manage_own_cars" ON cars
  FOR ALL
  TO authenticated
  USING (
    dealership_id IN (
      SELECT dealership_id FROM dealership_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    dealership_id IN (
      SELECT dealership_id FROM dealership_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "user_manage_own_cars" ON cars
  FOR ALL
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());
