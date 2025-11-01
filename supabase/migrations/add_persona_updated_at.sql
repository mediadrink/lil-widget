-- Migration: Add persona_updated_at to widgets table
-- This allows us to track when persona was last manually edited (vs created during onboarding)
-- Copy this into Supabase SQL Editor and run

-- Add persona_updated_at column to widgets table
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS persona_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN widgets.persona_updated_at IS 'When persona was last manually edited in admin console (NULL if only set during onboarding)';

-- Verification query
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'widgets' AND column_name = 'persona_updated_at';
