# TODO

> Active tasks and backlog for Lil Widget development.

**Last Updated:** 2026-01-10
**Status:** Production - Homepage Redesign Complete

---

## High Priority (Do Next)

### Testing
- [ ] End-to-end payment flow testing with test cards
- [ ] Enforce conversation limits (50 free / 500 paid)
- [ ] Mobile responsive testing across devices
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

### Still TODO
- [ ] Switch Stripe to Test Mode for development
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Monitor production errors and fix critical bugs
- [ ] Optimize page speed

### Analytics
- [x] Set up Google Analytics
- [ ] Add conversion tracking (signups, upgrades)
- [ ] Event tracking (widget installs, conversations)

---

## In Progress

_Nothing currently in progress_

---

## Backlog

### User Experience
- [ ] Add "Getting Started" video tutorial
- [ ] Create help center or FAQ page
- [ ] Improve error messages with helpful links
- [ ] Add changelog/release notes page
- [ ] Better onboarding success metrics tracking

### Performance & Reliability
- [ ] Add rate limiting to API endpoints
- [ ] Implement API request caching
- [ ] Optimize widget.js bundle size
- [ ] Add loading states to all async operations
- [ ] Improve error retry logic

### Features
- [ ] Stripe billing integration
- [ ] Advanced analytics dashboard
- [ ] Email notifications for new conversations
- [ ] Slack integration
- [ ] Export conversations as CSV
- [ ] Webhook system for integrations
- [ ] Visitor identification/fingerprinting
- [ ] Streaming responses (OpenAI streaming)
- [ ] A/B testing for rules
- [ ] Multi-language support

### Admin Console
- [ ] Bulk edit/delete rules
- [ ] Rule categories/organization
- [ ] Search conversations by content
- [ ] Filter conversations by date range
- [ ] Conversation sentiment analysis
- [ ] Auto-archive old conversations

### Widget Improvements
- [ ] File/image upload support
- [ ] Voice input option
- [ ] Widget themes marketplace
- [ ] Canned responses / quick replies
- [ ] Proactive chat triggers (time on page, etc)
- [ ] Offline mode support

### Marketing & Growth
- [ ] Write blog post about launch
- [ ] Create demo video for landing page
- [ ] Reach out to early users for testimonials
- [ ] Share on Product Hunt / Hacker News
- [ ] Create comparison pages (vs Intercom, Drift, etc)

### DevOps
- [ ] Set up staging environment
- [ ] Automated testing (Jest, Playwright)
- [ ] CI/CD improvements
- [ ] Database backup automation
- [ ] Performance monitoring dashboard

---

## Ideas / Future

- Widget marketplace (let users browse/install widgets)
- White-label option for agencies
- API for developers
- Browser extension for testing widgets
- Widget templates library
- Team collaboration features
- Custom domain for widget hosting
- Mobile app for managing widgets

---

## Recently Completed

### 2025-12-03 - Design & SEO Session
- [x] SEO complete - Meta tags, Open Graph, sitemap.xml, robots.txt
- [x] OG image added - Social sharing preview image
- [x] Favicon updated - Custom gear icon replacing Vercel default
- [x] Homepage redesign - Modern premium styling
- [x] Stripe statement descriptor - Updated to "MEDIADRINK LILWIDGET"

### 2025-11-17 - Major Session
- [x] Fixed Stripe payment flow
- [x] Fixed Stripe webhook (www subdomain)
- [x] Fixed widget positioning
- [x] Added widget to homepage
- [x] Redesigned homepage pricing
- [x] Fixed upgrade page
- [x] Fixed copy embed code

### 2025-11-12 - Documentation
- [x] Updated all docs to reflect launched status
- [x] Created DEV_GUIDE.md
- [x] Created WORKING_CHECKLIST.md
- [x] Archived sprint/roadmap docs

---

## Known Bugs

- [ ] Switch to Stripe test mode for development (currently live mode)
- [ ] Conversation limits not enforced (should block at 50/500)
- [ ] Branding removal not implemented for paid users
- [ ] Expanded crawl not implemented for paid tier

---

## Decisions Needed

- Which analytics platform to use? (GA, PostHog, Mixpanel?)
- What error monitoring tool? (Sentry recommended)
- Should we prioritize email notifications or Slack integration?
- When to launch on Product Hunt / Hacker News?

---

**Remember to update this file at the end of each work session!**
