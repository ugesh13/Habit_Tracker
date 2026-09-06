# Rhythm Design and Build Plan

## Product north star

Rhythm becomes a calm personal momentum system: a daily ritual that helps people make realistic progress, choose smaller versions when needed, recover without shame, and understand what supports their consistency.

The existing Next.js 14 App Router, Tailwind, Supabase SSR clients, RLS model, pure logic modules, and Vitest suite remain the foundation. The redesign will preserve existing routes and API contracts where practical, adding versioned migrations and backward-compatible fields.

## Current architecture findings

- `src/app/(app)` contains Today, Calendar, Routines, Insights, Settings, Onboarding, and habit creation.
- `src/app/api` owns authenticated writes for habits, check-ins, mood, routines, imports/exports, templates, and account deletion.
- `src/lib/logic` contains recurrence, streak, and XP calculations with unit tests.
- `habit_links` and `habit_link_members` already model alternatives, but have no complete API or UI flow.
- RLS is enabled, but ownership of referenced rows in join tables and check-ins needs tightening in a new migration.
- Guest mode currently allows viewing only; it does not persist local habits or check-ins.
- Supabase service-role access stays server-only and is never imported by client components.

## Implementation phases

### Phase 1: Core experience redesign

1. Establish a small visual system in `globals.css` and shared components: paper background, forest ink, sage action color, clay emphasis, borders, shadows, focus rings, reduced-motion behavior, and responsive spacing.
2. Redesign `AppNav`, app shell, landing, Today, empty states, Settings, onboarding, and habit creation without changing the route map.
3. Make Today a ritual: greeting/date, one next-best action, supportive progress language, distinct completed/skipped/paused/rescheduled states, and fast optimistic check-ins.
4. Replace the long habit form with progressive steps and a live Today preview while retaining all existing goal and recurrence fields.
5. Preserve accessible labels, keyboard operation, mobile-first layout, and direct links for no-JavaScript fallback where possible.

### Phase 2: Flexible Momentum

1. Add migration `0002_momentum_recovery.sql` with fallback metadata and completion context. Prefer existing link groups for relationships, adding explicit primary/fallback role and ordering fields.
2. Add secure APIs for creating, editing, ordering, and removing fallback options.
3. Add a fallback editor to habit creation/editing and surface fallback choices on low-energy/recovery contexts.
4. Extend check-ins with `completion_mode` (`primary`, `fallback`, `rescheduled`) and use honest language such as “You protected your rhythm.”
5. Update streak calculations, history, calendar, insights, and XP rules so fallback completion counts toward continuity but remains visually distinct.
6. Add unit tests for primary/fallback completion, linked alternatives, ordering, and streak continuity.

### Phase 3: Energy-based planning

1. Add migration `0003_energy_checkins.sql` for private daily energy selections and dismissal/override state.
2. Add authenticated GET/POST API routes with strict user ownership.
3. Add a compact Daily Check-in on Today with Low, Steady, and High energy choices.
4. Reorder/suggest actions without hiding habits; explain suggestions and allow dismissal/override.
5. Add pure planning utilities and tests for each energy level.

### Phase 4: Recovery and friction journal

1. Add migration `0004_recovery_friction.sql` for private friction entries and recovery actions.
2. Add recovery API routes and a Recovery view/section.
3. Surface useful actions after missed/ skipped habits: resume, smaller version, reschedule, pause, or record a reason.
4. Add one-tap friction reasons and compassionate copy.
5. Add logic tests for recovery suggestions and friction aggregation.

### Phase 5: Explainable insight engine

1. Add pure server-safe insight utilities using habits, check-ins, mood, energy, time blocks, routines, and friction data only.
2. Add API/page data loaders that return evidence with every insight.
3. Add evidence-backed insight cards and weekly review inputs, hiding insights when data is insufficient.
4. Add unit tests for time-of-day reliability, fallback support, comeback detection, and evidence thresholds.

### Phase 6: Rhythm Constellation

1. Add a responsive, keyboard-readable constellation view using semantic HTML/CSS positioning rather than a graph dependency.
2. Represent habits as nodes with consistency and fallback relationships; provide a list/table equivalent for accessibility and mobile.
3. Add reduced-motion styling and a non-animated mode.
4. Reuse real loaded habit/check-in data and add focused rendering/data tests where practical.

### Phase 7: Reviews and reports

1. Add weekly review route and components for wins, friction, reliable habit/time, focus suggestion, and user-controlled adjustment.
2. Add monthly Rhythm Report with printable layout and private server-side data loading.
3. Add report utilities/tests for consistency, best habit, supportive routine, energy/mood patterns, recovery moments, and intention.
4. Update README with feature overview, migration order, local setup, OAuth URLs, and testing commands.

## Migration strategy

- Never modify `0001_init.sql`; it may already be applied.
- Add migrations only as `0002_*.sql`, `0003_*.sql`, etc., each safe to run once and documented in README.
- Every new user-owned table gets RLS enabled and policies based on `auth.uid() = user_id`.
- New foreign-key relationships and join policies must verify ownership of both sides.
- Existing security gaps around check-ins, habit labels, habit-link members, and routine items will be corrected in the first new migration with restrictive policies.
- Service-role usage remains server-only and is limited to operations that explicitly require bypassing RLS.

## User flows

### Entry

Landing offers email sign-in, account creation, Google OAuth, and guest mode. Guest mode remains useful for exploration and uses browser-local storage for local-only data where implemented; account-backed persistence clearly indicates when sign-in is required.

### Today

User sees a calm greeting, date, energy check-in, one suggested next action, scheduled habits, fallback choices, progress, and a compassionate recovery prompt when useful. Check-ins update optimistically and reconcile with the API.

### Habit creation

Step 1 names the habit and kind. Step 2 defines the primary goal. Step 3 defines schedule/time/reminders. Step 4 adds fallback options and shows a Today preview. Save returns to Today with refreshed data.

### Recovery

A missed habit opens a compact action sheet. The user can resume, use a smaller version, reschedule, pause, or log friction. Recovery language describes support, never failure.

### Review/report

Weekly review is short and editable. Monthly report is private, evidence-backed, printable, and never presented as an AI judgment.

## Testing strategy

- Run existing Vitest logic tests before and after each logic slice.
- Add focused tests beside new pure utilities for fallback streaks, energy planning, recovery, insight evidence, and report aggregation.
- Run `npx tsc --noEmit` after each implementation slice.
- Run `npm run lint` and `npm run build` before completion; resolve project-relevant failures.
- Manually verify mobile and desktop route flows, guest entry, authenticated writes, optimistic check-ins, OAuth callback, and settings/account actions.
- Verify no service-role key is imported by client code and no new user-owned table lacks RLS.

## Delivery checkpoints

1. Plan committed to the repository before feature edits.
2. Phase 1 shell and Today redesign renders on mobile and desktop.
3. Flexible Momentum persists and is covered by tests.
4. Energy/recovery data persists privately and drives explainable suggestions.
5. Insights, constellation, reviews, and reports use real data with no fake placeholders.
6. README, migration list, environment guidance, and verification results are complete.
