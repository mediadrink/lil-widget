-- Add crawl_tier field to widgets table
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS crawl_tier TEXT DEFAULT 'basic' CHECK (crawl_tier IN ('basic', 'deep'));

-- Create widget_knowledge_base table to store deep crawl data
CREATE TABLE IF NOT EXISTS widget_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(widget_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_widget_knowledge_base_widget_id
ON widget_knowledge_base(widget_id);

-- Add RLS policies for widget_knowledge_base
ALTER TABLE widget_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow users to read knowledge base for their own widgets
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

-- Allow users to insert/update knowledge base for their own widgets
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

-- Add comment to explain the structure
COMMENT ON TABLE widget_knowledge_base IS 'Stores deep crawl data for widgets on paid tier. JSON structure includes: services[], team[], menuItems[], clientWork[], faq[], locations[], and other extracted business data.';

COMMENT ON COLUMN widgets.crawl_tier IS 'basic = homepage only (free tier), deep = multi-page crawl with structured data (paid tier)';
