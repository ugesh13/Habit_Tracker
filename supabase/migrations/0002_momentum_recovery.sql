-- Rhythm: Flexible Momentum, energy planning, and recovery journal.
-- Additive migration. Run after 0001_init.sql; never edit an applied migration.

alter table public.check_ins
  add column if not exists completion_mode text not null default 'primary'
    check (completion_mode in ('primary', 'fallback', 'rescheduled')),
  add column if not exists fallback_for_habit_id uuid references public.habits(id) on delete set null;

create table if not exists public.habit_fallbacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_habit_id uuid not null references public.habits(id) on delete cascade,
  fallback_habit_id uuid not null references public.habits(id) on delete cascade,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (primary_habit_id, fallback_habit_id),
  check (primary_habit_id <> fallback_habit_id)
);

create index if not exists habit_fallbacks_primary_idx on public.habit_fallbacks(user_id, primary_habit_id, position);

create table if not exists public.daily_energy (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  level text not null check (level in ('low', 'steady', 'high')),
  dismissed_suggestions boolean not null default false,
  override_mode text check (override_mode in ('low', 'steady', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists daily_energy_user_date_idx on public.daily_energy(user_id, entry_date desc);

create table if not exists public.friction_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  entry_date date not null,
  reason text not null check (reason in ('not_enough_time', 'too_tired', 'forgot', 'too_difficult', 'not_motivated', 'other')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists friction_entries_user_date_idx on public.friction_entries(user_id, entry_date desc);

create table if not exists public.recovery_actions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  entry_date date not null,
  action text not null check (action in ('resume', 'smaller_version', 'reschedule', 'pause')),
  scheduled_for date,
  created_at timestamptz not null default now()
);

create index if not exists recovery_actions_user_date_idx on public.recovery_actions(user_id, entry_date desc);

create or replace function public.set_daily_energy_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_daily_energy on public.daily_energy;
create trigger set_updated_at_daily_energy before update on public.daily_energy
  for each row execute procedure public.set_daily_energy_updated_at();

alter table public.habit_fallbacks enable row level security;
alter table public.daily_energy enable row level security;
alter table public.friction_entries enable row level security;
alter table public.recovery_actions enable row level security;

create policy "habit_fallbacks_all_own" on public.habit_fallbacks
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.habits p where p.id = primary_habit_id and p.user_id = auth.uid())
    and exists (select 1 from public.habits f where f.id = fallback_habit_id and f.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.habits p where p.id = primary_habit_id and p.user_id = auth.uid())
    and exists (select 1 from public.habits f where f.id = fallback_habit_id and f.user_id = auth.uid())
  );

create policy "daily_energy_all_own" on public.daily_energy
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "friction_entries_all_own" on public.friction_entries
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );
create policy "recovery_actions_all_own" on public.recovery_actions
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

-- Tighten cross-row ownership checks in the original join/check-in policies.
drop policy if exists "check_ins_all_own" on public.check_ins;
create policy "check_ins_all_own" on public.check_ins for all
  using (auth.uid() = user_id and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
  with check (auth.uid() = user_id and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

drop policy if exists "habit_labels_via_habit" on public.habit_labels;
create policy "habit_labels_via_habit" on public.habit_labels for all
  using (
    exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
    and exists (select 1 from public.labels l where l.id = label_id and l.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
    and exists (select 1 from public.labels l where l.id = label_id and l.user_id = auth.uid())
  );

drop policy if exists "habit_link_members_via_link" on public.habit_link_members;
create policy "habit_link_members_via_link" on public.habit_link_members for all
  using (
    exists (select 1 from public.habit_links l where l.id = link_id and l.user_id = auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.habit_links l where l.id = link_id and l.user_id = auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

drop policy if exists "routine_items_via_routine" on public.routine_items;
create policy "routine_items_via_routine" on public.routine_items for all
  using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
    and (habit_id is null or exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  ) with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
    and (habit_id is null or exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  );
