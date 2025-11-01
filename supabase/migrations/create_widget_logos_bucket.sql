-- ========================================
-- Create Storage Bucket for Widget Logos
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click "Run"
-- ========================================

-- Step 1: Create the storage bucket (if it doesn't exist)
-- Note: You may need to create this in the Supabase Dashboard > Storage instead
-- Storage buckets are created via the dashboard or via the storage API

-- Step 2: Set up RLS policies for the bucket
-- These policies control who can upload/read from the bucket

-- Create policy to allow authenticated users to upload logos for their own widgets
-- This will be enforced in the API route

-- Step 3: Make bucket public for reading
-- Logos need to be publicly accessible so they show in embedded widgets

-- ========================================
-- MANUAL STEPS (Do these in Supabase Dashboard):
-- ========================================

-- 1. Go to: Storage > Create a new bucket
--    - Name: "widget-logos"
--    - Public: YES (check "Public bucket")
--    - File size limit: 2 MB
--    - Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp

-- 2. Configure Storage Policies:
--    Go to Storage > widget-logos > Policies

-- Policy 1: Allow public read access
-- Name: "Public logo read access"
-- Policy command: SELECT
-- Target roles: public
-- USING expression: true

-- Policy 2: Allow authenticated users to upload
-- Name: "Authenticated users can upload logos"
-- Policy command: INSERT
-- Target roles: authenticated
-- USING expression: true

-- Policy 3: Allow users to update their own logos
-- Name: "Users can update their own logos"
-- Policy command: UPDATE
-- Target roles: authenticated
-- USING expression: true

-- Policy 4: Allow users to delete their own logos
-- Name: "Users can delete their own logos"
-- Policy command: DELETE
-- Target roles: authenticated
-- USING expression: true

-- ========================================
-- Verification
-- ========================================

-- Check if bucket exists (run this after creating bucket in dashboard)
SELECT * FROM storage.buckets WHERE name = 'widget-logos';

-- Check policies (run this after setting up policies)
SELECT * FROM storage.policies WHERE bucket_id = 'widget-logos';

-- ========================================
-- SUCCESS! You should see:
-- ✅ widget-logos bucket exists
-- ✅ Bucket is public
-- ✅ 4 RLS policies created
-- ========================================
