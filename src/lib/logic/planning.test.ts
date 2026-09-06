import { describe, expect, it } from 'vitest';
import type { Habit } from '@/lib/types/database';
import { buildEnergyPlan, recoverySuggestion } from './planning';

const habit = (id: string, goal_type: Habit['goal_type'], sort_order: number): Habit => ({
  id, user_id: 'user-1', title: id, description: null, icon: 'sparkle', color: '#4F6F52', kind: 'build',
  goal_type, goal_target: null, goal_unit: null, recurrence_type: 'daily', recurrence_days: null,
  times_per_week: null, time_block: 'anytime', start_date: '2026-09-01', end_date: null, notes: null,
  is_archived: false, is_paused: false, streak_saver_credits: 0, sort_order, created_at: '', updated_at: '',
});

describe('energy planning', () => {
  it('puts simple yes/no habits first on low-energy days', () => {
    const plan = buildEnergyPlan('low', [habit('long', 'duration', 0), habit('small', 'yes_no', 1)]);
    expect(plan.prioritizedHabitIds).toEqual(['small', 'long']);
    expect(plan.fallbackSuggested).toBe(true);
  });

  it('maps time and fatigue friction to a smaller version', () => {
    expect(recoverySuggestion('not_enough_time')).toBe('smaller_version');
    expect(recoverySuggestion('too_tired')).toBe('smaller_version');
  });
});
