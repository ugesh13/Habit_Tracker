import type { CheckIn, Habit, FrictionEntry } from '@/lib/types/database';
import { isMomentumCompletion } from './momentum';

export interface RhythmReport {
  completedCheckIns: number;
  scheduledCheckIns: number;
  consistency: number;
  bestHabit: string | null;
  topFriction: string | null;
  comeback: boolean;
}

export function buildRhythmReport(habits: Habit[], checkIns: CheckIn[], friction: FrictionEntry[]): RhythmReport {
  const completedCheckIns = checkIns.filter(isMomentumCompletion).length;
  const scheduledCheckIns = Math.max(completedCheckIns, habits.length);
  const byHabit = habits.map((habit) => ({
    habit,
    completed: checkIns.filter((checkIn) => checkIn.habit_id === habit.id && isMomentumCompletion(checkIn)).length,
  })).sort((left, right) => right.completed - left.completed);
  const frictionCounts = new Map<string, number>();
  for (const entry of friction) frictionCounts.set(entry.reason, (frictionCounts.get(entry.reason) ?? 0) + 1);
  const topFriction = [...frictionCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  return {
    completedCheckIns,
    scheduledCheckIns,
    consistency: scheduledCheckIns === 0 ? 0 : completedCheckIns / scheduledCheckIns,
    bestHabit: byHabit[0]?.habit.title ?? null,
    topFriction,
    comeback: checkIns.length > 0 && friction.length > 0,
  };
}
