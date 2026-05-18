-- ============================================
-- ReplyGuyz Dashboard — Supabase Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','instagram','telegram')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  role TEXT CHECK (role IN ('admin','client')),
  client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Posts table (unified post fact table)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','instagram','telegram')),
  post_date DATE NOT NULL,
  post_time TIME,
  likes INT DEFAULT 0,
  reposts INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reactions INT DEFAULT 0,
  impressions INT DEFAULT 0,
  engagements INT DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  post_url TEXT,
  post_text TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_client_platform_date ON posts(client_id, platform, post_date);

-- 4. Daily metrics table (account-level daily rollups)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  engagements BIGINT DEFAULT 0,
  bookmarks BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  new_follows BIGINT DEFAULT 0,
  unfollows BIGINT DEFAULT 0,
  replies BIGINT DEFAULT 0,
  reposts BIGINT DEFAULT 0,
  profile_visits BIGINT DEFAULT 0,
  posts_created INT DEFAULT 0,
  net_followers BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, platform, metric_date)
);

CREATE INDEX idx_daily_metrics_client_date ON daily_metrics(client_id, metric_date);

-- 5. Engagement orders table (paid/boost log)
CREATE TABLE engagement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  platform TEXT NOT NULL,
  link TEXT NOT NULL,
  post_url TEXT,
  order_date DATE,
  followers_ordered INT DEFAULT 0,
  comments_ordered INT DEFAULT 0,
  reposts_ordered INT DEFAULT 0,
  likes_ordered INT DEFAULT 0,
  views_ordered INT DEFAULT 0,
  status TEXT DEFAULT 'Done',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_orders ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is approved
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clients: Everyone can read
CREATE POLICY "Clients are viewable by everyone" ON clients
  FOR SELECT TO authenticated USING (true);

-- Profiles: Users can read their own profile (any status, needed for pending screen)
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

-- Profiles: Admins can read all profiles (including pending)
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Profiles: Admins can update profiles (approve/reject/assign)
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Posts: Only approved users can read
CREATE POLICY "Clients can read own posts" ON posts
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

-- Posts: Admins can insert/update/delete
CREATE POLICY "Admins can manage posts" ON posts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Daily Metrics: Only approved users can read
CREATE POLICY "Clients can read own metrics" ON daily_metrics
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

CREATE POLICY "Admins can manage metrics" ON daily_metrics
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Engagement Orders: Only approved users can read
CREATE POLICY "Clients can read own orders" ON engagement_orders
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      client_id IN (
        SELECT client_id FROM profiles WHERE id = (SELECT auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
    )
  );

CREATE POLICY "Admins can manage orders" ON engagement_orders
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- ============================================
-- Trigger: Auto-update updated_at on posts
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- ============================================
-- Seed Data (Sample)
-- ============================================
INSERT INTO clients (name, slug, platform) VALUES
  ('Sandmark', 'sandmark', 'twitter'),
  ('Sandmark IG', 'sandmark-ig', 'instagram'),
  ('Sandmark TG', 'sandmark-tg', 'telegram');
