import { describe, expect, it } from 'vitest';
import type { CheckIn, Habit } from '@/lib/types/database';
import { mostReliableTimeBlock } from './insights';

const habit: Habit = {
  id: 'habit-1', user_id: 'user-1', title: 'Read', description: null, icon: 'sparkle', color: '#4F6F52', kind: 'build', goal_type: 'yes_no',
  goal_target: null, goal_unit: null, recurrence_type: 'daily', recurrence_days: null, times_per_week: null, time_block: 'evening',
  start_date: '2026-09-01', end_date: null, notes: null, is_archived: false, is_paused: false, streak_saver_credits: 0, sort_order: 0, created_at: '', updated_at: '',
};
const checkIn = (date: string): CheckIn => ({ id: date, user_id: 'user-1', habit_id: 'habit-1', entry_date: date, status: 'complete', value: null, note: null, created_at: '' });

describe('explainable insights', () => {
  it('requires enough evidence before making a time-block claim', () => {
    expect(mostReliableTimeBlock([habit], [checkIn('2026-09-01'), checkIn('2026-09-02')])).toBeNull();
    expect(mostReliableTimeBlock([habit], [checkIn('2026-09-01'), checkIn('2026-09-02'), checkIn('2026-09-03')])?.key).toBe('reliable_time_block');
  });
});
