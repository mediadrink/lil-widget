# Crawl Tiers System

## Overview

Lil' Widget offers two tiers of website crawling to power your AI chat widget with knowledge about your business.

---

## Free Tier: Basic Crawl

**What it does:**
- Crawls your homepage only
- Extracts basic information:
  - Page title / H1 heading
  - Meta description
  - First paragraphs
  - Location (city/state)
  - Contact info (phone, email)
  - Basic about/story text

**Use case:**
- Perfect for simple websites
- Good starting point for persona generation during onboarding
- Widget relies primarily on the persona text you write

**Limitations:**
- Homepage only (no deep site crawling)
- No structured data extraction
- No ongoing updates
- Widget conversations use only the persona instructions

---

## Paid Tier: Deep Crawl

**What it does:**
- Crawls up to 10 pages from your website
- Automatically discovers and follows internal links
- Extracts structured data:
  - **Services**: Full list of services/offerings with descriptions
  - **Team**: Team member profiles and bios
  - **Menu Items**: Food/drink menus with prices (for restaurants)
  - **Portfolio**: Client work, case studies, projects
  - **FAQ**: Frequently asked questions and answers
  - **Locations**: Multiple office/store locations
  - **About**: Comprehensive company story and history

**Use case:**
- Businesses with multiple pages of content
- Restaurants, agencies, professional services
- Companies wanting rich, accurate widget responses
- Teams that want the widget to reference specific services, team members, or work

**Benefits:**
- Widget has access to full knowledge base during conversations
- Can reference specific services, team members, pricing
- More accurate and helpful responses
- Stored in database for fast retrieval
- Can be re-crawled to stay updated

**Storage:**
- Crawled data stored in `widget_knowledge_base` table
- JSONB format for flexible querying
- Linked to widget via `widget_id`

---

## Technical Implementation

### Database Schema

```sql
-- widgets table
ALTER TABLE widgets
ADD COLUMN crawl_tier TEXT DEFAULT 'basic' CHECK (crawl_tier IN ('basic', 'deep'));

-- widget_knowledge_base table
CREATE TABLE widget_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(widget_id)
);
```

### API Endpoints

**Basic Crawl (Free):**
- `POST /api/crawl-summary`
- Used during onboarding
- Returns human-readable summary
- No authentication required for onboarding preview

**Deep Crawl (Paid):**
- `POST /api/crawl-deep`
- Requires authentication
- Requires `crawl_tier: 'deep'` on widget
- Stores data in `widget_knowledge_base` table
- Returns structured data summary

### Knowledge Base JSON Structure

```json
{
  "pages": [
    { "url": "...", "title": "...", "content": "..." }
  ],
  "services": [
    "Web Design",
    "Branding",
    "SEO"
  ],
  "team": [
    {
      "name": "John Doe",
      "bio": "...",
      "role": "..."
    }
  ],
  "menuItems": [
    {
      "name": "Burger",
      "price": "$12.99",
      "description": "..."
    }
  ],
  "clientWork": [
    "Project Name 1",
    "Project Name 2"
  ],
  "faq": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "locations": [
    {
      "city": "Portland",
      "state": "OR",
      "address": "..."
    }
  ],
  "aboutText": "Company story...",
  "metadata": {
    "lastCrawled": "2025-01-24T...",
    "pagesAnalyzed": 10
  }
}
```

---

## Usage in Widget Conversations

### Free Tier (Basic)
Widget uses only the `persona_text` field from the widgets table:

```typescript
const systemMessage = widget.persona_text;
```

### Paid Tier (Deep)
Widget loads knowledge base and includes relevant context:

```typescript
// Load knowledge base
const { data: kb } = await supabase
  .from('widget_knowledge_base')
  .select('data')
  .eq('widget_id', widgetId)
  .single();

// Build enriched system message
const systemMessage = `
${widget.persona_text}

BUSINESS KNOWLEDGE:
- Services: ${kb.data.services.join(', ')}
- Team: ${kb.data.team.map(t => t.name).join(', ')}
- FAQ: ${kb.data.faq.length} common questions answered
${kb.data.menuItems ? `- Menu: ${kb.data.menuItems.length} items` : ''}

Use this information to provide accurate, specific answers to user questions.
`;
```

---

## Migration Path

**Existing Free Users:**
- Widgets default to `crawl_tier: 'basic'`
- Continue working as before
- Can upgrade to unlock deep crawl

**New Paid Users:**
- Create widget with `crawl_tier: 'deep'`
- Run deep crawl during onboarding
- Widget has immediate access to knowledge base

**Upgrade Flow:**
1. User upgrades to paid plan
2. Update widget: `UPDATE widgets SET crawl_tier = 'deep' WHERE id = ?`
3. Trigger deep crawl: `POST /api/crawl-deep`
4. Widget conversations now use knowledge base

---

## Re-Crawling

**Manual Re-Crawl:**
```bash
POST /api/crawl-deep
{
  "widgetId": "...",
  "url": "https://example.com"
}
```

**Future: Automatic Re-Crawling**
- Daily/weekly scheduled re-crawls
- Webhook trigger on site updates
- Manual "Refresh Knowledge" button in dashboard

---

## Cost Considerations

**Basic Crawl:**
- 1 HTTP request
- Minimal processing
- No storage costs

**Deep Crawl:**
- Up to 10 HTTP requests
- More intensive parsing
- JSONB storage in Postgres
- Typical knowledge base: 50-500 KB

**Limits:**
- Max 10 pages per crawl (prevent abuse)
- 30-second timeout
- Rate limit: 1 deep crawl per widget per hour

---

## Error Handling

**Basic Crawl:**
- Fails gracefully
- User can continue onboarding
- Shows "Skip" option

**Deep Crawl:**
- Returns partial results if some pages fail
- Logs errors for debugging
- Shows summary of what was extracted
- User can retry if needed

---

## Future Enhancements

1. **Vector Search**: Embed crawled content for semantic search
2. **Smart Extraction**: Use AI to identify key information
3. **Multi-Language**: Detect and handle multiple languages
4. **Media Analysis**: Extract info from images/videos
5. **API Integration**: Pull data from external APIs (Yelp, Google Business, etc.)
6. **Crawl Scheduling**: Automatic re-crawls on schedule
7. **Diff Detection**: Only update changed content

---

## Testing

**Test Basic Crawl:**
```bash
curl -X POST http://localhost:3000/api/crawl-summary \
  -H "Content-Type: application/json" \
  -d '{"url": "mediadrink.com"}'
```

**Test Deep Crawl:**
```bash
curl -X POST http://localhost:3000/api/crawl-deep \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "mediadrink.com", "widgetId": "uuid-here"}'
```
