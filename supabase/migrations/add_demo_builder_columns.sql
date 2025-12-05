-- Migration: Add demo builder columns for homepage widget builder
-- These columns store the personality trait and crawled metadata for demo widgets

-- Add demo_personality column
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS demo_personality TEXT;

-- Add demo_metadata column for storing crawled data as JSONB
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS demo_metadata JSONB;

-- Create demo_leads table for lead capture
CREATE TABLE IF NOT EXISTS demo_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  assistant_name TEXT,
  personality TEXT,
  metadata JSONB,
  email TEXT, -- Captured when they sign up
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ -- When they signed up
);

-- Index for analyzing demo leads
CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON demo_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_url ON demo_leads(url);

-- Comments
COMMENT ON COLUMN widgets.demo_personality IS 'Personality trait selected during demo builder (friendly, professional, etc)';
COMMENT ON COLUMN widgets.demo_metadata IS 'Crawled metadata from the website (title, description, services)';
COMMENT ON TABLE demo_leads IS 'Tracks URLs and assistant configs from the homepage demo builder for lead capture';
