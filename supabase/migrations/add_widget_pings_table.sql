-- Migration: Add widget_pings table to track widget installations
-- Copy this into Supabase SQL Editor and run

-- Create widget_pings table
CREATE TABLE IF NOT EXISTS widget_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE widget_pings IS 'Tracks when widgets load on external websites to confirm installation';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_widget_pings_widget_id
ON widget_pings(widget_id);

CREATE INDEX IF NOT EXISTS idx_widget_pings_created_at
ON widget_pings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE widget_pings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for reading (widget owners can see their pings)
CREATE POLICY "Widget owners can read their pings"
ON widget_pings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM widgets
    WHERE widgets.id = widget_pings.widget_id
    AND widgets.owner_id = auth.uid()
  )
);

-- Add RLS policy for inserting (public can insert - no auth needed for pings)
CREATE POLICY "Anyone can insert pings"
ON widget_pings
FOR INSERT
WITH CHECK (true);

-- Verification query
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'widget_pings'
ORDER BY ordinal_position;
