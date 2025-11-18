-- Migration: Add demo widget support
-- Run this in your Supabase SQL Editor before running the seed script

-- Add is_demo column to identify demo widgets
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Add demo_type to categorize demo widgets
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS demo_type TEXT;

-- Create index for faster demo widget queries
CREATE INDEX IF NOT EXISTS idx_widgets_is_demo ON widgets(is_demo) WHERE is_demo = true;

-- Allow owner_id to be null for demo widgets
ALTER TABLE widgets
ALTER COLUMN owner_id DROP NOT NULL;

-- Update RLS policies to allow public read access to demo widgets
CREATE POLICY "Public can view demo widgets"
  ON widgets FOR SELECT
  USING (is_demo = true);

-- Comment for documentation
COMMENT ON COLUMN widgets.is_demo IS 'True if this is a demo widget displayed on the homepage';
COMMENT ON COLUMN widgets.demo_type IS 'Type of demo widget: diva, vinyl, pro, roofing';
