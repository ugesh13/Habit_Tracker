# Rhythm

A private, calm momentum system for habits, routines, energy, recovery, and reflection. Next.js + TypeScript + Tailwind CSS on the frontend, Supabase (Postgres + Auth + RLS + Storage) on the backend.

## Status of this codebase

This is a working MVP scaffold, not a fully polished production system. Verified and real:

- Complete database schema, indexes, and row-level security policies (`supabase/migrations/0001_init.sql`)
- Core business logic — recurrence scheduling, streak calculation (including linked/alternative habits and streak savers), XP/leveling — with **25 passing unit tests** (`npm test`)
- Real API routes wired to Supabase: habits, check-ins (with cascading streak/XP/achievement updates), mood logs, routines, template import, JSON/CSV export, JSON import with conflict handling, account deletion
- Real frontend screens wired to those APIs: auth (email/password + Google), onboarding, Today dashboard with date navigation and optimistic check-ins, habit creation, calendar heatmap, insights charts, routines + template gallery, settings (preferences, export/import, account deletion)
- Basic PWA: manifest, service worker (offline app-shell caching, push notification handler)
- Flexible Momentum data model for primary/fallback completions, private daily energy, friction, and recovery actions
- Evidence-backed Insights, Weekly Review, Monthly Rhythm Report, Recovery, and Rhythm Constellation views
- Progressive three-step habit creation with a live goal preview

**Explicitly not built out** — these have schema support and clear extension points, but no UI/logic yet:
- Share Card Studio (image rendering + 6 templates) — the `share_cards` table and route pattern exist; rendering to an image (e.g. via `satori` or `html-to-image`) is not implemented
- Sending actual push notifications on a schedule (an Edge Function + `pg_cron` job reading `reminders` and `push_subscriptions` would drive this)
- Client-side encrypted backups
- Command palette / quick-add keyboard shortcut
- Drag-and-drop routine reordering (routines currently take a fixed `position` on creation)
- Multiple visual theme palettes beyond light/dark
- Full onboarding wizard (a minimal 2-question version exists)

Treat this as a strong, correctly-modeled foundation to build the rest on top of, not a finished product.

## Tech stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase — Postgres, Auth (email/password + Google OAuth), Row-Level Security, Storage (for future share-card images)
- **Testing**: Vitest for business logic (`src/lib/logic/*.test.ts`)
- **Charts**: Recharts

## Local setup

### 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- (Optional) the [Supabase CLI](https://supabase.com/docs/guides/cli) for local dev and type generation

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project's values (Project Settings → API):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never expose to the client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set up the database

In the Supabase SQL editor (or via the CLI), run the migration and seed file in order:

```bash
# Using the Supabase CLI against a linked project:
supabase link --project-ref your-project-ref
supabase db push                      # applies supabase/migrations/0001_init.sql
psql "$(supabase db connection-string)" -f supabase/seed.sql   # or paste seed.sql into the SQL editor
```

Or simply paste the contents of `supabase/migrations/0001_init.sql` then `supabase/seed.sql` into the Supabase dashboard's SQL editor and run them in that order.

For an existing project that already ran `0001_init.sql`, run `supabase/migrations/0002_momentum_recovery.sql` after it. This additive migration adds fallback relationships, completion context, daily energy, friction, recovery actions, and tighter ownership policies. Then run `supabase/seed.sql` if starter catalog data is not already present.

### 5. Enable Google sign-in (optional)

In the Supabase dashboard: Authentication → Providers → Google, add your OAuth client ID/secret, and set the redirect URL to `https://your-project-ref.supabase.co/auth/v1/callback` (Supabase handles the OAuth callback; this app's `/auth/callback` route exchanges the resulting code for a session).

### 6. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 7. Run tests

```bash
npm test
```

The main product routes are `/today`, `/calendar`, `/routines`, `/insights`, `/constellation`, `/recovery`, `/review`, `/report`, and `/settings`. Guest mode can browse the shell, while Supabase-backed habit writes and private reports require an authenticated user.

## Deployment

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com) (or any Next.js host).
3. Set the same environment variables from `.env.local` in your host's project settings, with `NEXT_PUBLIC_SITE_URL` set to your production URL.
4. In Supabase, add your production URL to Authentication → URL Configuration → Redirect URLs (needed for the OAuth callback and email links).
5. Deploy. Run the migration/seed against your production Supabase project the same way as step 4 above.

## Project structure

```
supabase/
  migrations/0001_init.sql   # schema, indexes, RLS policies
  seed.sql                   # achievements + starter templates
src/
  lib/
    supabase/                # browser / server / admin (service-role) clients
    logic/                   # recurrence, streaks, xp — pure functions + tests
    validation/               # zod schemas for all API input
    types/database.ts         # hand-authored types matching the schema
  app/
    (auth)/login, signup      # auth screens
    (app)/today, calendar,
          insights, routines,
          settings, onboarding # authenticated screens
    api/                       # route handlers: habits, checkins, mood, routines,
                                #   export, import, templates/[id]/import, account
  components/                  # AppNav, TodayView, HabitRow, ProgressRing,
                                #   HeatmapCalendar, InsightsCharts, SettingsForm, etc.
```

## A note on data safety

Every user-owned table has a row-level security policy scoping reads/writes to `auth.uid() = user_id`, verified in the migration file. The service-role client (`src/lib/supabase/admin.ts`) is used in exactly two places, both server-only: granting achievements (which have no client-insert policy, so users can't self-grant) and permanently deleting an account. Never import `admin.ts` into a client component.
