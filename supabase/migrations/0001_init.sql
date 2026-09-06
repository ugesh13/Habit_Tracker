-- Rhythm: initial schema, indexes, and row-level security policies
-- Run via `supabase db push` or the Supabase SQL editor.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  week_start smallint not null default 1 check (week_start between 0 and 6), -- 0=Sun
  daily_reset_time time not null default '04:00',
  gamification_enabled boolean not null default true,
  theme text not null default 'system' check (theme in ('light','dark','system')),
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- LABELS
-- ---------------------------------------------------------------------------
create table public.labels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#4F6F52',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------------------------------------------------------------------------
-- HABITS
-- ---------------------------------------------------------------------------
create type public.habit_kind as enum ('build', 'quit');
create type public.goal_type as enum ('yes_no', 'count', 'duration', 'numeric');
create type public.recurrence_type as enum ('daily', 'weekdays', 'custom_days', 'times_per_week');

create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text not null default 'sparkle',
  color text not null default '#4F6F52',
  kind public.habit_kind not null default 'build',
  goal_type public.goal_type not null default 'yes_no',
  goal_target numeric,          -- e.g. 8 (glasses), 30 (minutes), 5 (km)
  goal_unit text,                -- e.g. 'glasses', 'minutes', 'km'
  recurrence_type public.recurrence_type not null default 'daily',
  recurrence_days smallint[],    -- for custom_days / weekdays, 0=Sun..6=Sat
  times_per_week smallint,       -- for times_per_week
  time_block text check (time_block in ('morning','afternoon','evening','anytime')) default 'anytime',
  start_date date not null default current_date,
  end_date date,
  notes text,
  is_archived boolean not null default false,
  is_paused boolean not null default false,
  streak_saver_credits smallint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits(user_id) where not is_archived;
create index habits_user_active_idx on public.habits(user_id, is_archived, is_paused);

create table public.habit_labels (
  habit_id uuid not null references public.habits(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (habit_id, label_id)
);

-- Linked / alternative habits: any habit in the group satisfies the shared goal for that day
create table public.habit_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.habit_link_members (
  link_id uuid not null references public.habit_links(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  primary key (link_id, habit_id)
);

-- ---------------------------------------------------------------------------
-- ONE-OFF TASKS
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  time_block text check (time_block in ('morning','afternoon','evening','anytime')) default 'anytime',
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_user_due_idx on public.tasks(user_id, due_date);

-- ---------------------------------------------------------------------------
-- CHECK-INS (the append-only completion log; streaks are derived from this)
-- ---------------------------------------------------------------------------
create type public.checkin_status as enum ('complete', 'skipped', 'streak_saved');

create table public.check_ins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  entry_date date not null,
  status public.checkin_status not null default 'complete',
  value numeric,                 -- amount logged for count/duration/numeric goals
  note text,
  created_at timestamptz not null default now(),
  unique (habit_id, entry_date)
);

create index check_ins_user_date_idx on public.check_ins(user_id, entry_date);
create index check_ins_habit_date_idx on public.check_ins(habit_id, entry_date desc);

-- ---------------------------------------------------------------------------
-- STREAK SAVERS (audit log of protection credit usage)
-- ---------------------------------------------------------------------------
create table public.streak_saver_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  entry_date date not null,
  credits_before smallint not null,
  credits_after smallint not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ROUTINES (ordered collections of habits/tasks)
-- ---------------------------------------------------------------------------
create table public.routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  time_block text check (time_block in ('morning','afternoon','evening','anytime')) default 'anytime',
  created_at timestamptz not null default now()
);

create table public.routine_items (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  position integer not null default 0,
  check (
    (habit_id is not null and task_id is null) or
    (habit_id is null and task_id is not null)
  )
);

create index routine_items_routine_idx on public.routine_items(routine_id, position);

-- ---------------------------------------------------------------------------
-- TEMPLATES (read-only catalog; seeded, not user-owned)
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  category text not null, -- fitness, reading, meditation, hydration, sleep, productivity, study, skincare, mental_wellbeing
  name text not null,
  description text,
  estimated_minutes integer,
  benefits text[],
  definition jsonb not null, -- array of habit/routine definitions to import
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MOOD / STATE TRACKING
-- ---------------------------------------------------------------------------
create table public.tracked_states (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,        -- 'mood' | 'energy' | 'stress' | 'sleep_quality' | custom
  label text not null,
  icon text not null default 'circle',
  scale_min smallint not null default 1,
  scale_max smallint not null default 5,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create table public.mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  values jsonb not null default '{}'::jsonb, -- { "mood": 4, "energy": 3, "stress": 2, "sleep_quality": 5, ... }
  reflection text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index mood_logs_user_date_idx on public.mood_logs(user_id, entry_date desc);

-- ---------------------------------------------------------------------------
-- GAMIFICATION
-- ---------------------------------------------------------------------------
create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,      -- 'first_checkin', 'streak_7', 'streak_30', ...
  name text not null,
  description text,
  icon text not null default 'medal'
);

create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- REMINDERS
-- ---------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  remind_time time not null,
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  kind text not null default 'nudge' check (kind in ('nudge','streak_risk')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SHARE CARDS
-- ---------------------------------------------------------------------------
create table public.share_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null,
  theme_key text not null default 'sage',
  payload jsonb not null,      -- the exact, user-approved snapshot of data rendered on the card
  image_path text,             -- path in storage bucket 'share-cards' once rendered
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- IMPORT / EXPORT HISTORY
-- ---------------------------------------------------------------------------
create table public.data_export_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('json','csv')),
  created_at timestamptz not null default now()
);

create table public.data_import_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('success','partial','failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at_habits before update on public.habits
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.labels enable row level security;
alter table public.habits enable row level security;
alter table public.habit_labels enable row level security;
alter table public.habit_links enable row level security;
alter table public.habit_link_members enable row level security;
alter table public.tasks enable row level security;
alter table public.check_ins enable row level security;
alter table public.streak_saver_events enable row level security;
alter table public.routines enable row level security;
alter table public.routine_items enable row level security;
alter table public.templates enable row level security;
alter table public.tracked_states enable row level security;
alter table public.mood_logs enable row level security;
alter table public.user_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.share_cards enable row level security;
alter table public.data_export_log enable row level security;
alter table public.data_import_log enable row level security;

-- profiles: user can read/update only their own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Generic pattern for user_id-owned tables: select/insert/update/delete only own rows.
create policy "labels_all_own" on public.labels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_all_own" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_all_own" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "check_ins_all_own" on public.check_ins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "streak_saver_events_all_own" on public.streak_saver_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_all_own" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_links_all_own" on public.habit_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tracked_states_all_own" on public.tracked_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mood_logs_all_own" on public.mood_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_all_own" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_subscriptions_all_own" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "share_cards_all_own" on public.share_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "data_export_log_all_own" on public.data_export_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "data_import_log_all_own" on public.data_import_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_progress_all_own" on public.user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_achievements: user can read own; inserts only via server (service role) to prevent self-granting
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);

-- join tables: owned indirectly through parent habit/link/routine
create policy "habit_labels_via_habit" on public.habit_labels for all
  using (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

create policy "habit_link_members_via_link" on public.habit_link_members for all
  using (exists (select 1 from public.habit_links l where l.id = link_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.habit_links l where l.id = link_id and l.user_id = auth.uid()));

create policy "routine_items_via_routine" on public.routine_items for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

-- templates & achievements: public read-only catalog
create policy "templates_public_read" on public.templates for select using (true);
create policy "achievements_public_read" on public.achievements for select using (true);
