import { describe, expect, it } from 'vitest';
import type { CheckIn, Habit } from '@/lib/types/database';
import { momentumStreak, protectedRhythmDays } from './momentum';

const habit: Habit = {
  id: 'habit-1', user_id: 'user-1', title: 'Workout', description: null, icon: 'sparkle', color: '#4F6F52',
  kind: 'build', goal_type: 'duration', goal_target: 30, goal_unit: 'minutes', recurrence_type: 'daily',
  recurrence_days: null, times_per_week: null, time_block: 'morning', start_date: '2026-09-01', end_date: null,
  notes: null, is_archived: false, is_paused: false, streak_saver_credits: 0, sort_order: 0,
  created_at: '', updated_at: '',
};

function checkIn(entry_date: string, completion_mode: CheckIn['completion_mode'] = 'primary'): CheckIn {
  return { id: entry_date, user_id: 'user-1', habit_id: 'habit-1', entry_date, status: 'complete', completion_mode, fallback_for_habit_id: null, value: 1, note: null, created_at: '' };
}

describe('Flexible Momentum', () => {
  it('counts fallback completion as protected rhythm', () => {
    const days = protectedRhythmDays(habit, [checkIn('2026-09-01', 'fallback'), checkIn('2026-09-02')], '2026-09-01', '2026-09-02');
    expect(days.every((day) => day.protected)).toBe(true);
    expect(momentumStreak(habit, [checkIn('2026-09-01', 'fallback'), checkIn('2026-09-02')], new Date('2026-09-02'))).toBe(2);
  });

  it('does not count skipped or rescheduled entries as protected', () => {
    const rescheduled = checkIn('2026-09-01', 'rescheduled');
    expect(momentumStreak(habit, [rescheduled], new Date('2026-09-01'))).toBe(0);
  });
});
