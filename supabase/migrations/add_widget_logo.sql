-- Migration: Add logo_url column to widgets table
-- This stores the URL of the uploaded logo image for widget branding

-- Add logo_url column to widgets table
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN widgets.logo_url IS 'URL of the logo image displayed in widget header';

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'widgets' AND column_name = 'logo_url';
