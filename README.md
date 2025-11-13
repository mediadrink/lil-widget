# Lil Widget 💬

An AI-powered embeddable chat widget platform that learns from your website and gets smarter over time.

**Status:** 🚀 Launched & in production!

## 🎯 What It Does

Lil Widget allows you to:
1. **Create AI chat widgets** for your website
2. **Auto-generate personality** by crawling your website
3. **Manage custom rules** to guide chatbot behavior
4. **Track conversations** with visitors
5. **Get AI suggestions** for optimizing your widget
6. **Promote good responses** to permanent rules

## 🚀 Key Features

### For Widget Owners
- **Website Crawling** - AI analyzes your website and creates a custom chatbot persona
- **Custom Rules** - Add specific instructions for your chatbot to follow
- **AI Rule Suggestions** - Get intelligent recommendations based on conversations
- **Conversation Analytics** - View all visitor chats in your dashboard
- **Easy Embedding** - One-line script tag to add to your site
- **Preview Mode** - Test your widget before deploying

### For Visitors
- **Smart AI Responses** - Powered by GPT-4 with custom context
- **Persistent Conversations** - Chat history maintained during session
- **Clean UI** - Shadow DOM ensures no style conflicts
- **Mobile Friendly** - Responsive design works everywhere

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Payments**: Stripe (currently disabled)
- **Styling**: Tailwind CSS 4

### Database Schema

```
widgets
├── id (uuid)
├── owner_id (uuid, references auth.users)
├── title (text)
├── url (text)
├── persona_text (text)
├── style (text)
└── position (text)

widget_rules
├── id (uuid)
├── widget_id (uuid, references widgets)
├── text (text)
├── version (text, nullable)
└── created_at (timestamp)

conversations
├── id (uuid)
├── widget_id (uuid, references widgets)
├── visitor_id (text, nullable)
├── status (text)
├── started_at (timestamp)
└── last_msg_at (timestamp)

messages
├── id (uuid)
├── conversation_id (uuid, references conversations)
├── widget_id (uuid, references widgets)
├── role (text: "user" | "assistant")
├── content (text)
└── created_at (timestamp)
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- OpenAI API key

### Environment Variables

Create `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (optional, currently disabled)
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_EMBED_ORIGIN=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📖 Usage

### Creating a Widget

1. **Sign up / Log in**
   - Navigate to `/register` to create an account
   - Uses Supabase Auth

2. **Create Widget**
   - Go to Dashboard → Admin Console
   - Enter widget title and website URL
   - Click "Generate from site" to auto-create persona
   - Or manually write your persona/instructions

3. **Add Rules**
   - Add custom rules in the "Your Widget Rules" section
   - Or use "Generate Suggestions" to get AI recommendations
   - Rules guide how the chatbot responds

4. **Get Embed Code**
   - Copy the embed code from the sidebar
   - Paste into your website's `<head>` or before `</body>`

```html
<script
  src="https://your-domain.com/widget.js"
  data-id="your-widget-id"
  data-base-url="https://your-domain.com">
</script>
```

### Managing Conversations

1. **View Conversations**
   - Go to Dashboard → Conversations
   - See all visitor chats across all widgets

2. **Promote to Rule**
   - Find a good assistant response
   - Click "Promote to Rule"
   - It becomes a permanent instruction

## 🔧 API Endpoints

### Widget Chat
```
POST /api/widget/[widgetId]/chat
Body: { message, conversationId?, visitorId? }
Response: { conversationId, reply }
```

### Widget Rules
```
GET  /api/widget/[widgetId]/rules
POST /api/widget/[widgetId]/rules
Body: { text, version? }
```

### Admin Assistant
```
POST /api/admin-assistant
Body: { message, widget_id }
Response: { reply }
```

### Crawl Website
```
POST /api/crawl-summary
Body: { url }
Response: { persona, instructions }
```

### Conversations
```
GET /api/conversations
GET /api/conversations/[id]/messages
```

## 🎨 Customization

### Widget Styling

The embed widget uses Shadow DOM with inline styles. To customize:

1. **Edit `/public/widget.js`**
   - Modify `.widget-container` styles
   - Change colors, fonts, sizing
   - Adjust positioning

2. **Widget Position Options** (in dashboard)
   - `bottom-right` (default)
   - `bottom-left`
   - `top-right`
   - `top-left`

3. **Widget Styles** (in dashboard)
   - Style 1: Default clean design
   - Style 2: Alternative theme (customize as needed)

## 🧪 How It Works

### Widget Chat Flow

1. User types message in embedded widget
2. Widget calls `/api/widget/[widgetId]/chat`
3. API fetches:
   - Widget persona from `widgets` table
   - Active rules from `widget_rules` table
4. Builds system message:
   ```
   {persona}

   Important rules to follow:
   1. {rule 1}
   2. {rule 2}
   ...
   ```
5. Sends to OpenAI GPT-4
6. Logs user message and assistant reply to `messages` table
7. Returns reply to widget
8. Widget displays response

### Admin Assistant Flow

1. Admin asks question or requests suggestions
2. API fetches:
   - Widget details (title, URL, persona)
   - Existing rules
   - Recent conversation samples (up to 20 messages from 5 conversations)
3. Builds context-rich system prompt
4. Sends to GPT-4 with admin's question
5. Returns suggestions formatted as numbered list
6. Admin can add suggestions as rules with one click

## 📊 Database Optimization

### Suggested Indexes

```sql
-- Conversations by widget
CREATE INDEX idx_conversations_widget_id ON conversations(widget_id);

-- Messages by conversation
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Messages by widget (for analytics)
CREATE INDEX idx_messages_widget_id ON messages(widget_id);

-- Rules by widget
CREATE INDEX idx_widget_rules_widget_id ON widget_rules(widget_id);

-- Conversations by date
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);
```

## 🔐 Security

### Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Widgets: Users can only see/edit their own
CREATE POLICY "Users can view own widgets"
  ON widgets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own widgets"
  ON widgets FOR UPDATE
  USING (auth.uid() = owner_id);

-- Widget Rules: Via widget ownership
CREATE POLICY "Users can manage rules for own widgets"
  ON widget_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = widget_rules.widget_id
      AND widgets.owner_id = auth.uid()
    )
  );

-- Messages: Public read for widget functionality
-- (Visitors need to read/write, but filtered by widget_id)
```

## ✅ Launched Features

### Core Features (Completed)
- ✅ Conversation context (multi-turn conversations with history)
- ✅ Widget themes and customization (colors, logo, position)
- ✅ Collapsible widget (minimize/maximize)
- ✅ Typing indicators
- ✅ Mobile optimization
- ✅ Deep website crawling for knowledge base
- ✅ Guided onboarding wizard
- ✅ Error handling with retry logic

### Future Enhancements
- [ ] Rate limiting for API endpoints
- [ ] Visitor identification (fingerprinting or sessions)
- [ ] Advanced analytics dashboard
- [ ] Streaming responses
- [ ] File/image support
- [ ] Multi-language support
- [ ] Enable Stripe subscriptions
- [ ] A/B testing for rules
- [ ] Export conversations as CSV
- [ ] Webhook notifications
- [ ] Integrations (Slack, email, CRM)

## 🐛 Known Issues

1. **No rate limiting**: API endpoints could use rate limiting middleware
2. **Public widget.js**: Served as static file (consider CDN for better performance)
3. **Message count**: `conversations.message_count` not auto-updated (needs trigger)
4. **No error tracking**: Consider adding Sentry or similar for production monitoring
5. **Visitor tracking**: Could improve visitor identification/fingerprinting

## 📝 Development Notes

### Database Migrations

If you need to modify the schema, create migrations in Supabase dashboard:

```sql
-- Example: Add widget color customization
ALTER TABLE widgets ADD COLUMN primary_color text DEFAULT '#007aff';
ALTER TABLE widgets ADD COLUMN background_color text DEFAULT '#ffffff';
```

### Testing

```bash
# Run dev server
npm run dev

# Test widget embedding
# 1. Create a test HTML file with embed code
# 2. Serve it with: python -m http.server 8080
# 3. Open http://localhost:8080/test.html
```

### Deployment

**Vercel** (recommended):
```bash
# Connect your repo to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push to main
```

**Other platforms**:
- Ensure Node.js 18+ runtime
- Set all environment variables
- Build command: `npm run build`
- Start command: `npm start`

## 🤝 Contributing

This is a personal project, but feel free to:
- Open issues for bugs
- Suggest features
- Fork and experiment

## 📄 License

MIT License - feel free to use this for your own projects.

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

Made with ❤️ by your friendly neighborhood developer
