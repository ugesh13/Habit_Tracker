import { HeatmapCalendar } from '@/components/HeatmapCalendar';
import { createClient } from '@/lib/supabase/server';
import { isHabitScheduledOn } from '@/lib/logic/recurrence';
import type { Habit, CheckIn } from '@/lib/types/database';
import { subWeeks } from 'date-fns';

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = subWeeks(new Date(), 20).toISOString().slice(0, 10);

  const [{ data: habits }, { data: checkIns }] = user
    ? await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('check_ins').select('*').eq('user_id', user.id).gte('entry_date', since),
      ])
    : [{ data: [] }, { data: [] }];

  const habitList = (habits as Habit[]) ?? [];
  const checkInList = (checkIns as CheckIn[]) ?? [];

  // Build a completion ratio per day: (satisfied habits) / (scheduled habits).
  const dayMap = new Map<string, { scheduled: number; satisfied: number }>();
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const dateStr = cursor.toISOString().slice(0, 10);
    let scheduled = 0;
    let satisfied = 0;
    for (const h of habitList) {
      if (!isHabitScheduledOn(h, cursor)) continue;
      scheduled++;
      const c = checkInList.find((ci) => ci.habit_id === h.id && ci.entry_date === dateStr);
      if (c && (c.status === 'complete' || c.status === 'streak_saved')) satisfied++;
    }
    dayMap.set(dateStr, { scheduled, satisfied });
    cursor.setDate(cursor.getDate() + 1);
  }

  const ratioData: Record<string, number> = {};
  for (const [date, { scheduled, satisfied }] of dayMap) {
    ratioData[date] = scheduled === 0 ? 0 : satisfied / scheduled;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Calendar</h1>
      <p className="text-sm text-ink/60 dark:text-dark-text/60">
        Each square is one day, shaded by the share of scheduled habits you completed.
      </p>
      <div className="rounded-card border border-hairline p-4 dark:border-dark-hairline">
        <HeatmapCalendar data={ratioData} weeks={20} />
      </div>
    </div>
  );
}
