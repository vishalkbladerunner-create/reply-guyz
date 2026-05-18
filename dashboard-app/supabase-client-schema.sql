-- ============================================
-- Client Schema Update: Add social handles & active platforms
-- ============================================

-- Add new columns to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS telegram_handle TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS active_platforms TEXT[] DEFAULT ARRAY['twitter'];

-- Update existing clients to have twitter in active_platforms
UPDATE clients SET active_platforms = ARRAY['twitter'] WHERE active_platforms IS NULL;

-- Make platform column nullable (we now use active_platforms for multi-platform)
ALTER TABLE clients ALTER COLUMN platform DROP NOT NULL;

-- Admins can insert/update/delete clients
DROP POLICY IF EXISTS "Only admins can manage clients" ON clients;
CREATE POLICY "Only admins can manage clients" ON clients
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin' AND p.status = 'approved')
  );

-- Approved users can read clients they're assigned to OR all clients if admin
DROP POLICY IF EXISTS "Approved users can read clients" ON clients;
CREATE POLICY "Approved users can read clients" ON clients
  FOR SELECT TO authenticated USING (
    is_approved_user() AND (
      is_approved_admin()
      OR id = get_user_client_id()
    )
  );
