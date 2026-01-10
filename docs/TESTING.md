# Testing Guide

> Comprehensive testing guide for Lil Widget including markdown rendering, mobile responsiveness, and payment flows.

**Last Updated:** 2026-01-10

---

## Quick Testing Checklist

### Before Deploying:
- [ ] Markdown rendering works in all chat interfaces
- [ ] Mobile responsive at 375px width
- [ ] Payment flow works end-to-end
- [ ] Widget embeds correctly on external sites

---

## 1. Markdown Rendering Tests

### What to Test

The unified markdown system should render consistently across all chat interfaces:

| Location | Path |
|----------|------|
| Homepage Demo | `/` (click any personality) |
| Conversations Dashboard | `/dashboard/conversations` |
| Onboarding Test Chat | `/onboarding` (step 5) |
| Widget Frame | `/widget-frame?uid=...` |
| Embedded Widget | External site with embed code |

### Test Message

Use this message to test all formatting:

```
Hey! Here's what we offer:

**Services:**
- Web Design
- SEO Optimization
- Content Marketing

**Pricing:**
1. Basic: $500/month
2. Pro: $1,500/month
3. Enterprise: *Contact us*

Visit [our website](https://example.com) for more info!
```

### Expected Results

- [ ] **Bold text** renders as bold (not `**text**`)
- [ ] *Italic text* renders as italic (not `*text*`)
- [ ] Bullet lists show as actual bullets
- [ ] Numbered lists show as 1, 2, 3
- [ ] Links are underlined and clickable
- [ ] XSS is protected (`<script>` tags are escaped)

### Components Used

```
/utils/markdown.ts          - Unified markdown parser
/components/ChatMessage.tsx - Unified chat message component
```

---

## 2. Mobile Responsiveness Tests

### Screen Sizes to Test

| Device | Width | Priority |
|--------|-------|----------|
| iPhone SE | 375px | Critical |
| iPhone 12/13/14 | 390px | High |
| iPhone 14 Pro Max | 430px | Medium |
| iPad Mini | 768px | Medium |
| iPad Pro | 1024px | Low |

### How to Test

**Option 1: Chrome DevTools**
1. Open page in Chrome
2. Press F12 (DevTools)
3. Press Ctrl+Shift+M (Toggle Device Toolbar)
4. Select device from dropdown or enter custom width

**Option 2: Real Device**
1. Start dev server: `npm run dev`
2. Find local IP: `ifconfig | grep "inet "` (Mac)
3. On phone, visit: `http://YOUR_IP:3000`

### Pages to Test

#### Homepage (/)
- [ ] Hero section readable
- [ ] Personality selector (2x2 grid on mobile)
- [ ] Demo chat interface not overflowing
- [ ] Chat bubbles have proper margins
- [ ] Features section stacks vertically
- [ ] Pricing cards stack vertically

#### Onboarding (/onboarding)
- [ ] Step 1: Form inputs full width, industry grid 2 columns
- [ ] Step 2: Email verification buttons tappable
- [ ] Step 3: Stats grid readable
- [ ] Step 4: Personality buttons 2 columns on mobile
- [ ] Step 5: Chat messages have proper margins
- [ ] Step 6: Embed code scrollable horizontally

#### Conversations Dashboard
- [ ] Columns stack vertically on mobile
- [ ] Conversation list accessible
- [ ] Messages readable
- [ ] "Promote to Rule" button visible
- [ ] Scrolling works smoothly

#### Admin Console
- [ ] Sections stack vertically
- [ ] Forms usable
- [ ] Buttons tappable (min 44px)
- [ ] No horizontal scroll

### Mobile Checklist

**Typography:**
- [ ] Body text min 14px
- [ ] Input text 16px (prevents iOS zoom)
- [ ] Headings scale appropriately

**Touch Targets:**
- [ ] All buttons min 44x44px
- [ ] Links have adequate padding
- [ ] Form inputs easy to tap

**Layout:**
- [ ] No horizontal scrolling (except code blocks)
- [ ] Content doesn't overflow
- [ ] Grids reduce columns on mobile
- [ ] Fixed elements don't cover content

---

## 3. Payment Flow Tests

### Prerequisites
- Stripe test mode enabled (or live mode for production)
- Valid Stripe API keys in environment

### Test Cards

**Success:**
```
4242 4242 4242 4242  (Visa)
5555 5555 5555 4444  (Mastercard)
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Declined:**
```
4000 0000 0000 0002  (Generic decline)
4000 0000 0000 9995  (Insufficient funds)
```

**3D Secure:**
```
4000 0025 0000 3155  (Requires authentication)
```

### Test Flow

1. **Navigate to upgrade page:** `/dashboard/upgrade`
2. **Verify current plan shows:** "Basic Plan" with conversation counter
3. **Click "Upgrade to Growth"**
4. **Verify payment form loads:**
   - [ ] Button changes to "Loading payment..."
   - [ ] Stripe card input appears
5. **Enter test card details**
6. **Click "Subscribe to Growth Plan"**
7. **Verify success:**
   - [ ] Redirects to `/dashboard/upgrade?success=true`
   - [ ] Shows "You're on the Growth Plan!"
   - [ ] User tier updated in database

### Webhook Testing

Verify these Stripe events are handled:
- [ ] `checkout.session.completed`
- [ ] `invoice.payment_succeeded`
- [ ] `customer.subscription.deleted`

**Webhook URL:** `https://www.lilwidget.com/api/stripe/webhook`

---

## 4. Widget Embedding Tests

### Create Test Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Test Page</h1>
  <p>Testing the embedded widget...</p>

  <script
    src="http://localhost:3000/widget.js"
    data-id="YOUR_WIDGET_ID"
    data-base-url="http://localhost:3000">
  </script>
</body>
</html>
```

### Test Checklist

- [ ] Widget bubble appears in bottom-right
- [ ] Click bubble opens chat interface
- [ ] Send message, receive response
- [ ] Markdown renders in responses
- [ ] Minimize button works
- [ ] State persists in localStorage
- [ ] Mobile: Full-screen mode works
- [ ] Mobile: Safe area insets respected

### CORS Testing

If widget doesn't load on external site:
1. Check `NEXT_PUBLIC_EMBED_ORIGIN` env var
2. Verify API routes have CORS headers
3. Check browser console for errors

---

## 5. End-to-End Test Scenarios

### Scenario 1: New User Signup

1. Go to `/register`
2. Create account with email
3. Verify email (or skip on localhost)
4. Complete onboarding (all 6 steps)
5. Copy embed code
6. Test widget on external page
7. Check conversations appear in dashboard

### Scenario 2: Upgrade Flow

1. Login as free tier user
2. Go to `/dashboard/upgrade`
3. Click upgrade button
4. Complete payment
5. Verify tier updated
6. Verify limits increased (50 -> 500)

### Scenario 3: Conversation Management

1. Have conversation via widget
2. View in conversations dashboard
3. Markdown renders correctly
4. Promote response to rule
5. Rule appears in admin console
6. Widget uses new rule

---

## 6. Test Results Template

```
Tester: _______________
Date: _______________
Browser: _______________
Device: _______________

MARKDOWN RENDERING:
| Location          | Bold | Lists | Links | Pass |
|-------------------|------|-------|-------|------|
| Homepage Demo     | [ ]  | [ ]   | [ ]   | [ ]  |
| Conversations     | [ ]  | [ ]   | [ ]   | [ ]  |
| Onboarding Test   | [ ]  | [ ]   | [ ]   | [ ]  |
| Embedded Widget   | [ ]  | [ ]   | [ ]   | [ ]  |

MOBILE (375px):
| Page              | Layout | Touch | Text | Pass |
|-------------------|--------|-------|------|------|
| Homepage          | [ ]    | [ ]   | [ ]  | [ ]  |
| Onboarding        | [ ]    | [ ]   | [ ]  | [ ]  |
| Conversations     | [ ]    | [ ]   | [ ]  | [ ]  |
| Admin Console     | [ ]    | [ ]   | [ ]  | [ ]  |

PAYMENT:
| Step                    | Pass |
|-------------------------|------|
| Upgrade button works    | [ ]  |
| Payment form loads      | [ ]  |
| Test card accepted      | [ ]  |
| Success redirect        | [ ]  |
| Tier updated            | [ ]  |

ISSUES FOUND:
1. _______________________
2. _______________________
3. _______________________
```

---

## Common Issues

### Markdown Not Rendering
- Verify using `<ChatMessage />` component
- Check import from `/components/ChatMessage.tsx`
- Check browser console for errors

### Mobile Layout Broken
- Check Tailwind responsive classes (sm:, md:, lg:)
- Verify max-width constraints
- Test with DevTools mobile emulation

### Widget Not Loading
- Check CORS configuration
- Verify `NEXT_PUBLIC_EMBED_ORIGIN`
- Check browser console for blocked requests

### Payment Failing
- Verify Stripe keys are correct (test vs live)
- Check webhook URL includes `www.` if needed
- Check Vercel logs for API errors
