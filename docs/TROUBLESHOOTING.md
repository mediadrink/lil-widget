# Troubleshooting Guide

> Solutions to common issues with Lil Widget.

**Last Updated:** 2026-01-10

---

## Quick Fixes

| Issue | Solution |
|-------|----------|
| Widget not loading | Check CORS settings, verify embed origin |
| Emails not sending | Configure custom SMTP in Supabase |
| Payment failing | Verify Stripe keys, check webhook URL |
| Database errors | Check RLS policies, verify service role key |

---

## 1. Email Verification Issues

### Problem: Verification emails not sending

**Root Cause:** Supabase's default SMTP is limited and unreliable for production.

### Solution: Configure Custom SMTP

#### Option A: SendGrid (Recommended)

1. **Create SendGrid Account:**
   - Sign up: https://signup.sendgrid.com/
   - Verify your email

2. **Create API Key:**
   - Dashboard -> Settings -> API Keys
   - Click "Create API Key"
   - Name: "Lil Widget"
   - Permissions: "Full Access"
   - Copy the API key (starts with "SG.")

3. **Verify Sender Email:**
   - Dashboard -> Settings -> Sender Authentication
   - Click "Verify a Single Sender"
   - Complete verification

4. **Configure in Supabase:**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [Your SendGrid API key]
   Sender Email: [Your verified email]
   Sender Name: Lil Widget
   ```

#### Option B: Gmail (Quick Setup)

1. **Get App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Create password named "Lil Widget Supabase"
   - Copy the 16-character password

2. **Configure in Supabase:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP Username: your-email@gmail.com
   SMTP Password: [16-char app password]
   Sender Email: your-email@gmail.com
   Sender Name: Lil Widget
   ```

### Configure Site URLs

**Supabase Dashboard -> Authentication -> URL Configuration:**

- **Site URL:** `https://lilwidget.com`
- **Redirect URLs:**
  - `https://lilwidget.com/**`
  - `https://www.lilwidget.com/**`
  - `http://localhost:3000/**` (for dev)

### Common Email Errors

| Error | Fix |
|-------|-----|
| "Email rate limit exceeded" | Set up custom SMTP |
| "Invalid SMTP configuration" | Check username/password |
| "Sender not verified" | Verify sender in SendGrid |
| "Not authenticated" | Refresh page, try again |

---

## 2. Payment/Upgrade Issues

### Problem: Upgrade button not working

**Symptoms:**
- Button shows alert instead of payment form
- Payment form doesn't load
- Payment succeeds but tier not updated

### Solution: Fix Payment Flow

#### Check Stripe Configuration

1. **Environment Variables:**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Webhook URL:**
   - Must include `www.` if your site uses it
   - Correct: `https://www.lilwidget.com/api/stripe/webhook`
   - Wrong: `https://lilwidget.com/api/stripe/webhook` (causes 307 redirect)

3. **Webhook Events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

#### Test Payment Flow

1. Navigate to `/dashboard/upgrade`
2. Click "Upgrade to Growth"
3. Should see payment form load
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Verify redirect to success page
7. Check user tier in database

### Manual User Upgrade

If a user paid but webhook failed:

```javascript
// scripts/manual-upgrade-user.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { error } = await supabase.auth.admin.updateUserById(
  'USER_ID_HERE',
  {
    user_metadata: {
      subscription_tier: 'paid',
      stripe_customer_id: 'cus_...',
      stripe_subscription_id: 'sub_...'
    }
  }
);
```

---

## 3. Widget Loading Issues

### Problem: Widget not appearing on external site

**Symptoms:**
- Widget bubble doesn't show
- Console shows CORS errors
- Widget loads but chat doesn't work

### Solution: Check CORS Configuration

1. **Environment Variable:**
   ```bash
   NEXT_PUBLIC_EMBED_ORIGIN=https://lilwidget.com
   ```

2. **API Route CORS Headers:**
   ```typescript
   // In API routes that widget calls
   return new Response(JSON.stringify(data), {
     headers: {
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
       'Access-Control-Allow-Headers': 'Content-Type',
     }
   });
   ```

3. **Verify widget.js is accessible:**
   ```bash
   curl https://lilwidget.com/widget.js
   ```

### Problem: Widget bubble appears but clicking does nothing

**Cause:** Container missing positioning styles.

**Fix:** Check `public/widget.js` has proper CSS for container:
```javascript
container.style.cssText = `
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: 999999 !important;
`;
```

---

## 4. Database Issues

### Problem: "Permission denied" or empty results

**Cause:** Row Level Security (RLS) policies not configured.

### Solution: Check RLS Policies

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check existing policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';
```

### Common Policy Issues

**Widgets not showing:**
```sql
-- Users can view own widgets
CREATE POLICY "Users can view own widgets"
  ON widgets FOR SELECT
  USING (auth.uid() = owner_id);
```

**Conversations not accessible:**
```sql
-- Widget owners can view conversations
CREATE POLICY "Widget owners can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = conversations.widget_id
      AND widgets.owner_id = auth.uid()
    )
  );
```

---

## 5. Build Errors

### TypeScript Errors

```bash
# Check all TypeScript errors
npm run type-check

# Or build with verbose output
npm run build 2>&1 | head -100
```

### Clear Cache

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Common Build Fixes

| Error | Fix |
|-------|-----|
| "Module not found" | Check import paths, case sensitivity |
| "Type 'X' is not assignable" | Add proper types, no `any` |
| "Cannot find module" | Run `npm install` |
| Out of memory | Increase Node memory: `NODE_OPTIONS=--max_old_space_size=4096` |

---

## 6. OpenAI API Issues

### Problem: Chat not responding

**Check:**
1. API key valid: `echo $OPENAI_API_KEY`
2. Rate limits: Check OpenAI dashboard
3. Error logs: Check Vercel function logs

### Common OpenAI Errors

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Invalid API key |
| 429 Rate limit | Reduce requests, upgrade plan |
| 500 Server error | Retry with exponential backoff |
| Timeout | Reduce prompt size, use streaming |

---

## 7. Development Issues

### Hot Reload Not Working

```bash
# Kill any zombie processes
lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9

# Restart dev server
npm run dev
```

### Environment Variables Not Loading

1. Ensure `.env.local` exists in project root
2. Restart dev server after changes
3. Use `NEXT_PUBLIC_` prefix for client-side vars

### Supabase Connection Issues

```bash
# Test connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/ \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

---

## 8. Debugging Tips

### Server Logs (Vercel)

1. Go to Vercel Dashboard -> Your Project
2. Click "Logs" tab
3. Filter by function name or error level

### Browser Console

1. Open DevTools (F12)
2. Console tab for errors
3. Network tab for API failures

### Database Queries

```sql
-- Check recent errors
SELECT * FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10;

-- Check user metadata
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'user@example.com';
```

---

## Getting Help

**Check First:**
1. This troubleshooting guide
2. Error logs (Vercel/Supabase dashboard)
3. Browser console
4. Git history for related changes

**Still Stuck?**
- Review recent changes in git log
- Check if issue exists in production vs local
- Search Supabase/Next.js docs
- Check Stripe dashboard for payment issues

**External Resources:**
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Stripe Docs: https://stripe.com/docs
- OpenAI Docs: https://platform.openai.com/docs
