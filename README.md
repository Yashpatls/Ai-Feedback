# LOOP — AI Customer-Feedback Intelligence Platform

> "Close the loop on customer feedback."

LOOP ingests multi-channel customer feedback, uses Claude AI to classify and cluster it, surfaces what is trending, and answers plain-English questions about what customers actually want.

Built as part of the **Zidio Development Internship** — Web Development Track.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon / Supabase) |
| ORM | Prisma 5 |
| Auth | NextAuth v4 (credentials) |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Charts | Recharts |
| Validation | Zod |
| Deployment | Vercel + hosted Postgres |

---

## Features

### Core
- **C1** Multi-tenant workspaces with full data isolation per company
- **C2** Role-based access control — ADMIN / ANALYST / VIEWER
- **C3** Feedback ingestion: manual entry, CSV bulk upload, simulated channel sources
- **C4** Feedback inbox with server-side pagination, full-text search, and filters
- **C5** Analytics dashboard with volume, sentiment, and top-theme charts

### AI (powered by Claude)
- **AI1** Auto-classification: sentiment, score, themes, feature area on ingest
- **AI2** Theme clustering & trend detection with spike alerts
- **AI3** Ask LOOP — retrieval-grounded Q&A (no hallucinations)
- **AI4** Voice-of-Customer report generation with narrative + stats

---

## Architecture

```
Browser (Next.js App Router)
    ↓
API Layer (Route Handlers) — auth guard + workspace scope on every route
    ↓
Services (lib/ai.ts, lib/db.ts)
    ↓
PostgreSQL (via Prisma)   +   Anthropic Claude API (server-side only)
```

All feedback rows carry a `workspaceId`; every query filters on it. Company A can never read Company B's data.

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (free: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd loop
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY

# 3. Set up database
npx prisma db push          # or: npx prisma migrate dev --name init
npm run seed                 # loads 120+ demo feedback items

# 4. Run
npm run dev                  # http://localhost:3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 locally) |
| `NEXTAUTH_SECRET` | Random secret — run `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

---

## Demo Credentials (seeded workspace)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Demo1234! |
| Analyst | analyst@demo.com | Demo1234! |
| Viewer | viewer@demo.com | Demo1234! |

---

## Data Model

```
Workspace ──< User
          ──< Feedback ──< FeedbackTheme >── Theme
                       ──  Embedding
          ──< Report
```

Every tenant-owned table carries `workspaceId` for isolation.

---

## Project Structure

```
loop/
├── app/
│   ├── (auth)/           # login, signup pages
│   ├── (app)/            # dashboard, inbox, trends, ask, reports, settings
│   └── api/              # all route handlers
├── components/
│   ├── feedback/         # AddFeedbackModal, CsvUploadModal, ChannelImportModal
│   ├── layout/           # Sidebar
│   └── ui/               # Modal
├── lib/
│   ├── ai.ts             # Claude calls: classify, answer, report
│   ├── auth.ts           # NextAuth config + role guards
│   ├── db.ts             # Prisma client singleton
│   └── api.ts            # Response helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── next-auth.d.ts
└── middleware.ts
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy — Vercel auto-runs `next build`
5. Run seed: `npx prisma db push && npm run seed` from your local machine pointing to production DB

---

*Built for Zidio Development Internship — Document v1.0*
