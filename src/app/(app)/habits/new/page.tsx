'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function NewHabitPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'build' | 'quit'>('build');
  const [goalType, setGoalType] = useState<'yes_no' | 'count' | 'duration' | 'numeric'>('yes_no');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekdays' | 'custom_days' | 'times_per_week'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [timeBlock, setTimeBlock] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [color, setColor] = useState('#4F6F52');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      title,
      kind,
      goal_type: goalType,
      goal_target: goalType === 'yes_no' ? null : Number(goalTarget) || null,
      goal_unit: goalType === 'yes_no' ? null : goalUnit || null,
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceType === 'custom_days' ? customDays : null,
      times_per_week: recurrenceType === 'times_per_week' ? Number(timesPerWeek) : null,
      time_block: timeBlock,
      color,
      start_date: new Date().toISOString().slice(0, 10),
    };

    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }
    router.replace('/today');
    router.refresh();
  }

  const inputClass =
    'focus-ring w-full rounded-card border border-hairline bg-transparent px-4 py-2.5 dark:border-dark-hairline';

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display mb-6 text-2xl">New habit</h1>
      <div className="mb-6 flex items-center gap-2 text-xs text-ink/50 dark:text-dark-text/50" aria-label="Habit creation steps">
        {[['1', 'Name it'], ['2', 'Shape it'], ['3', 'Place it']].map(([number, label]) => (
          <div key={number} className={`flex flex-1 items-center gap-2 ${step >= Number(number) ? 'text-sage dark:text-sage-light' : ''}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${step >= Number(number) ? 'border-sage bg-sage/10' : 'border-hairline dark:border-dark-hairline'}`}>{number}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={step === 1 ? 'space-y-6' : 'hidden'}>
          <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Type</legend>
          <div className="flex gap-2">
            {(['build', 'quit'] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`focus-ring rounded-full border px-4 py-1.5 text-sm capitalize ${
                  kind === k ? 'border-sage bg-sage/10 text-sage dark:text-sage-light' : 'border-hairline dark:border-dark-hairline'
                }`}
              >
                {k === 'build' ? 'Build' : 'Quit / avoid'}
              </button>
            ))}
          </div>
          </fieldset>
        </div>

        <fieldset className={step === 2 ? 'space-y-1.5' : 'hidden'}>
          <legend className="text-sm font-medium">Goal</legend>
          <select value={goalType} onChange={(e) => setGoalType(e.target.value as typeof goalType)} className={inputClass}>
            <option value="yes_no">Yes / no</option>
            <option value="count">Count (e.g. glasses of water)</option>
            <option value="duration">Duration (minutes)</option>
            <option value="numeric">Numeric measurement (e.g. km)</option>
          </select>
          {goalType !== 'yes_no' && (
            <div className="flex gap-2 pt-1">
              <input
                type="number"
                min={1}
                placeholder="Target"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="text"
                placeholder="Unit (glasses, minutes, km…)"
                value={goalUnit}
                onChange={(e) => setGoalUnit(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </fieldset>

        <fieldset className={step === 3 ? 'space-y-1.5' : 'hidden'}>
          <legend className="text-sm font-medium">Schedule</legend>
          <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as typeof recurrenceType)} className={inputClass}>
            <option value="daily">Every day</option>
            <option value="weekdays">Weekdays only</option>
            <option value="custom_days">Specific days</option>
            <option value="times_per_week">A number of times per week</option>
          </select>

          {recurrenceType === 'custom_days' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => setCustomDays((d) => (d.includes(idx) ? d.filter((x) => x !== idx) : [...d, idx]))}
                  aria-pressed={customDays.includes(idx)}
                  className={`focus-ring rounded-full border px-3 py-1 text-xs ${
                    customDays.includes(idx) ? 'border-sage bg-sage/10 text-sage dark:text-sage-light' : 'border-hairline dark:border-dark-hairline'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {recurrenceType === 'times_per_week' && (
            <input
              type="number"
              min={1}
              max={7}
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(e.target.value)}
              className={`${inputClass} mt-1 w-24`}
            />
          )}
        </fieldset>

        <fieldset className={step === 3 ? 'space-y-1.5' : 'hidden'}>
          <legend className="text-sm font-medium">Time of day</legend>
          <select value={timeBlock} onChange={(e) => setTimeBlock(e.target.value as typeof timeBlock)} className={inputClass}>
            <option value="anytime">Anytime</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </fieldset>

        <div className={step === 3 ? 'space-y-1.5' : 'hidden'}>
          <label htmlFor="color" className="text-sm font-medium">
            Color
          </label>
          <input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-card" />
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        )}

        {step === 2 && <div className="rounded-card border border-sage/20 bg-sage/[0.05] p-4 text-sm"><p className="font-medium">A habit shaped for you</p><p className="mt-1 text-ink/60 dark:text-dark-text/60">{title || 'Your new habit'} will be tracked as {goalType === 'yes_no' ? 'a simple yes or no' : `${goalTarget || 'a target'} ${goalUnit || 'units'}`}.</p></div>}

        <div className="flex gap-3">
          {step > 1 && <button type="button" onClick={() => setStep((value) => value - 1)} className="focus-ring flex-1 rounded-card border border-hairline px-6 py-3 font-medium dark:border-dark-hairline">Back</button>}
          {step < 3 ? <button type="button" onClick={() => setStep((value) => value + 1)} className="focus-ring flex-1 rounded-card bg-sage px-6 py-3 font-medium text-paper hover:bg-sage-dark">Continue</button> : <button type="submit" disabled={submitting} className="focus-ring flex-1 rounded-card bg-sage px-6 py-3 font-medium text-paper transition-colors hover:bg-sage-dark disabled:opacity-60">{submitting ? 'Saving…' : 'Save habit'}</button>}
        </div>
      </form>
    </div>
  );
}
