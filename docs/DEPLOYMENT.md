# Deployment & Environment Setup

This application is a Vite + React frontend connected to Supabase. Vite environment variables are embedded at build time, so setting them in Cloudflare Pages requires a new deployment before the live build uses them.

## Required Cloudflare Pages variables

For the `pak-work-shop` Pages project, configure these variables in **both Production and Preview**:

- `VITE_SUPABASE_URL` — Supabase Project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key (or a legacy anon key only when needed for compatibility).

The values should come from the connected Supabase project, not from a different environment. The publishable key is designed for browser use and relies on RLS policies for data access.

**Never add a Supabase `service_role` key or a Supabase secret key to a `VITE_*` variable, frontend source file, or public repository.** Those credentials bypass normal client-side protections.

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in the same two variables using the intended Supabase project.
3. Install dependencies with `npm install`.
4. Run `npm run dev`; verify the home page, booking form, catalogue empty states, and sign-in routes.
5. Run `npm run build`, `npm run lint`, and `npm test` before publishing changes.

Local `.env` files are ignored by Git. Do not commit environment values.

## Database changes

Incremental database performance fixes are stored under `supabase/migrations/` and are tracked in the connected Supabase project's migration history. Review schema and RLS changes before applying them to any other environment.
