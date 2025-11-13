# Lil Widget - Developer Guide

> **The one doc you need to understand the entire project and resume development.**

**Last Updated:** 2025-11-12
**Status:** 🚀 Production

---

## 🎯 Project Overview

**What it is:** AI-powered embeddable chat widget that learns from websites and gets smarter over time.

**Target Users:** Small businesses (lawyers, dentists, consultants, local services)

**Core Value Prop:**
- 5-minute setup (guided onboarding wizard)
- Self-improving AI based on conversations
- Affordable for SMBs ($9-49/mo planned)

**Differentiator:** Only widget that auto-learns from conversations and has conversational admin interface.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **React:** 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Design System:** Panic-inspired (see PANIC_DESIGN_SYSTEM.md)

### Backend
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (widget logos)

### AI
- **Chat:** OpenAI GPT-4 (gpt-4)
- **Admin Assistant:** Anthropic Claude (optional)
- **Crawling:** Cheerio for web scraping

### Payments (Disabled)
- **Stripe:** Ready but currently disabled

### Deployment
- **Host:** Vercel
- **CDN:** Vercel Edge Network
- **Domain:** lilwidget.com

---

## 🏗 Architecture

### How the Widget Works

```
1. User embeds script tag on their website
   ↓
2. widget.js loads and creates Shadow DOM chat interface
   ↓
3. Visitor types message
   ↓
4. Widget calls /api/widget/[id]/chat with message
   ↓
5. API loads widget persona + rules + conversation history
   ↓
6. API calls OpenAI GPT-4 with full context
   ↓
7. Response saved to database
   ↓
8. Reply sent back to widget
   ↓
9. Widget displays response
```

### Key Components

**Embeddable Widget:**
- `/public/widget.js` - Standalone script (Shadow DOM)
- No dependencies on customer site
- CORS-enabled API access

**Admin Console:**
- `/app/dashboard/widgets/[id]/admin-console` - Main admin UI
- View/edit modes for all settings
- Live widget preview
- Lil' Helper AI assistant (floating button)

**Onboarding:**
- `/app/onboarding` - 3-step guided wizard
- Step 1: Business info (title, URL, industry)
- Step 2: Personality selection (8 tones, 9 industries)
- Step 3: Embed code

**Conversations:**
- `/app/dashboard/conversations` - View all chats
- Filter by widget, date
- Promote responses to rules

---

## 📊 Database Schema

### Core Tables

```sql
widgets
├── id (uuid, pk)
├── owner_id (uuid, fk → auth.users)
├── title (text)
├── url (text)
├── persona_text (text)
├── style (text, default: 'style-1')
├── position (text, default: 'bottom-right')
├── crawl_tier (text, default: 'basic')
├── customization (jsonb) - colors, logo, etc
├── persona_updated_at (timestamptz)
└── created_at (timestamptz)

widget_rules
├── id (uuid, pk)
├── widget_id (uuid, fk → widgets)
├── text (text)
├── version (text, nullable)
└── created_at (timestamptz)

conversations
├── id (uuid, pk)
├── widget_id (uuid, fk → widgets)
├── visitor_id (text, nullable)
├── status (text, default: 'active')
├── started_at (timestamptz)
└── last_msg_at (timestamptz)

messages
├── id (uuid, pk)
├── conversation_id (uuid, fk → conversations)
├── widget_id (uuid, fk → widgets)
├── role (text: 'user' | 'assistant')
├── content (text)
└── created_at (timestamptz)

widget_knowledge_base (for deep crawl)
├── id (uuid, pk)
├── widget_id (uuid, fk → widgets, unique)
├── data (jsonb) - structured crawl results
├── last_crawled_at (timestamptz)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Storage Buckets

```
widget-logos/
└── {user_id}/
    └── {widget_id}.{ext}
```

---

## 📁 File Structure

### Key Directories

```
lil-widget/
├── app/
│   ├── api/
│   │   ├── admin-assistant/          # Lil' Helper chat
│   │   ├── conversations/            # Conversation CRUD
│   │   ├── crawl-summary/            # Basic crawl (homepage)
│   │   ├── crawl-deep/               # Deep crawl (10 pages)
│   │   ├── widget/[id]/
│   │   │   ├── chat/                 # Main chat endpoint
│   │   │   ├── rules/                # Rules CRUD
│   │   │   └── summary/              # Daily summary (GPT-4)
│   │   └── widgets/                  # Widget CRUD
│   ├── dashboard/
│   │   ├── conversations/            # Conversations list
│   │   └── widgets/[id]/
│   │       └── admin-console/        # Main admin UI
│   ├── onboarding/                   # 3-step wizard
│   ├── register/                     # Sign up
│   └── login/                        # Sign in
├── components/
│   └── LilHelperButton.tsx           # Floating AI assistant
├── lib/
│   └── supabase/                     # Supabase clients
├── public/
│   └── widget.js                     # Embeddable widget script
└── docs/
    ├── DEV_GUIDE.md                  # This file
    ├── WORKING_CHECKLIST.md          # Active tasks
    ├── PANIC_DESIGN_SYSTEM.md        # Design reference
    └── CRAWL_TIERS.md                # Crawling system docs
```

---

## 🔌 Key API Endpoints

### Public (No Auth Required)

**Widget Chat:**
```typescript
POST /api/widget/[widgetId]/chat
Body: {
  message: string
  conversationId?: string
  visitorId?: string
}
Response: {
  conversationId: string
  reply: string
}
```

**Conversation History:**
```typescript
GET /api/widget/[widgetId]/conversation/[conversationId]/history
Response: {
  messages: Array<{ role, content, created_at }>
}
```

**Basic Crawl:**
```typescript
POST /api/crawl-summary
Body: { url: string }
Response: {
  persona: string
  instructions: string
}
```

### Private (Auth Required)

**Admin Assistant (Lil' Helper):**
```typescript
POST /api/admin-assistant
Body: {
  message: string
  widget_id?: string
}
Response: { reply: string }
```

**Deep Crawl (Paid Feature):**
```typescript
POST /api/crawl-deep
Body: {
  url: string
  widgetId: string
}
Response: {
  success: boolean
  summary: string
  data: object
}
```

**Widget CRUD:**
```typescript
GET    /api/widgets              # List user's widgets
POST   /api/widgets              # Create widget
PATCH  /api/widgets/[id]         # Update widget
DELETE /api/widgets/[id]         # Delete widget
```

**Rules CRUD:**
```typescript
GET    /api/widget/[id]/rules    # List rules
POST   /api/widget/[id]/rules    # Create rule
DELETE /api/widget/[id]/rules/[ruleId]
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- OpenAI API key

### Initial Setup

```bash
# Clone repo (if needed)
git clone <repo-url>
cd lil-widget

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Then edit .env.local with your keys:
# - OPENAI_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - (optional) ANTHROPIC_API_KEY

# Run development server
npm run dev
# Opens at http://localhost:3000
```

### Database Setup

1. Create Supabase project
2. Run SQL from DEPLOYMENT_GUIDE.md (section 2.B)
3. Enable RLS policies (section 2.C)
4. Create `widget-logos` storage bucket (section 2.E)

---

## 💻 Common Development Tasks

### Testing the Widget Locally

1. Create a widget in dashboard
2. Copy embed code
3. Create `test.html`:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Test Page</h1>
  <script
    src="http://localhost:3000/widget.js"
    data-id="YOUR_WIDGET_ID"
    data-base-url="http://localhost:3000">
  </script>
</body>
</html>
```
4. Serve: `python -m http.server 8080`
5. Open: `http://localhost:8080/test.html`

### Adding a New Widget Customization

1. Update `widgets` table:
```sql
ALTER TABLE widgets
ADD COLUMN new_field text DEFAULT 'value';
```

2. Update TypeScript type in API route

3. Add UI in admin console

4. Update `widget.js` to use new field

### Adding a New API Endpoint

1. Create file: `/app/api/your-endpoint/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  // Your logic
  return Response.json({ success: true });
}
```

2. Add TypeScript types
3. Call from frontend
4. Test with curl or Postman

### Deploying Changes

```bash
# Commit changes
git add .
git commit -m "Description"

# Push to main (auto-deploys on Vercel)
git push origin main

# Check Vercel dashboard for deployment status
```

---

## 🎨 Design Patterns

### View/Edit Mode Pattern

Used throughout admin console:

```tsx
const [isEditing, setIsEditing] = useState(false);

// View Mode
{!isEditing ? (
  <div>
    <h2>{title}</h2>
    <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
  </div>
) : (
  // Edit Mode
  <div>
    <input value={title} onChange={...} />
    <button onClick={handleSave}>Save</button>
    <button onClick={() => setIsEditing(false)}>Cancel</button>
  </div>
)}
```

### Toast Notifications

```typescript
// Create toast container in layout
<div id="toast-container" />

// Show toast
const showToast = (message: string, type: 'success' | 'error') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.getElementById('toast-container')?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
```

### Supabase Client Pattern

```typescript
// Server components/API routes
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// Client components
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

---

## 🐛 Troubleshooting

### Widget Not Loading
- Check CORS settings in API routes
- Verify `NEXT_PUBLIC_EMBED_ORIGIN` env var
- Check browser console for errors
- Ensure `widget.js` is accessible

### Database Errors
- Verify RLS policies are set correctly
- Check service role key is in .env.local
- Ensure user is authenticated
- Check Supabase logs

### OpenAI API Errors
- Verify API key is valid
- Check rate limits
- Ensure proper error handling in chat endpoint
- Look at API usage dashboard

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

---

## 📝 Code Conventions

### Naming
- Components: `PascalCase.tsx`
- API routes: `route.ts` in folder
- Utilities: `camelCase.ts`
- Database: `snake_case`

### TypeScript
- Always use types (no `any`)
- Define API response types
- Use strict mode

### Tailwind
- Follow Panic design system (PANIC_DESIGN_SYSTEM.md)
- Use design tokens (colors, spacing)
- Mobile-first responsive design

### Comments
- JSDoc for functions
- Explain "why" not "what"
- TODO comments for future work

---

## 🔐 Security Notes

### RLS Policies
- All tables have RLS enabled
- Users can only access their own widgets
- Widget chat endpoints are public (validated by widget_id)
- Never expose service role key to client

### API Keys
- All keys in environment variables
- Never commit .env.local
- Use separate keys for dev/prod
- Rotate keys if compromised

### Input Validation
- Always sanitize user input
- Validate URLs before crawling
- Check file types/sizes for uploads
- Rate limit where appropriate

---

## 📚 Additional Resources

**Project Docs:**
- `WORKING_CHECKLIST.md` - Current tasks
- `PANIC_DESIGN_SYSTEM.md` - Design reference
- `CRAWL_TIERS.md` - Crawling system
- `DEPLOYMENT_GUIDE.md` - Production deployment

**External Docs:**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🆘 Getting Help

**Check First:**
1. This DEV_GUIDE.md
2. Error logs (Vercel/Supabase dashboard)
3. Browser console
4. Git history for related changes

**Still Stuck?**
- Review recent changes in git log
- Check if issue exists in production
- Search Supabase/Next.js docs
- Ask Claude Code for help 😊

---

**Remember:** Read this doc at the start of each session to get oriented!
