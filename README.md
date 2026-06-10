# SkyWeb CRM

Production-grade CRM for UK roofing companies.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

Already pre-configured in `.env.local` for the roofer-agent Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=https://vwfxdvhxoyzmlexcjbaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DEMO_ROOFER_ID=a1000000-0000-0000-0000-000000000001
```

## 📄 Pages

| Route | Page |
|---|---|
| `/dashboard` | KPI overview, charts, hot leads, upcoming appointments |
| `/leads` | Enterprise table with search, filter, sort, pagination |
| `/leads/[id]` | 3-column detail: profile, timeline, action panel |
| `/pipeline` | Drag-and-drop Kanban board by lead status |
| `/calendar` | Month view + upcoming appointments list |
| `/inbox` | Unified messaging (WhatsApp, email, website, CallRail) |
| `/quotes` | Quotes table with revenue summaries |
| `/analytics` | Executive charts: revenue, funnel, source performance |
| `/notifications` | Realtime notification center |
| `/settings` | Business profile + automation toggles |

## 🗄️ Database

Connected to Supabase `roofer-agent` project with:
- 9 tables, 16 indexes, 25 RLS policies
- 5 trigger functions (audit log, scoring, auto-provision)
- 18 seed leads across 3 roofer tenants

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEMO_ROOFER_ID`
