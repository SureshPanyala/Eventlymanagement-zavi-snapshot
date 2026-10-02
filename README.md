# Your company app

Built with **Zavi** — your growth agent scaffolded this app, provisioned
the infrastructure, and shipped the first deploy. Edit, push, and the next
deploy goes live.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev                  # http://localhost:3000
```

## Deploy

This repo is wired for one-click deploy to either provider:

- **Render** — pushes to the default branch auto-deploy via `render.yaml`.
- **Vercel** — `vercel` from the repo root, or connect this repo in the
  Vercel dashboard. The default Next.js preset works.

## Environment

| Var | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | RLS-respecting project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | RLS-respecting anon key |
| `DATABASE_URL` | server only | Postgres connection string — never expose to the browser |
