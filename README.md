# Lil Widget

An AI-powered embeddable chat widget that learns from your website and gets smarter over time.

**Status:** Production
**URL:** https://lilwidget.com

---

## What It Does

Lil Widget lets you:
1. **Create AI chat widgets** for your website
2. **Auto-generate personality** by crawling your site
3. **Manage custom rules** to guide chatbot behavior
4. **Track conversations** with visitors
5. **Get AI suggestions** for improving responses

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your keys to .env.local:
# OPENAI_API_KEY=sk-...
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Run development server
npm run dev
```

### Embed a Widget

```html
<script
  src="https://lilwidget.com/widget.js"
  data-id="your-widget-id"
  data-base-url="https://lilwidget.com">
</script>
```

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4
- **Payments:** Stripe
- **Hosting:** Vercel

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Architecture, setup, API reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design tokens and components |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature documentation (crawl tiers) |
| [docs/TESTING.md](docs/TESTING.md) | Testing guide |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [TODO.md](TODO.md) | Current tasks and backlog |

---

## Features

### For Widget Owners
- **Website Crawling** - AI analyzes your site and creates a custom persona
- **Custom Rules** - Add specific instructions for your chatbot
- **AI Suggestions** - Get recommendations based on conversations
- **Analytics** - View all visitor chats in your dashboard
- **Easy Embedding** - One-line script tag

### For Visitors
- **Smart Responses** - Powered by GPT-4 with custom context
- **Conversation History** - Maintained during session
- **Clean UI** - Shadow DOM, no style conflicts
- **Mobile Friendly** - Responsive design

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Lint code
```

---

## License

MIT License

---

## Credits

Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [OpenAI](https://openai.com/), and [Tailwind CSS](https://tailwindcss.com/).
