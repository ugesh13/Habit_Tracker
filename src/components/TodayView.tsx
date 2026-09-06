'use client';

import { createClient } from '@/lib/supabase/client';
import { ProgressRing } from '@/components/ProgressRing';
import { HabitRow, type HabitRowData } from '@/components/HabitRow';
import { DailyEnergyCheckIn } from '@/components/DailyEnergyCheckIn';
import { RecoveryPrompt } from '@/components/RecoveryPrompt';
import { isHabitScheduledOn } from '@/lib/logic/recurrence';
import type { CheckIn, Habit, TimeBlock } from '@/lib/types/database';
import { addDays, format, isToday as isDateToday } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

const TIME_BLOCKS: { key: TimeBlock; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'anytime', label: 'Anytime' },
];

export function TodayView() {
  const supabase = useMemo(() => createClient(), []);
  const [date, setDate] = useState(() => new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getSession();
      if (!userData.session) {
        setLoading(false);
        return;
      }
      const sevenDaysAgo = format(addDays(date, -7), 'yyyy-MM-dd');
      const [{ data: habitData }, { data: checkInData }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userData.session.user.id).eq('is_archived', false).eq('is_paused', false),
        supabase.from('check_ins').select('*').eq('user_id', userData.session.user.id).gte('entry_date', sevenDaysAgo).lte('entry_date', dateStr),
      ]);
      if (!cancelled) {
        setHabits((habitData as Habit[]) ?? []);
        setCheckIns((checkInData as CheckIn[]) ?? []);
        setLoading(false);
      }
    }
    load();
    window.addEventListener('focus', load);
    window.addEventListener('pageshow', load);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
      window.removeEventListener('pageshow', load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, supabase]);

  const scheduledToday = useMemo(() => habits.filter((h) => isHabitScheduledOn(h, date)), [habits, date]);

  const rows: HabitRowData[] = scheduledToday.map((h) => {
    // Find today's checkin
    const c = checkIns.find((ci) => ci.habit_id === h.id && ci.entry_date === dateStr);
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    
    // Calculate consistency over last 7 days
    let scheduledDays = 0;
    let completedDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(date, -i);
      if (isHabitScheduledOn(h, d)) {
        scheduledDays++;
        const ci = checkIns.find(ci => ci.habit_id === h.id && ci.entry_date === format(d, 'yyyy-MM-dd'));
        if (ci && (ci.status === 'complete' || ci.status === 'streak_saved')) {
          completedDays++;
        }
      }
    }
    const consistency = scheduledDays > 0 ? completedDays / scheduledDays : 1;

    return {
      id: h.id,
      title: h.title,
      color: h.color,
      goal_type: h.goal_type,
      goal_target: h.goal_target,
      goal_unit: h.goal_unit,
      value: c?.value ?? null,
      status: c ? (c.status as HabitRowData['status']) : isPast ? 'overdue' : 'scheduled',
      consistency,
    };
  });

  const grouped = TIME_BLOCKS.map((block) => ({
    ...block,
    rows: rows.filter((r) => scheduledToday.find((h) => h.id === r.id)?.time_block === block.key),
  })).filter((g) => g.rows.length > 0);

  const completedCount = rows.filter((r) => r.status === 'complete' || r.status === 'streak_saved').length;
  const nextAction = rows.find((row) => row.status === 'scheduled' || row.status === 'overdue');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  async function handleToggle(habitId: string, entryDate: string, nextComplete: boolean, value?: number) {
    // Optimistic update
    setCheckIns((prev) => {
      const withoutThis = prev.filter((c) => c.habit_id !== habitId);
      if (!nextComplete) return withoutThis;
      return [
        ...withoutThis,
        {
          id: `optimistic-${habitId}`,
          user_id: '',
          habit_id: habitId,
          entry_date: entryDate,
          status: 'complete',
          value: value ?? null,
          note: null,
          created_at: new Date().toISOString(),
        },
      ];
    });

    if (!nextComplete) {
      // Undo: delete the check-in outright rather than storing a "skipped" row,
      // since the user is retracting a mis-tap, not deliberately skipping.
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('check_ins').delete().eq('habit_id', habitId).eq('entry_date', entryDate).eq('user_id', userData.user.id);
      }
      return;
    }

    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, entry_date: entryDate, status: 'complete', value }),
    });
    if (res.ok) {
      const { checkIn } = await res.json();
      setCheckIns((prev) => [...prev.filter((c) => c.habit_id !== habitId), checkIn]);
    }
  }

  async function handleDelete(habitId: string) {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userData.user.id);
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  }

  async function handleDeleteAll() {
    if (!confirm('WARNING: Are you sure you want to delete ALL habits? This cannot be undone.')) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('habits').delete().eq('user_id', userData.user.id);
      setHabits([]);
    }
  }

  // Calculate stats for the hero card
  const totalWeeklyScheduled = habits.reduce((acc, h) => {
    let days = 0;
    for (let i = 0; i < 7; i++) {
      if (isHabitScheduledOn(h, addDays(date, -i))) days++;
    }
    return acc + days;
  }, 0);

  const totalWeeklyCompleted = checkIns.filter(c => 
    (c.status === 'complete' || c.status === 'streak_saved') &&
    new Date(c.entry_date) >= addDays(date, -7)
  ).length;

  const weeklyPercentage = totalWeeklyScheduled > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyScheduled) * 100) : 0;
  // dailyPercentage removed for linting

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-ink/60 dark:text-dark-text/60 mb-2">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            aria-label="Previous day"
            className="focus-ring rounded-full p-2 hover:bg-ink/[0.04] dark:hover:bg-white/[0.04]"
          >
            ‹
          </button>
          <h2 className="font-display w-40 text-center text-xl md:w-56 md:text-2xl">
            {isDateToday(date) ? 'Today' : format(date, 'MMM d')}
          </h2>
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            aria-label="Next day"
            className="focus-ring rounded-full p-2 hover:bg-ink/[0.04] dark:hover:bg-white/[0.04]"
          >
            ›
          </button>
        </div>

        {/* Hero Summary Card */}
        <div className="relative overflow-hidden rounded-3xl bg-paper/80 p-6 md:p-8 shadow-xl backdrop-blur-md border border-hairline dark:border-dark-hairline dark:bg-dark-surface/80">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-sage-dark dark:text-sage-light">
                {greeting}! {greeting.includes('morning') ? '🌅' : greeting.includes('afternoon') ? '☀️' : '🌙'}
              </h1>
              <p className="mt-1 text-ink/70 dark:text-dark-text/70">
                Today, {format(date, 'MMMM d')}
              </p>
            </div>
            
            <div className="flex items-center gap-2 rounded-full bg-sage/10 px-4 py-2 text-sage-dark dark:text-sage-light border border-sage/20 shadow-sm backdrop-blur">
              <span>🔥</span>
              <span className="font-medium">1 day</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-8 md:gap-16 max-w-2xl">
            <div className="flex flex-col items-center">
              <ProgressRing completed={completedCount} total={rows.length} size={100} strokeWidth={8} />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl font-display text-ink dark:text-dark-text">{completedCount}</span>
              <span className="text-sm text-ink/60 dark:text-dark-text/60 mt-1 uppercase tracking-wider">Done</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl font-display text-ink dark:text-dark-text">{rows.length}</span>
              <span className="text-sm text-ink/60 dark:text-dark-text/60 mt-1 uppercase tracking-wider">Total</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl font-display text-ink dark:text-dark-text">{weeklyPercentage}%</span>
              <span className="text-sm text-ink/60 dark:text-dark-text/60 mt-1 uppercase tracking-wider">Weekly</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/40 dark:bg-black/20 p-4 border border-white/20 dark:border-white/5 backdrop-blur-md">
            <p className="text-center font-serif italic text-ink/80 dark:text-dark-text/80">
              &quot;Habits shape your destiny.&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <a
            href="/habits/new"
            className="focus-ring flex items-center gap-2 rounded-card bg-sage px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-sage-dark"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Create Habit
          </a>
          
          <button
            onClick={handleDeleteAll}
            className="text-sm text-clay/70 hover:text-clay transition-colors underline underline-offset-4 decoration-clay/30"
          >
            Delete All
          </button>
        </div>
      </header>

      <DailyEnergyCheckIn date={dateStr} />

      {nextAction?.status === 'overdue' && <RecoveryPrompt habit={nextAction} entryDate={dateStr} />}

      {loading ? (
        <p className="text-ink/50 dark:text-dark-text/50">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="ritual-panel border-dashed py-16 text-center">
          <p className="text-ink/60 dark:text-dark-text/60">Nothing scheduled for this day.</p>
          <a href="/habits/new" className="mt-2 inline-block text-sm text-sage underline decoration-hairline underline-offset-4 dark:text-sage-light">
            Add a habit
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.key}>
              <h2 className="mb-1 text-sm font-medium text-ink/50 dark:text-dark-text/50">{group.label}</h2>
              <div>
                {group.rows.map((row) => (
                  <HabitRow key={row.id} habit={row} entryDate={dateStr} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
