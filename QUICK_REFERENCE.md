# 🚀 Quick Reference - Lil Widget

**One-page summary of project status, priorities, and next steps**

---

## 📍 WHERE WE ARE

**Project:** Lil Widget - Self-improving AI chat widget for SMBs
**Timeline:** Week 1 of 12-week roadmap
**Goal:** Launch and get first sale in 8-12 weeks
**Current Phase:** Phase 1 - Foundation & Onboarding
**Current Sprint:** Week 1 - Streamline Onboarding Flow

---

## ✅ COMPLETED SO FAR

### Core Features Working:
- ✅ Widget embed with OpenAI GPT-4 chat
- ✅ Conversation tracking and storage
- ✅ Admin console with widget management
- ✅ Rules system (add/edit/delete)
- ✅ Lil' Helper AI assistant
- ✅ AI Rule Suggestions
- ✅ Daily Summary with GPT-4 analysis
- ✅ Toast notifications
- ✅ Conversations dashboard
- ✅ Preview chat
- ✅ Generate persona from website

### What Works:
- Users can register and create widgets
- Widget can be embedded on any site (CORS enabled)
- Chat responds intelligently with persona + rules
- Admin can view conversations and promote to rules
- Daily summary analyzes last 24h of conversations

---

## 🎯 THIS WEEK'S FOCUS (Week 1)

**Goal:** New user can set up widget in under 5 minutes

### Top Priorities:
1. **Guided Setup Wizard** - Replace free-form create page with 3-step flow
2. **Onboarding Tooltips** - Add inline help in admin console
3. **Sample Conversations** - Pre-populate with examples so dashboard isn't empty
4. **Success Checklist** - Show progress: Widget created → Code installed → First conversation

**Why This Matters:**
Onboarding is the #1 risk factor. If users can't see value in 5 minutes, they'll churn. Everything else is meaningless if onboarding fails.

---

## 🔥 CRITICAL PATH TO LAUNCH

**Must-Have Before Selling:**
1. ✅ Widget chat works reliably ← DONE
2. ✅ Admin console is functional ← DONE
3. 🔲 Onboarding is under 5 minutes ← WEEK 1-3
4. 🔲 Stripe billing works ← WEEK 4-5
5. 🔲 Mobile optimization ← WEEK 2
6. 🔲 Professional landing page ← WEEK 10
7. 🔲 No major bugs ← ONGOING
8. 🔲 Privacy policy & ToS ← WEEK 10

**Can Add Post-Launch:**
- Advanced analytics
- Integrations (except email)
- A/B testing
- Multi-language
- API access

---

## 📋 NEXT 3 SPRINTS AT A GLANCE

### Week 1 (NOW): Streamline Onboarding
- Guided setup wizard (3 steps)
- Onboarding tooltips
- Sample conversations
- Success checklist

### Week 2: Widget Polish
- Conversation history (multi-turn context)
- Mobile optimization
- Error handling
- Widget customization (colors, logo)

### Week 3: Admin Improvements
- Expand daily summary with CTAs
- Performance metrics/charts
- Email notifications
- Help documentation

---

## 🎨 QUICK WINS (Easy Impact)

**Can Do Right Now:**
- [ ] Record 1-min Loom video for embed tutorial
- [ ] Write personality preset descriptions
- [ ] Draft sample conversations for 5 industries
- [ ] Design celebration animation for checklist completion
- [ ] Set up email templates for notifications

**Takes 1-2 Hours:**
- [ ] Add "Skip Tour" button to tooltips
- [ ] Create industry dropdown data
- [ ] Build progress bar component
- [ ] Add "Delete All Samples" button
- [ ] Improve embed code copy button feedback

---

## 💡 DECISIONS NEEDED

### Week 1 Questions:
1. **Tooltip Library:** React Joyride vs Intro.js vs custom?
   - Recommendation: React Joyride (most popular, good docs)

2. **Auto-generate rules by industry?**
   - Option A: Yes, 3-5 starter rules per industry (better onboarding)
   - Option B: No, keep it simple (less complexity)
   - Recommendation: Option A - helps users see value faster

3. **Sample conversations: Individual delete or bulk only?**
   - Recommendation: Bulk delete + auto-delete after first real conversation

4. **Tutorial video: Record now or placeholder?**
   - Recommendation: Use placeholder link for now, record professional version in Week 11

---

## 📁 KEY FILES TO KNOW

### Project Planning:
- `PROJECT_ROADMAP.md` - Full 12-week detailed roadmap
- `CURRENT_SPRINT.md` - Week 1 sprint board with tasks
- `QUICK_REFERENCE.md` - This file (one-page summary)

### Code Structure:
- `/app/api/widgets/` - Widget CRUD endpoints
- `/app/api/widget/[id]/chat/` - Chat endpoint (OpenAI integration)
- `/app/api/widget/[id]/rules/` - Rules management
- `/app/api/widgets/[id]/summary/` - Daily summary endpoint
- `/app/dashboard/widgets/[id]/admin-console/` - Main admin UI
- `/app/dashboard/conversations/` - Conversations list
- `/app/create/` - Widget creation (to be replaced with `/onboarding`)
- `/public/widget.js` - Embeddable widget script

### Database Tables (Supabase):
- `widgets` - Widget configurations
- `widget_rules` - Rules per widget
- `conversations` - Conversation metadata
- `messages` - Individual messages (role, content)

---

## 🐛 KNOWN ISSUES / TECH DEBT

**Critical:**
- None currently blocking

**Important:**
- [ ] Widget doesn't maintain conversation history across messages (needs multi-turn context)
- [ ] No mobile optimization yet
- [ ] No error tracking/monitoring (should add Sentry)
- [ ] No rate limiting on API endpoints

**Nice to Fix:**
- [ ] Toast notifications don't stack (only show one at a time)
- [ ] Admin console not responsive on mobile
- [ ] No loading states on some buttons

---

## 🎯 SUCCESS METRICS

### Week 1 Goals:
- [ ] Onboarding flow takes <5 minutes
- [ ] 90%+ wizard completion rate
- [ ] Sample conversations show value immediately
- [ ] Success checklist gets 80%+ completion

### Phase 1 Goals (Weeks 1-3):
- [ ] New user to first conversation: <5 minutes
- [ ] Zero "what do I do next?" support questions
- [ ] Widget works perfectly on mobile
- [ ] Help docs cover all major features

### Launch Goals (Week 12):
- [ ] 10 beta users signed up
- [ ] 100+ conversations processed
- [ ] 3 case studies/testimonials
- [ ] All must-haves complete

---

## 🚀 HOW TO GET STARTED TODAY

### If Starting Week 1 Work:
1. Read `CURRENT_SPRINT.md` for detailed tasks
2. Start with Priority 1: Guided Setup Wizard
3. Create `/app/onboarding/page.tsx` for Step 1
4. Test with real user flow (time yourself)

### If Checking Status:
1. Check `CURRENT_SPRINT.md` for task completion
2. Update daily standup notes
3. Mark completed tasks with [x]
4. Note any blockers

### If Planning Ahead:
1. Review `PROJECT_ROADMAP.md` for upcoming weeks
2. Identify dependencies or risks
3. Add notes in "Weekly Review" section
4. Adjust timeline if needed

---

## 🤝 RESOURCES

**Development:**
- Local: `http://localhost:3000`
- Database: Supabase (check .env for URL)
- API Docs: [To be created in Week 3]

**Business:**
- Target Market: SMBs (lawyers, dentists, consultants, local services)
- GTM Strategy: Direct outreach to 100 SMBs
- Pricing: Free → $9/mo → $49/mo → Custom

**Inspiration/Competitors:**
- Intercom (too expensive for SMBs)
- Drift (too complex)
- Tidio (good but not self-improving)
- Crisp (simple but limited AI)

**Differentiation:**
Lil Widget is the ONLY chat widget that:
1. Improves itself automatically based on conversations
2. Has a conversational admin (not just dashboards)
3. Is affordable for small businesses ($9/mo tier)
4. Takes 5 minutes to set up (not hours)

---

## 📞 WHEN YOU NEED HELP

**Stuck on Technical Implementation?**
- Check existing code patterns in `/app/api/` or `/app/dashboard/`
- Reference Next.js 15 / React 19 docs (new patterns)
- Supabase docs for database queries

**Stuck on Product Decisions?**
- Re-read user requirements in PROJECT_ROADMAP.md
- Focus on "easiest to onboard" principle
- When in doubt: simpler is better

**Lost Track of Progress?**
- Check this QUICK_REFERENCE.md for status
- Update CURRENT_SPRINT.md tasks
- Do weekly review and plan next week

---

**Last Updated:** [Date]
**Current Status:** 🟢 On Track - Week 1 Starting
**Next Milestone:** Complete Week 1 Sprint (Onboarding Flow)
