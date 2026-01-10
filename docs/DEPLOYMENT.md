# 🚀 Lil Widget - Production Deployment Guide

> **Status:** ✅ DEPLOYMENT COMPLETE
> This guide documents the deployment process that was successfully completed.
> Keep this for reference when making updates or troubleshooting production.

---

## Prerequisites

Before deploying to production, ensure you have:

- [ ] Vercel account (recommended) or other hosting platform
- [ ] Production Supabase project
- [ ] Production OpenAI API key
- [ ] Stripe account (if using payments)
- [ ] Domain name (optional but recommended)
- [ ] Resend account for transactional emails

---

## 1. Environment Variables

### Required for Production

Create these environment variables in your hosting platform (Vercel, etc.):

```bash
# OpenAI (Required for AI chat responses)
OPENAI_API_KEY=sk-...

# Anthropic Claude (Optional - for admin assistant features)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (Required if using payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App Configuration (Required)
NEXT_PUBLIC_BASE_URL=https://lilwidget.com
NEXT_PUBLIC_EMBED_ORIGIN=https://lilwidget.com

# Email (Required for email verification)
RESEND_API_KEY=re_...
```

### Important Notes

- **Never commit `.env.local` to git** - it's already in `.gitignore`
- Use **production API keys** for Stripe (sk_live_ and pk_live_)
- Use **production Supabase project** (separate from development)
- `NEXT_PUBLIC_BASE_URL` should be your production domain
- `NEXT_PUBLIC_EMBED_ORIGIN` should match your production domain for CORS

---

## 2. Supabase Production Setup

### A. Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for production
3. Wait for project to finish setting up (~2 minutes)

### B. Run Database Migrations

Execute these SQL commands in Supabase SQL Editor:

```sql
-- Create widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  persona_text TEXT,
  style TEXT DEFAULT 'style-1',
  position TEXT DEFAULT 'bottom-right',
  crawl_tier TEXT DEFAULT 'basic',
  customization JSONB,
  persona_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create widget_rules table
CREATE TABLE IF NOT EXISTS widget_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  visitor_id TEXT,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_msg_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_widgets_owner_id ON widgets(owner_id);
CREATE INDEX IF NOT EXISTS idx_widget_rules_widget_id ON widget_rules(widget_id);
CREATE INDEX IF NOT EXISTS idx_conversations_widget_id ON conversations(widget_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_widget_id ON messages(widget_id);
```

### C. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Widgets: Users can only access their own widgets
CREATE POLICY "Users can view own widgets"
  ON widgets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own widgets"
  ON widgets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own widgets"
  ON widgets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own widgets"
  ON widgets FOR DELETE
  USING (auth.uid() = owner_id);

-- Widget Rules: Users can manage rules for their widgets
CREATE POLICY "Users can manage rules for own widgets"
  ON widget_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = widget_rules.widget_id
      AND widgets.owner_id = auth.uid()
    )
  );

-- Conversations: Widget owners can view, public can create
CREATE POLICY "Widget owners can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = conversations.widget_id
      AND widgets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Messages: Widget owners can view, public can create
CREATE POLICY "Widget owners can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = messages.widget_id
      AND widgets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);
```

### D. Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set **Site URL** to your production domain
5. Add your production domain to **Redirect URLs**

### E. Configure Storage (for logo uploads)

1. Go to **Storage** → **Buckets**
2. Create bucket named `widget-logos`
3. Make it **public**
4. Set policies:

```sql
-- Allow anyone to read logos
CREATE POLICY "Public can read logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'widget-logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'widget-logos' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'widget-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 3. Deploy to Vercel

### A. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select **lil-widget** repository

### B. Configure Build Settings

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Root Directory:** `./` (leave blank)

### C. Add Environment Variables

Add all the environment variables from section 1 in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add each variable for **Production** environment
3. Click **Deploy** to redeploy with new variables

### D. Configure Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `lilwidget.com` or `app.lilwidget.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate to provision (~5 minutes)

---

## 4. Security Checklist

### CORS Configuration

- [ ] `NEXT_PUBLIC_EMBED_ORIGIN` matches production domain
- [ ] Widget.js CORS headers allow embedding on customer sites
- [ ] API routes properly validate widget IDs

### API Key Security

- [ ] All sensitive keys in environment variables (not committed)
- [ ] Using production keys (not test keys)
- [ ] Supabase service role key kept secret
- [ ] Stripe webhook secrets configured

### Authentication

- [ ] Email verification enabled
- [ ] Supabase RLS policies applied
- [ ] Auth routes protected with middleware
- [ ] Session cookies configured correctly

---

## 5. Testing Production Deployment

### After Deployment, Test:

- [ ] Sign up flow works
- [ ] Email verification works
- [ ] Widget creation works
- [ ] Basic crawl works
- [ ] Expanded crawl works (if paid)
- [ ] Widget embeds on external site
- [ ] Chat messages work
- [ ] Admin console accessible
- [ ] Payment flow works (if enabled)

### Test Widget Embedding

1. Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Widget</title>
</head>
<body>
  <h1>Test Page</h1>

  <!-- Replace with your production widget -->
  <script
    src="https://lilwidget.com/widget.js"
    data-id="YOUR_WIDGET_ID"
    data-base-url="https://lilwidget.com">
  </script>
</body>
</html>
```

2. Host it somewhere (Netlify, GitHub Pages, etc.)
3. Verify widget loads and chat works

---

## 6. Post-Deployment

### Monitoring

- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry recommended)
- [ ] Monitor Supabase usage
- [ ] Monitor OpenAI API usage
- [ ] Set up uptime monitoring

### Performance

- [ ] Enable Vercel Edge Functions if needed
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Review bundle size

### Documentation

- [ ] Update README with production URL
- [ ] Document any manual steps needed
- [ ] Create user guide
- [ ] Document API endpoints

---

## 7. Rollback Plan

If something goes wrong:

1. Vercel: Go to **Deployments** → Select previous deployment → **Promote to Production**
2. Database: Use Supabase point-in-time recovery if needed
3. Environment Variables: Keep backup of all production env vars

---

## 8. Common Issues & Solutions

### Widget Not Loading

- Check CORS settings in API routes
- Verify `NEXT_PUBLIC_EMBED_ORIGIN` is set correctly
- Check browser console for errors

### Authentication Issues

- Verify Supabase Site URL matches production domain
- Check Redirect URLs include production domain
- Verify email provider is enabled

### Database Errors

- Check RLS policies are applied
- Verify service role key is correct
- Check table indexes exist

### Stripe Issues

- Verify using live keys (not test keys)
- Check webhook endpoints are configured
- Verify price IDs match production

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- GitHub Issues: https://github.com/your-repo/lil-widget/issues

---

**Last Updated:** 2025-11-12
**Deployment Status:** ✅ Complete - In Production
**Production URL:** https://lilwidget.com
