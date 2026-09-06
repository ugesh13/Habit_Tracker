import { createClient } from '@/lib/supabase/server';
import { computeHabitStreak } from '@/lib/logic/streaks';
import { frictionInsight, mostReliableTimeBlock } from '@/lib/logic/insights';
import type { Habit, CheckIn, FrictionEntry } from '@/lib/types/database';
import { InsightsCharts } from '@/components/InsightsCharts';

export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: habits }, { data: checkIns }, { data: moodLogs }, { data: friction }] = user
    ? await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('check_ins').select('*').eq('user_id', user.id),
        supabase.from('mood_logs').select('*').eq('user_id', user.id).order('entry_date', { ascending: true }).limit(60),
        supabase.from('friction_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(60),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const habitList = (habits as Habit[]) ?? [];
  const checkInList = (checkIns as CheckIn[]) ?? [];
  const asOf = new Date();
  const reliableTime = mostReliableTimeBlock(habitList, checkInList);
  const frictionPattern = frictionInsight((friction as FrictionEntry[]) ?? []);

  const perHabit = habitList.map((h) => {
    const habitCheckIns = checkInList.filter((c) => c.habit_id === h.id);
    const streak = computeHabitStreak({ habit: h, checkIns: habitCheckIns, asOf });
    return { habit: h, streak, checkIns: habitCheckIns };
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">Evidence, not judgment</p>
        <h1 className="font-display mt-2 text-4xl">Insights</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-dark-text/60">A few patterns from the data you have chosen to keep.</p>
      </header>

      {(reliableTime || frictionPattern) && <section className="grid gap-3 md:grid-cols-2">
        {[reliableTime, frictionPattern].filter(Boolean).map((insight) => insight && <article key={insight.key} className="ritual-panel p-5">
          <h2 className="font-display text-xl">{insight.title}</h2>
          <p className="mt-2 text-sm text-ink/65 dark:text-dark-text/65">{insight.detail}</p>
          <p className="mt-3 text-xs text-sage dark:text-sage-light">Evidence: {insight.evidence}</p>
        </article>)}
      </section>}

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/review" className="focus-ring rounded-card border border-hairline px-4 py-2 text-sage dark:border-dark-hairline dark:text-sage-light">Open weekly review</a>
        <a href="/report" className="focus-ring rounded-card border border-hairline px-4 py-2 text-sage dark:border-dark-hairline dark:text-sage-light">View monthly report</a>
      </div>

      {perHabit.length === 0 ? (
        <p className="text-ink/60 dark:text-dark-text/60">Add a habit to start seeing trends here.</p>
      ) : (
        <div className="space-y-4">
          {perHabit.map(({ habit, streak }) => (
            <div key={habit.id} className="ritual-panel p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">{habit.title}</p>
                <span className="text-sm text-ink/50 dark:text-dark-text/50">
                  {Math.round(streak.completionRate * 100)}% completion
                </span>
              </div>
              <div className="mt-2 flex gap-6 text-sm text-ink/60 dark:text-dark-text/60">
                <span>Current streak: {streak.currentStreak}</span>
                <span>Longest: {streak.longestStreak}</span>
                <span>Perfect days: {streak.perfectDays}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <InsightsCharts habits={perHabit.map((p) => ({ id: p.habit.id, title: p.habit.title, checkIns: p.checkIns, habitData: p.habit }))} />
    </div>
  );
}
