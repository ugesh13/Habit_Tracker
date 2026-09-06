import { describe, expect, it } from 'vitest';
import { isHabitScheduledOn, isTimesPerWeekSatisfied, timesPerWeekProgress } from './recurrence';
import type { Habit } from '@/lib/types/database';

function baseHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    title: 'Test habit',
    description: null,
    icon: 'sparkle',
    color: '#4F6F52',
    kind: 'build',
    goal_type: 'yes_no',
    goal_target: null,
    goal_unit: null,
    recurrence_type: 'daily',
    recurrence_days: null,
    times_per_week: null,
    time_block: 'anytime',
    start_date: '2026-01-01',
    end_date: null,
    notes: null,
    is_archived: false,
    is_paused: false,
    streak_saver_credits: 0,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('isHabitScheduledOn', () => {
  it('daily habit is scheduled every day on/after start_date', () => {
    const h = baseHabit({ recurrence_type: 'daily' });
    expect(isHabitScheduledOn(h, new Date('2026-01-01'))).toBe(true);
    expect(isHabitScheduledOn(h, new Date('2026-03-15'))).toBe(true);
    expect(isHabitScheduledOn(h, new Date('2025-12-31'))).toBe(false);
  });

  it('weekdays habit excludes Saturday/Sunday', () => {
    const h = baseHabit({ recurrence_type: 'weekdays' });
    expect(isHabitScheduledOn(h, new Date('2026-01-05'))).toBe(true); // Monday
    expect(isHabitScheduledOn(h, new Date('2026-01-10'))).toBe(false); // Saturday
    expect(isHabitScheduledOn(h, new Date('2026-01-11'))).toBe(false); // Sunday
  });

  it('custom_days only matches the configured days', () => {
    const h = baseHabit({ recurrence_type: 'custom_days', recurrence_days: [1, 3, 5] }); // Mon/Wed/Fri
    expect(isHabitScheduledOn(h, new Date('2026-01-05'))).toBe(true); // Monday
    expect(isHabitScheduledOn(h, new Date('2026-01-06'))).toBe(false); // Tuesday
    expect(isHabitScheduledOn(h, new Date('2026-01-07'))).toBe(true); // Wednesday
  });

  it('respects end_date and archived/paused flags', () => {
    const ended = baseHabit({ end_date: '2026-01-10' });
    expect(isHabitScheduledOn(ended, new Date('2026-01-05'))).toBe(true);
    expect(isHabitScheduledOn(ended, new Date('2026-01-15'))).toBe(false);

    const archived = baseHabit({ is_archived: true });
    expect(isHabitScheduledOn(archived, new Date('2026-01-05'))).toBe(false);

    const paused = baseHabit({ is_paused: true });
    expect(isHabitScheduledOn(paused, new Date('2026-01-05'))).toBe(false);
  });
});

describe('times_per_week helpers', () => {
  it('counts completions within the current week only', () => {
    const dates = ['2026-01-05', '2026-01-06', '2025-12-29']; // last one is prior week
    const progress = timesPerWeekProgress(dates, new Date('2026-01-07'), 1);
    expect(progress).toBe(2);
  });

  it('is satisfied once the weekly target is met', () => {
    const h = baseHabit({ recurrence_type: 'times_per_week', times_per_week: 3 });
    const dates = ['2026-01-05', '2026-01-06', '2026-01-07'];
    expect(isTimesPerWeekSatisfied(h, dates, new Date('2026-01-07'), 1)).toBe(true);
    expect(isTimesPerWeekSatisfied(h, dates.slice(0, 2), new Date('2026-01-07'), 1)).toBe(false);
  });
});
