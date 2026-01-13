-- ========================================
-- Lil Widget: External Knowledge Base Support
-- Allows widgets to connect to external APIs for knowledge base
-- ========================================

-- Step 1: Add kb_type field to widgets table
-- 'crawl' = use built-in web crawl knowledge base (default)
-- 'external' = use external API
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS kb_type TEXT DEFAULT 'crawl' CHECK (kb_type IN ('crawl', 'external'));

COMMENT ON COLUMN widgets.kb_type IS 'Knowledge base type: crawl (built-in web crawl) or external (external API)';

-- Step 2: Add external KB URL field
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS external_kb_url TEXT;

COMMENT ON COLUMN widgets.external_kb_url IS 'URL of external knowledge base API endpoint (e.g., https://api.example.com/chat)';

-- Step 3: Add external KB API key field (optional, for authenticated APIs)
ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS external_kb_api_key TEXT;

COMMENT ON COLUMN widgets.external_kb_api_key IS 'API key for authenticating with external knowledge base (optional)';

-- ========================================
-- Verification Queries (run these after to confirm)
-- ========================================

-- Check new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'widgets'
AND column_name IN ('kb_type', 'external_kb_url', 'external_kb_api_key');

-- ========================================
-- SUCCESS! You should see:
-- ✅ kb_type column with default 'crawl'
-- ✅ external_kb_url column
-- ✅ external_kb_api_key column
-- ========================================
