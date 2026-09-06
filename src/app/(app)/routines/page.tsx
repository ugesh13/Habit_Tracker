import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RoutinesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: routines }, { data: templates }] = user
    ? await Promise.all([
        supabase
          .from('routines')
          .select('*, routine_items(*, habits(title), tasks(title))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('templates').select('*').order('category'),
      ])
    : [{ data: [] }, await supabase.from('templates').select('*').order('category')];

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-2xl">Routines</h1>
        </div>
        {!routines || routines.length === 0 ? (
          <div className="rounded-card border border-dashed border-hairline py-12 text-center dark:border-dark-hairline">
            <p className="text-ink/60 dark:text-dark-text/60">No routines yet. Import a plan below, or build your own from your habits.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {routines.map((r) => (
              <li key={r.id} className="rounded-card border border-hairline p-4 dark:border-dark-hairline">
                <p className="font-medium">{r.name}</p>
                {r.description && <p className="text-sm text-ink/60 dark:text-dark-text/60">{r.description}</p>}
                <ul className="mt-2 space-y-1 text-sm text-ink/70 dark:text-dark-text/70">
                  {(r.routine_items ?? []).map((item: { id: string; habits?: { title: string }; tasks?: { title: string } }) => (
                    <li key={item.id}>· {item.habits?.title ?? item.tasks?.title}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display mb-4 text-xl">Plans &amp; templates</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(templates ?? []).map((t) => (
            <div key={t.id} className="rounded-card border border-hairline p-4 dark:border-dark-hairline">
              <p className="text-xs uppercase tracking-wide text-ink/40 dark:text-dark-text/40">{t.category.replace('_', ' ')}</p>
              <p className="mt-1 font-medium">{t.name}</p>
              <p className="text-sm text-ink/60 dark:text-dark-text/60">{t.description}</p>
              {t.estimated_minutes && <p className="mt-1 text-xs text-ink/40 dark:text-dark-text/40">~{t.estimated_minutes} min/day</p>}
              <ul className="mt-2 flex flex-wrap gap-1">
                {(t.benefits ?? []).map((b: string) => (
                  <li key={b} className="rounded-full bg-sage/10 px-2 py-0.5 text-xs text-sage dark:text-sage-light">
                    {b}
                  </li>
                ))}
              </ul>
              <form action={`/api/templates/${t.id}/import`} method="post" className="mt-3">
                <button className="focus-ring rounded-card border border-hairline px-3 py-1.5 text-sm hover:bg-ink/[0.03] dark:border-dark-hairline dark:hover:bg-white/[0.03]">
                  Import
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <Link href="/habits/new" className="text-sm text-sage underline decoration-hairline underline-offset-4 dark:text-sage-light">
        Or create a single habit instead
      </Link>
    </div>
  );
}
