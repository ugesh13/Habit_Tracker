import { buildRhythmReport } from '@/lib/logic/reports';
import { createClient } from '@/lib/supabase/server';
import type { CheckIn, FrictionEntry, Habit } from '@/lib/types/database';

export default async function ReviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [{ data: habits }, { data: checkIns }, { data: friction }] = user
    ? await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('check_ins').select('*').eq('user_id', user.id).gte('entry_date', since),
        supabase.from('friction_entries').select('*').eq('user_id', user.id).gte('entry_date', since),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const report = buildRhythmReport((habits as Habit[]) ?? [], (checkIns as CheckIn[]) ?? [], (friction as FrictionEntry[]) ?? []);

  return (
    <div className="space-y-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">Seven-day pause</p><h1 className="font-display mt-2 text-4xl">Weekly review</h1><p className="mt-2 text-sm text-ink/60 dark:text-dark-text/60">A short look back, with one useful next step.</p></header>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="ritual-panel p-5"><p className="text-xs uppercase tracking-wide text-ink/45 dark:text-dark-text/45">Wins</p><p className="font-display mt-2 text-3xl">{report.completedCheckIns}</p><p className="mt-1 text-sm text-ink/60 dark:text-dark-text/60">completed moments this week</p></article>
        <article className="ritual-panel p-5"><p className="text-xs uppercase tracking-wide text-ink/45 dark:text-dark-text/45">Reliable habit</p><p className="font-display mt-2 text-2xl">{report.bestHabit ?? 'Not enough data yet'}</p><p className="mt-1 text-sm text-ink/60 dark:text-dark-text/60">Keep noticing what helps.</p></article>
      </div>
      <section className="ritual-panel p-6"><h2 className="font-display text-2xl">One focus for next week</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink/60 dark:text-dark-text/60">Choose the smallest version of the habit that would make returning feel natural. A practical plan is more valuable than a perfect one.</p><p className="mt-4 text-sm text-sage dark:text-sage-light">{report.topFriction ? `Your most common friction was ${report.topFriction.replaceAll('_', ' ')}. Let that shape the next experiment.` : 'You have not logged enough friction yet for a pattern.'}</p></section>
    </div>
  );
}
