'use client';

import type { HabitRowData } from '@/components/HabitRow';
import { useState } from 'react';

const REASONS = [
  ['not_enough_time', 'Not enough time'],
  ['too_tired', 'Too tired'],
  ['forgot', 'Forgot'],
  ['too_difficult', 'Too difficult'],
  ['not_motivated', 'Not motivated'],
  ['other', 'Other'],
] as const;

export function RecoveryPrompt({ habit, entryDate }: { habit: HabitRowData; entryDate: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0] | undefined>();
  const [message, setMessage] = useState('');

  async function choose(action: 'resume' | 'smaller_version' | 'reschedule' | 'pause') {
    const response = await fetch('/api/recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habit.id, entry_date: entryDate, action, reason }),
    });
    if (response.ok) {
      setMessage(action === 'smaller_version' ? 'A smaller version is ready when you are.' : 'Your plan is held gently for the next step.');
      setOpen(false);
    } else {
      setMessage('Recovery notes are available after signing in.');
    }
  }

  return (
    <section className="ritual-panel border-clay/20 bg-clay/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Recovery</p>
          <h2 className="font-display mt-1 text-2xl">No need to catch up all at once.</h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-dark-text/60">For {habit.title}, choose what would make returning easier.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring rounded-card bg-clay px-4 py-2 text-sm font-medium text-paper hover:bg-clay/90">
          {open ? 'Close options' : 'Choose support'}
        </button>
      </div>
      {open && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {REASONS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setReason(value)} aria-pressed={reason === value} className={`focus-ring rounded-full border px-3 py-1.5 text-xs ${reason === value ? 'border-clay bg-clay/10 text-clay' : 'border-hairline dark:border-dark-hairline'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => choose('smaller_version')} className="focus-ring rounded-card border border-sage px-3 py-2 text-sm text-sage dark:text-sage-light">Use a smaller version</button>
            <button type="button" onClick={() => choose('resume')} className="focus-ring rounded-card border border-hairline px-3 py-2 text-sm dark:border-dark-hairline">Resume normally tomorrow</button>
            <button type="button" onClick={() => choose('reschedule')} className="focus-ring rounded-card border border-hairline px-3 py-2 text-sm dark:border-dark-hairline">Reschedule it</button>
            <button type="button" onClick={() => choose('pause')} className="focus-ring rounded-card border border-hairline px-3 py-2 text-sm dark:border-dark-hairline">Pause for now</button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-sm text-sage dark:text-sage-light">{message}</p>}
    </section>
  );
}
