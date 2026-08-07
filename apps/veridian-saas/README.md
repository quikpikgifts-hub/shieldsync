# Veridian AI — marketing site & app shell

Enterprise SaaS website for Veridian AI: an AI-powered platform for generating
security, fleet, HR, and compliance documentation. Next.js 16 (App Router),
React 19, TypeScript, Tailwind CSS v4, and Framer Motion.

## Structure

- `src/app/` — marketing pages (home, solutions, industries, features,
  pricing, resources, blog, docs, about, contact), auth (`login`, `signup`),
  and the authenticated `dashboard/*` app shell with the AI report generator.
- `src/components/ui/` — shadcn-style primitives (Button, Card, Tabs, etc.)
  built with Radix UI + class-variance-authority.
- `src/components/marketing/` and `src/components/dashboard/` — page-level
  composed components.
- `src/data/` — static content (nav, pricing, industries, blog posts, docs).
- `src/lib/supabase.ts` — placeholder client; set `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to wire up real auth and storage.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```
