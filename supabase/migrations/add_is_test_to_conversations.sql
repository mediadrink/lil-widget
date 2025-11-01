-- Migration: Add is_test flag to conversations table
-- This allows us to exclude test conversations from checklist counts
-- Copy this into Supabase SQL Editor and run

-- Add is_test column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN conversations.is_test IS 'True if this is a test conversation from admin console, false if from real widget on external site';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_conversations_is_test
ON conversations(is_test);

-- Verification query
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'is_test';
