# Changelog

All notable changes to Lil Widget are documented here.

---

## [1.0.0] - 2025-11-12 - Production Launch

### Launched Features

**Core Functionality:**
- Widget embed system with CORS support
- OpenAI GPT-4 chat integration
- Widget persona and rules system
- Conversation tracking and storage
- Admin console with widget settings
- Rule management (add, edit, delete)
- Lil' Helper AI assistant for Q&A
- AI Rule Suggestions generator
- Daily Summary report with GPT-4 analysis
- Toast notification system
- Preview chat in admin console
- Embed code generator
- Generate persona from website
- Promote conversation to rule
- Conversations dashboard with filtering

**Widget Features:**
- Conversation history (multi-turn context)
- Widget themes and customization (colors, logo, position)
- Collapsible widget (minimize/maximize)
- Typing indicators
- Mobile optimization
- Deep website crawling for knowledge base
- Error handling with retry logic

**Onboarding:**
- Guided 3-step onboarding wizard
- Industry presets with recommended tones
- Sample conversation generation
- Success checklist

**Technical Infrastructure:**
- Next.js 15 + React 19 setup
- Supabase database with RLS
- Authentication system
- API routes for all features

---

## [1.1.0] - 2025-11-17 - Payment & Polish

### Major Fixes

**Payment Flow:**
- Fixed Stripe payment processing (subscriptions now work)
- Fixed webhook URL (www subdomain issue)
- Added manual PaymentIntent creation fallback
- Created manual upgrade script for failed webhooks

**Widget Improvements:**
- Fixed widget positioning bug (container CSS)
- Added widget to lilwidget.com homepage (dogfooding)

**UI/UX:**
- Redesigned homepage pricing (3-tier display)
- Fixed copy embed code feedback ("Copied!")
- Fixed upgrade page API endpoint
- Added extensive debugging with emoji indicators

### Technical Details

**Payment Flow (Fixed):**
```
1. User clicks "Upgrade to Growth"
2. Frontend calls /api/create-subscription
3. Backend creates Stripe customer + subscription
4. Backend manually creates PaymentIntent ($19.00)
5. Returns clientSecret to frontend
6. Stripe Payment Form loads
7. User enters card details
8. Payment processes
9. Webhook fires: invoice.payment_succeeded
10. User upgraded to paid tier
```

**Stripe Configuration:**
- Mode: Live
- Webhook URL: `https://www.lilwidget.com/api/stripe/webhook`
- Price: $19.00/month

---

## [1.2.0] - 2025-11-17 - Responsive & Consistency

### Unified Components

**Created:**
- `/utils/markdown.ts` - Single markdown parser
- `/components/ChatMessage.tsx` - Unified chat message component

**Updated:**
- Homepage Demo Widget - uses ChatMessage
- Conversations Dashboard - uses ChatMessage
- Widget Frame - uses ChatMessage
- Onboarding Test Chat - uses ChatMessage

### Responsive Fixes

- Chat message margins responsive (ml-6 mobile, ml-12 desktop)
- Industry grid responsive (2 cols mobile, 3-4 desktop)
- Removed duplicate markdown parsers

### Impact

- Consistent markdown rendering everywhere
- Bold, italic, lists, links work in all chat interfaces
- Better mobile experience
- Easier maintenance (1 parser vs 4)

---

## [1.3.0] - 2025-12-03 - SEO & Homepage Redesign

### SEO Complete

- Meta tags and Open Graph tags
- Generated sitemap.xml
- Added robots.txt
- Created OG image for social sharing
- Updated favicon and app icons

### Homepage Redesign

**Design System:**
- Rubik font family
- Coral primary color (#F25C6E) from gear logo
- Floating nav over animated gradient hero
- Feature cards with gradient icons
- Dark featured pricing tier
- Animated gradient CTA section
- Dark footer
- Polished modals

**Inspired by:** Intercom, Ada.cx, Kustomer

### Other Updates

- Stripe statement descriptor: "MEDIADRINK LILWIDGET"
- Google Analytics setup

---

## Development History

### Original Roadmap (Completed in ~6 weeks)

**Phase 1: Foundation & Onboarding (Weeks 1-3)**
- Guided setup wizard
- Conversation history
- Mobile optimization
- Widget customization
- Typing indicators
- Minimize/maximize

**Phase 2: Widget Polish & Reliability**
- Error handling with retry
- Deep crawl for paid tier
- View/edit mode pattern
- Realistic widget preview

**Phase 3: Admin Experience**
- Lil' Helper floating assistant
- Conversations dashboard
- Rule promotion from conversations

**Phase 4: Launch Prep**
- Production deployment
- Documentation
- Testing

### Pre-Launch Improvements

**View/Edit Mode Pattern:**
- Widget title & URL section
- Widget personality section
- Clear save/cancel flow

**Persistent Lil' Helper:**
- Floating button bottom-right
- Modal interface with tips
- Context-aware (passes widget ID)

**Enhanced Persona Creator:**
- 8 tone modifiers
- 9 industry presets
- Live persona preview

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.3.0 | 2025-12-03 | SEO, Homepage redesign |
| 1.2.0 | 2025-11-17 | Unified components, responsive fixes |
| 1.1.0 | 2025-11-17 | Payment flow, widget fixes |
| 1.0.0 | 2025-11-12 | Production launch |

---

## Contributors

Built with Next.js, Supabase, OpenAI, and Tailwind CSS.

Co-Authored-By: Claude <noreply@anthropic.com>
