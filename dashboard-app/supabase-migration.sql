-- ============================================
-- ReplyGuyz Migration: Add user approval flow
-- Run this if you already have the database set up
-- ============================================

-- 1. Add status column to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'));

-- 2. Update existing profiles to approved (so current users don't get locked out)
UPDATE profiles SET status = 'approved' WHERE status IS NULL;

-- 3. Make role nullable (for pending users)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IS NULL OR role IN ('admin','client'));

-- 4. Update trigger to set status='pending' and role=NULL on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper: check if current user is approved
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS policies

-- Profiles: Admins can read all profiles (including pending)
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Profiles: Admins can update profiles (approve/reject/assign)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Posts: Only approved users can read
DROP POLICY IF EXISTS "Clients can read own posts" ON posts;
CREATE POLICY "Clients can read own posts" ON posts
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

-- Posts: Admins can manage (must be approved)
DROP POLICY IF EXISTS "Admins can manage posts" ON posts;
CREATE POLICY "Admins can manage posts" ON posts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Daily Metrics: Only approved users can read
DROP POLICY IF EXISTS "Clients can read own metrics" ON daily_metrics;
CREATE POLICY "Clients can read own metrics" ON daily_metrics
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage metrics" ON daily_metrics;
CREATE POLICY "Admins can manage metrics" ON daily_metrics
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Engagement Orders: Only approved users can read
DROP POLICY IF EXISTS "Clients can read own orders" ON engagement_orders;
CREATE POLICY "Clients can read own orders" ON engagement_orders
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage orders" ON engagement_orders;
CREATE POLICY "Admins can manage orders" ON engagement_orders
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );
