-- ============================================
-- ReplyGuyz Security Hardening
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure RLS is enabled on ALL tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_orders ENABLE ROW LEVEL SECURITY;

-- 2. Helper: check if current user is approved
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper: check if current user is an approved admin
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND status = 'approved' AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper: get current user's assigned client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID AS $$
DECLARE
  client_uuid UUID;
BEGIN
  SELECT client_id INTO client_uuid FROM profiles WHERE id = (SELECT auth.uid());
  RETURN client_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CLIENTS TABLE (organizations)
-- Only approved users can read.
-- Clients can ONLY see their assigned organization.
-- Admins can see all organizations.
-- ============================================
DROP POLICY IF EXISTS "Clients are viewable by everyone" ON clients;

CREATE POLICY "Approved users can read clients" ON clients
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      -- Admin can see all clients
      is_approved_admin()
      OR
      -- Client can only see their assigned client
      id = get_user_client_id()
    )
  );

-- Only admins can insert/update/delete clients
CREATE POLICY "Only admins can manage clients" ON clients
  FOR ALL TO authenticated USING (is_approved_admin());

-- ============================================
-- PROFILES TABLE
-- Users can read their own profile (any status, needed for pending screen)
-- Admins can read ALL profiles (including pending)
-- Admins can update profiles (approve/reject/assign)
-- Users can update their own profile (but not role/status)
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated USING (is_approved_admin());

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE TO authenticated USING (is_approved_admin());

-- ============================================
-- POSTS TABLE
-- Only approved users can read.
-- Clients can only read posts for their assigned client_id.
-- Admins can read ALL posts.
-- Only admins can write.
-- ============================================
DROP POLICY IF EXISTS "Clients can read own posts" ON posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON posts;

CREATE POLICY "Approved users can read posts" ON posts
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      -- Admin sees all
      is_approved_admin()
      OR
      -- Client sees only their assigned client's posts
      client_id = get_user_client_id()
    )
  );

CREATE POLICY "Only admins can manage posts" ON posts
  FOR ALL TO authenticated USING (is_approved_admin());

-- ============================================
-- DAILY METRICS TABLE
-- Same pattern as posts
-- ============================================
DROP POLICY IF EXISTS "Clients can read own metrics" ON daily_metrics;
DROP POLICY IF EXISTS "Admins can manage metrics" ON daily_metrics;

CREATE POLICY "Approved users can read metrics" ON daily_metrics
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      is_approved_admin()
      OR
      client_id = get_user_client_id()
    )
  );

CREATE POLICY "Only admins can manage metrics" ON daily_metrics
  FOR ALL TO authenticated USING (is_approved_admin());

-- ============================================
-- ENGAGEMENT ORDERS TABLE
-- Same pattern as posts
-- ============================================
DROP POLICY IF EXISTS "Clients can read own orders" ON engagement_orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON engagement_orders;

CREATE POLICY "Approved users can read orders" ON engagement_orders
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      is_approved_admin()
      OR
      client_id = get_user_client_id()
    )
  );

CREATE POLICY "Only admins can manage orders" ON engagement_orders
  FOR ALL TO authenticated USING (is_approved_admin());

-- ============================================
-- Trigger: Auto-create profile on signup
-- ============================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
