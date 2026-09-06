import { buildRhythmReport } from '@/lib/logic/reports';
import { createClient } from '@/lib/supabase/server';
import type { CheckIn, FrictionEntry, Habit } from '@/lib/types/database';

export default async function ReportPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [{ data: habits }, { data: checkIns }, { data: friction }] = user
    ? await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('check_ins').select('*').eq('user_id', user.id).gte('entry_date', since),
        supabase.from('friction_entries').select('*').eq('user_id', user.id).gte('entry_date', since),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const report = buildRhythmReport((habits as Habit[]) ?? [], (checkIns as CheckIn[]) ?? [], (friction as FrictionEntry[]) ?? []);

  return (
    <article className="mx-auto max-w-3xl space-y-10 bg-paper py-4 print:max-w-none print:py-0 dark:bg-dark-bg">
      <header className="border-b border-hairline pb-8 dark:border-dark-hairline"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">Thirty-day reflection</p><h1 className="font-display mt-2 text-5xl">Your Rhythm Report</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink/60 dark:text-dark-text/60">A private, printable summary of the ways you kept returning.</p></header>
      <section className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wide text-ink/45">Consistency</p><p className="font-display mt-2 text-4xl">{Math.round(report.consistency * 100)}%</p></div><div><p className="text-xs uppercase tracking-wide text-ink/45">Completed</p><p className="font-display mt-2 text-4xl">{report.completedCheckIns}</p></div><div><p className="text-xs uppercase tracking-wide text-ink/45">Best habit</p><p className="font-display mt-2 text-2xl">{report.bestHabit ?? 'Still forming'}</p></div></section>
      <section className="rounded-card border border-hairline p-6 dark:border-dark-hairline"><h2 className="font-display text-2xl">A gentle intention</h2><p className="mt-3 text-sm leading-7 text-ink/65 dark:text-dark-text/65">Keep one small promise easy to return to next month. Your rhythm does not need to be loud to be real.</p>{report.comeback && <p className="mt-4 text-sm font-medium text-sage dark:text-sage-light">You came back after friction. That matters.</p>}</section>
    </article>
  );
}
