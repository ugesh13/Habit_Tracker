import { RhythmConstellation } from '@/components/RhythmConstellation';
import { createClient } from '@/lib/supabase/server';
import type { CheckIn, Habit } from '@/lib/types/database';

export default async function ConstellationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: habits }, { data: checkIns }] = user
    ? await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('check_ins').select('*').eq('user_id', user.id),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">A living map</p>
        <h1 className="font-display mt-2 text-4xl">Rhythm Constellation</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 dark:text-dark-text/60">Each habit is a small point of light. The more consistently you return, the more visible its place becomes. Nothing here is a score.</p>
      </header>
      <RhythmConstellation habits={(habits as Habit[]) ?? []} checkIns={(checkIns as CheckIn[]) ?? []} />
    </div>
  );
}
