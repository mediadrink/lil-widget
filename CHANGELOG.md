# Changelog

All notable changes to Lil Widget are documented here.

---

## [1.4.1] - 2026-01-22 - Public API: sendMessage

### New Feature

**sendMessage API:**
- Added `window.LilWidget[widgetId].sendMessage(message, autoSend)` method
- Allows external sites to programmatically send messages to the widget
- Opens widget automatically if minimized
- `autoSend` parameter (default: true) controls whether message is sent immediately
- Use case: CivicOS "Challenge Question" buttons that pass context to chatbot

### Bug Fix

- Fixed `open()` method not showing widget when already loaded but hidden

---

## [1.4.0] - 2026-01-15 - Widget Modernization & External API

### Widget UI Overhaul

**New Design:**
- Modernized header with gradient icon background
- Pill-shaped input field (rounded corners)
- Circular send button with paper airplane icon
- Gradient backgrounds on interactive elements
- Better message area height (min 280px, max 380px)
- Improved hover effects with scale and shadow

**Style Presets:**
- 6 beautiful presets: Modern, Minimal, Warm, Midnight, Glass, Nature
- Each preset has unique font (Inter, DM Sans, Nunito, Space Grotesk, Source Sans 3)
- Dynamic Google Font loading - fonts load automatically
- Glass preset with frosted blur effect (backdrop-filter)
- Midnight preset with dark mode styling

**Style Features:**
- "Match My Site" analyzes website and generates custom style
- Header icons (emoji) for each preset
- Preview in admin console shows actual styling
- Gradient backgrounds for Glass/Midnight preview

### External Knowledge Base API

**New Feature:**
- Connect widget to external knowledge base API
- Toggle between "Web Crawl" and "External API" modes
- Configure API URL and optional Bearer token
- Test connection button validates endpoint
- Expected format: `{ question: "..." }` → `{ answer: "...", sources: [...] }`

### Bug Fixes

- Fixed widget not reopening after being minimized
- Fixed config endpoint missing `style` property
- Fixed OpenAI model errors (gpt-4 → gpt-4o)
- Removed non-existent `auto_open_delay` column from queries
- Added cache busting to widget.js script tag

### Technical Updates

- Next.js updated to 16.1.1 (security fix)
- Added toast feedback when style preset is applied
- Improved admin preview with theme-specific styling
- Removed widget embed from lilwidget.com homepage

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

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.1 | 2026-01-22 | sendMessage public API for external triggers |
| 1.4.0 | 2026-01-15 | Widget modernization, Glass theme, External API |
| 1.3.0 | 2025-12-03 | SEO, Homepage redesign |
| 1.2.0 | 2025-11-17 | Unified components, responsive fixes |
| 1.1.0 | 2025-11-17 | Payment flow, widget fixes |
| 1.0.0 | 2025-11-12 | Production launch |

---

## Contributors

Built with Next.js, Supabase, OpenAI, and Tailwind CSS.

Co-Authored-By: Claude <noreply@anthropic.com>
