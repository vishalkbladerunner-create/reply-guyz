-- ============================================
-- Merge 3 Sandmark clients into 1
-- Run this in Supabase SQL Editor
-- ============================================

-- Get the IDs
DO $$
DECLARE
  sandmark_id UUID;
  sandmark_ig_id UUID;
  sandmark_tg_id UUID;
BEGIN
  -- Find the IDs
  SELECT id INTO sandmark_id FROM clients WHERE slug = 'sandmark';
  SELECT id INTO sandmark_ig_id FROM clients WHERE slug = 'sandmark-ig';
  SELECT id INTO sandmark_tg_id FROM clients WHERE slug = 'sandmark-tg';

  -- If sandmark doesn't exist but the others do, rename one
  IF sandmark_id IS NULL AND sandmark_ig_id IS NOT NULL THEN
    sandmark_id := sandmark_ig_id;
    UPDATE clients SET name = 'Sandmark', slug = 'sandmark' WHERE id = sandmark_id;
  END IF;

  -- If still no sandmark, create it
  IF sandmark_id IS NULL THEN
    INSERT INTO clients (name, slug, platform, active_platforms)
    VALUES ('Sandmark', 'sandmark', 'twitter', ARRAY['twitter', 'instagram', 'telegram'])
    RETURNING id INTO sandmark_id;
  ELSE
    -- Update existing sandmark to have all platforms
    UPDATE clients 
    SET 
      name = 'Sandmark',
      slug = 'sandmark',
      active_platforms = ARRAY['twitter', 'instagram', 'telegram'],
      twitter_handle = '@sandmark_news',
      instagram_handle = '@sandmark',
      telegram_handle = '@sandmark_news'
    WHERE id = sandmark_id;
  END IF;

  -- Reassign posts from IG client to main sandmark
  IF sandmark_ig_id IS NOT NULL AND sandmark_ig_id != sandmark_id THEN
    UPDATE posts SET client_id = sandmark_id WHERE client_id = sandmark_ig_id;
    UPDATE daily_metrics SET client_id = sandmark_id WHERE client_id = sandmark_ig_id;
    UPDATE engagement_orders SET client_id = sandmark_id WHERE client_id = sandmark_ig_id;
    UPDATE profiles SET client_id = sandmark_id WHERE client_id = sandmark_ig_id;
    DELETE FROM clients WHERE id = sandmark_ig_id;
  END IF;

  -- Reassign posts from TG client to main sandmark
  IF sandmark_tg_id IS NOT NULL AND sandmark_tg_id != sandmark_id THEN
    UPDATE posts SET client_id = sandmark_id WHERE client_id = sandmark_tg_id;
    UPDATE daily_metrics SET client_id = sandmark_id WHERE client_id = sandmark_tg_id;
    UPDATE engagement_orders SET client_id = sandmark_id WHERE client_id = sandmark_tg_id;
    UPDATE profiles SET client_id = sandmark_id WHERE client_id = sandmark_tg_id;
    DELETE FROM clients WHERE id = sandmark_tg_id;
  END IF;

END $$;

-- Verify: should show only 1 Sandmark client with all 3 platforms
SELECT name, slug, active_platforms FROM clients;
