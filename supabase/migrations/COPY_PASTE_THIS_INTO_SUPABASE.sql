-- ========================================
-- Lil Widget: Crawl Tiers Migration
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click "Run"
-- ========================================

-- Step 1: Add crawl_tier field to widgets table
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS crawl_tier TEXT DEFAULT 'basic' CHECK (crawl_tier IN ('basic', 'deep'));

COMMENT ON COLUMN widgets.crawl_tier IS 'basic = homepage only (free tier), deep = multi-page crawl with structured data (paid tier)';

-- Step 2: Create widget_knowledge_base table
CREATE TABLE IF NOT EXISTS widget_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(widget_id)
);

COMMENT ON TABLE widget_knowledge_base IS 'Stores deep crawl data for widgets on paid tier. JSON structure includes: services[], team[], menuItems[], clientWork[], faq[], locations[], and other extracted business data.';

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_widget_knowledge_base_widget_id
ON widget_knowledge_base(widget_id);

-- Step 4: Enable Row Level Security
ALTER TABLE widget_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policy for reading
CREATE POLICY "Users can read knowledge base for own widgets"
ON widget_knowledge_base
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM widgets
    WHERE widgets.id = widget_knowledge_base.widget_id
    AND widgets.owner_id = auth.uid()
  )
);

-- Step 6: Add RLS policy for writing
CREATE POLICY "Users can insert/update knowledge base for own widgets"
ON widget_knowledge_base
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM widgets
    WHERE widgets.id = widget_knowledge_base.widget_id
    AND widgets.owner_id = auth.uid()
  )
);

-- ========================================
-- Verification Queries (run these after to confirm)
-- ========================================

-- Check crawl_tier column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'widgets' AND column_name = 'crawl_tier';

-- Check widget_knowledge_base table
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'widget_knowledge_base';

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'widget_knowledge_base';

-- ========================================
-- SUCCESS! You should see:
-- ✅ crawl_tier column exists
-- ✅ widget_knowledge_base table exists
-- ✅ 2 RLS policies
-- ========================================
