import { createClient } from '@/lib/supabase/server';
import type { FrictionEntry, Habit, RecoveryAction } from '@/lib/types/database';

const reasonLabels: Record<string, string> = {
  not_enough_time: 'Not enough time', too_tired: 'Too tired', forgot: 'Forgot', too_difficult: 'Too difficult', not_motivated: 'Not motivated', other: 'Other',
};

export default async function RecoveryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: actions }, { data: friction }, { data: habits }] = user
    ? await Promise.all([
        supabase.from('recovery_actions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('friction_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('habits').select('id,title').eq('user_id', user.id),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const actionList = (actions as RecoveryAction[] | null) ?? [];
  const frictionList = (friction as FrictionEntry[] | null) ?? [];
  const habitList = (habits as Pick<Habit, 'id' | 'title'>[] | null) ?? [];
  const habitNames = new Map(habitList.map((habit) => [habit.id, habit.title]));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">A softer reset</p>
        <h1 className="font-display mt-2 text-4xl">Recovery</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-dark-text/60">Returning is a skill. This space keeps the useful context from difficult days without turning it into a verdict.</p>
      </header>
      <section className="ritual-panel p-5">
        <h2 className="font-display text-2xl">Recent choices</h2>
        {actionList.length === 0 ? <p className="mt-3 text-sm text-ink/55 dark:text-dark-text/55">Your recovery choices will appear here as you use them.</p> : <ul className="mt-4 space-y-3">{actionList.map((action) => <li key={action.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline pb-3 text-sm last:border-0 dark:border-dark-hairline"><span>{habitNames.get(action.habit_id) ?? 'Habit'} · {action.action.replaceAll('_', ' ')}</span><span className="text-ink/45 dark:text-dark-text/45">{action.entry_date}</span></li>)}</ul>}
      </section>
      <section className="ritual-panel p-5">
        <h2 className="font-display text-2xl">Friction notes</h2>
        {frictionList.length === 0 ? <p className="mt-3 text-sm text-ink/55 dark:text-dark-text/55">A one-tap reason can help your future plan become more practical.</p> : <ul className="mt-4 grid gap-2 sm:grid-cols-2">{frictionList.map((entry) => <li key={entry.id} className="rounded-card bg-clay/[0.06] p-3 text-sm"><span className="font-medium">{reasonLabels[entry.reason]}</span><span className="ml-2 text-ink/45 dark:text-dark-text/45">{entry.entry_date}</span></li>)}</ul>}
      </section>
    </div>
  );
}
