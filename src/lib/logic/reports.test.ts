import { describe, expect, it } from 'vitest';
import type { CheckIn, Habit } from '@/lib/types/database';
import { buildRhythmReport } from './reports';

const habit: Habit = {
  id: 'habit-1', user_id: 'user-1', title: 'Read', description: null, icon: 'sparkle', color: '#4F6F52', kind: 'build', goal_type: 'yes_no',
  goal_target: null, goal_unit: null, recurrence_type: 'daily', recurrence_days: null, times_per_week: null, time_block: 'evening',
  start_date: '2026-09-01', end_date: null, notes: null, is_archived: false, is_paused: false, streak_saver_credits: 0, sort_order: 0, created_at: '', updated_at: '',
};
const checkIn: CheckIn = { id: 'checkin-1', user_id: 'user-1', habit_id: 'habit-1', entry_date: '2026-09-01', status: 'complete', value: null, note: null, created_at: '' };

describe('Rhythm reports', () => {
  it('summarizes real check-ins and habit support', () => {
    const report = buildRhythmReport([habit], [checkIn], [{ id: 'f', user_id: 'user-1', habit_id: habit.id, entry_date: '2026-09-02', reason: 'too_tired', note: null, created_at: '' }]);
    expect(report.bestHabit).toBe('Read');
    expect(report.comeback).toBe(true);
    expect(report.consistency).toBe(1);
  });
});
