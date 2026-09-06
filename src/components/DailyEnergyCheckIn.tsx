'use client';

import type { EnergyLevel } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === '42P01' || /could not find the table/i.test(error.message ?? ''));
}

const OPTIONS: Array<{ value: EnergyLevel; label: string; detail: string }> = [
  { value: 'low', label: 'Low energy', detail: 'Keep it small' },
  { value: 'steady', label: 'Steady energy', detail: 'Follow your rhythm' },
  { value: 'high', label: 'High energy', detail: 'Leave room for extra' },
];

export function DailyEnergyCheckIn({ date }: { date: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [level, setLevel] = useState<EnergyLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const { data, error } = await supabase.from('daily_energy').select('level').eq('entry_date', date).maybeSingle();
      if (!cancelled) {
        if (isMissingTableError(error)) {
          setMessage('Energy tracking is waiting for the database migration to be applied.');
          return;
        }
        setLevel(data?.level ?? null);
      }
    }
    load().catch(() => undefined);
    return () => { cancelled = true; };
  }, [date, supabase]);

  async function choose(nextLevel: EnergyLevel) {
    setLevel(nextLevel);
    setSaving(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSaving(false);
      setMessage('Energy notes are available after signing in.');
      return;
    }
    const { error } = await supabase.from('daily_energy').upsert(
      { user_id: sessionData.session.user.id, entry_date: date, level: nextLevel },
      { onConflict: 'user_id,entry_date' }
    );
    setSaving(false);
    if (error) {
      if (isMissingTableError(error)) {
        setMessage('Energy tracking is waiting for the database migration to be applied.');
        return;
      }
      setMessage(error.message);
    }
  }

  return (
    <section className="ritual-panel p-5" aria-labelledby="energy-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">Daily check-in</p>
          <h2 id="energy-heading" className="font-display mt-1 text-2xl">How is your energy today?</h2>
        </div>
        {saving && <span className="text-xs text-ink/45 dark:text-dark-text/45">Saving...</span>}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={level === option.value}
            className={`focus-ring rounded-card border px-3 py-3 text-left transition-colors ${
              level === option.value ? 'border-sage bg-sage/10' : 'border-hairline hover:bg-ink/[0.03] dark:border-dark-hairline dark:hover:bg-white/[0.03]'
            }`}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="mt-1 block text-xs text-ink/50 dark:text-dark-text/50">{option.detail}</span>
          </button>
        ))}
      </div>
      {level === 'low' && <p className="mt-3 text-sm text-ink/60 dark:text-dark-text/60">Small actions and fallback options are highlighted first. Your full plan remains below.</p>}
      {message && <p className="mt-3 text-xs text-clay">{message}</p>}
    </section>
  );
}
