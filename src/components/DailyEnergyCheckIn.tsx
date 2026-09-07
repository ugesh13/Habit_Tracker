'use client';

import type { EnergyLevel } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';
import { useMemo, useState, useEffect } from 'react';

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === '42P01' || /could not find the table/i.test(error.message ?? ''));
}

const OPTIONS: Array<{ value: EnergyLevel; label: string; detail: string }> = [
  { value: 'low', label: 'Low energy', detail: 'Keep it small' },
  { value: 'steady', label: 'Steady energy', detail: 'Follow your rhythm' },
  { value: 'high', label: 'High energy', detail: 'Leave room for extra' },
];

const TIPS = {
  low: [
    "It's completely okay to have a low energy day. Be kind to yourself.",
    "Focus only on your most critical 'must-do' fallback habits.",
    "Hydrate well, rest if you can, and don't push yourself to exhaustion.",
    "Consistency is about showing up, even if it's just for 1 minute.",
    "A tiny step forward today is a massive win."
  ],
  steady: [
    "You're in a great groove! Stick to your standard routine.",
    "Aim to complete your core habits at a comfortable, sustainable pace.",
    "Protect your momentum by avoiding distractions.",
    "Enjoy the process of maintaining your rhythm today.",
    "You have exactly what it takes to get things done today."
  ],
  high: [
    "Incredible! Today is a great day to tackle those challenging habits.",
    "Consider doing the 'extra' version of your habits if you feel like it.",
    "Use this momentum to prepare for tomorrow or catch up on skipped tasks.",
    "Stay consistent, but don't burn yourself out. Pace your high energy.",
    "Harness this drive to build an unbreakable streak!"
  ]
};

export function DailyEnergyCheckIn({ date, energyLevel, onEnergySet }: { date: string; energyLevel: EnergyLevel | null; onEnergySet: (level: EnergyLevel) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Local state to instantly update UI while syncing
  const [localLevel, setLocalLevel] = useState<EnergyLevel | null>(energyLevel);

  useEffect(() => {
    setLocalLevel(energyLevel);
  }, [energyLevel]);

  async function choose(nextLevel: EnergyLevel) {
    if (localLevel) return; // Prevent changing if already set

    setLocalLevel(nextLevel);
    onEnergySet(nextLevel);
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
        {localLevel && !saving && (
          <span className="text-xs font-medium text-sage-dark dark:text-sage-light bg-sage/10 px-2 py-1 rounded-full flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Locked for today
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const isSelected = localLevel === option.value;
          const isFaded = localLevel && !isSelected;
          
          return (
            <button
              key={option.value}
              type="button"
              disabled={!!localLevel}
              onClick={() => choose(option.value)}
              aria-pressed={isSelected}
              className={`focus-ring rounded-card border px-3 py-3 text-left transition-all ${
                isSelected 
                  ? 'border-sage bg-sage/10 ring-1 ring-sage' 
                  : isFaded 
                    ? 'border-hairline opacity-40 cursor-default dark:border-dark-hairline' 
                    : 'border-hairline hover:bg-ink/[0.03] dark:border-dark-hairline dark:hover:bg-white/[0.03]'
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-1 block text-xs text-ink/50 dark:text-dark-text/50">{option.detail}</span>
            </button>
          );
        })}
      </div>

      {!localLevel && (
        <p className="mt-3 text-sm font-medium text-clay dark:text-clay-light flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Note: You can only select your energy level once per day.
        </p>
      )}

      {localLevel && (
        <div className="mt-5 p-4 rounded-xl bg-ink/5 dark:bg-white/5 border border-hairline dark:border-dark-hairline">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50 dark:text-dark-text/50 mb-2">Today's Suggestions</h3>
          <ul className="space-y-1.5 text-sm text-ink/80 dark:text-dark-text/80">
            {TIPS[localLevel].map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sage mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="mt-3 text-xs text-clay">{message}</p>}
    </section>
  );
}
