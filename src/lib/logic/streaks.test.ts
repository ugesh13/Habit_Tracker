import { describe, expect, it } from 'vitest';
import { computeHabitStreak, isPerfectDay, calculateStreakSaver } from './streaks';
import type { CheckIn, Habit } from '@/lib/types/database';

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
    streak_saver_credits: 1,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function checkIn(entry_date: string, status: CheckIn['status'] = 'complete'): CheckIn {
  return {
    id: `c-${entry_date}`,
    user_id: 'u1',
    habit_id: 'h1',
    entry_date,
    status,
    value: null,
    note: null,
    created_at: `${entry_date}T00:00:00Z`,
  };
}

describe('computeHabitStreak', () => {
  it('builds a perfect run into current + longest streak', () => {
    const habit = baseHabit({ start_date: '2026-01-01' });
    const checkIns = ['01', '02', '03', '04', '05'].map((d) => checkIn(`2026-01-${d}`));
    const result = computeHabitStreak({ habit, checkIns, asOf: new Date('2026-01-05') });
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.completionRate).toBe(1);
  });

  it('a missed scheduled day breaks the current streak but preserves longest', () => {
    const habit = baseHabit({ start_date: '2026-01-01' });
    // complete 1-3, miss 4, complete 5
    const checkIns = ['01', '02', '03', '05'].map((d) => checkIn(`2026-01-${d}`));
    const result = computeHabitStreak({ habit, checkIns, asOf: new Date('2026-01-05') });
    expect(result.currentStreak).toBe(1); // only the 5th
    expect(result.longestStreak).toBe(3); // the 1-3 run
    expect(result.completionRate).toBeCloseTo(4 / 5);
  });

  it('a streak_saved status counts the same as complete', () => {
    const habit = baseHabit({ start_date: '2026-01-01' });
    const checkIns = [checkIn('2026-01-01'), checkIn('2026-01-02', 'streak_saved'), checkIn('2026-01-03')];
    const result = computeHabitStreak({ habit, checkIns, asOf: new Date('2026-01-03') });
    expect(result.currentStreak).toBe(3);
  });

  it('unscheduled days (weekdays-only habit) never break the streak', () => {
    const habit = baseHabit({ start_date: '2026-01-05', recurrence_type: 'weekdays' }); // Monday
    // Mon-Fri complete (01-05 -> 01-09), Sat/Sun unscheduled, next Monday complete
    const dates = ['05', '06', '07', '08', '09', '12'].map((d) => `2026-01-${d}`);
    const checkIns = dates.map((d) => checkIn(d));
    const result = computeHabitStreak({ habit, checkIns, asOf: new Date('2026-01-12') });
    expect(result.currentStreak).toBe(6);
  });

  it('handles a habit with zero check-ins', () => {
    const habit = baseHabit({ start_date: '2026-01-01' });
    const result = computeHabitStreak({ habit, checkIns: [], asOf: new Date('2026-01-03') });
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.completionRate).toBe(0);
  });
});

describe('isPerfectDay', () => {
  it('is true when every scheduled habit is satisfied directly', () => {
    const habits = [baseHabit({ id: 'a' }), baseHabit({ id: 'b' })];
    expect(isPerfectDay(habits, new Set(['a', 'b']), [])).toBe(true);
  });

  it('is true when a linked alternative satisfies the group', () => {
    const habits = [baseHabit({ id: 'gym' }), baseHabit({ id: 'other' })];
    // 'gym' and 'home-workout' are linked; only 'home-workout' was done today
    expect(isPerfectDay(habits, new Set(['home-workout', 'other']), [['gym', 'home-workout']])).toBe(true);
  });

  it('is false when a non-linked habit is missing', () => {
    const habits = [baseHabit({ id: 'a' }), baseHabit({ id: 'b' })];
    expect(isPerfectDay(habits, new Set(['a']), [])).toBe(false);
  });

  it('is false with no scheduled habits', () => {
    expect(isPerfectDay([], new Set(), [])).toBe(false);
  });
});

describe('calculateStreakSaver', () => {
  it('allows use when credits are available and decrements', () => {
    expect(calculateStreakSaver(2)).toEqual({ allowed: true, creditsRemaining: 1 });
  });
  it('disallows use with zero credits', () => {
    expect(calculateStreakSaver(0)).toEqual({ allowed: false, creditsRemaining: 0 });
  });
});
