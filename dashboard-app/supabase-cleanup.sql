-- ============================================
-- ReplyGuyz Cleanup: Delete all existing data
-- WARNING: This deletes ALL posts, metrics, and orders
-- Run only if you want to start fresh
-- ============================================

-- Delete all engagement orders
DELETE FROM engagement_orders;

-- Delete all daily metrics
DELETE FROM daily_metrics;

-- Delete all posts
DELETE FROM posts;

-- Reset clients (optional - uncomment if you want to remove clients too)
-- DELETE FROM clients;

-- Note: profiles and auth.users are NOT deleted
-- Users can still log in, but their data is gone
