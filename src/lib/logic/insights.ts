import type { CheckIn, FrictionEntry, Habit, TimeBlock } from '@/lib/types/database';
import { isMomentumCompletion } from './momentum';

export interface ExplainableInsight {
  key: string;
  title: string;
  detail: string;
  evidence: string;
}

export function mostReliableTimeBlock(habits: Habit[], checkIns: CheckIn[]): ExplainableInsight | null {
  const counts = new Map<TimeBlock, { completed: number; scheduled: number }>();
  for (const habit of habits) {
    const values = counts.get(habit.time_block) ?? { completed: 0, scheduled: 0 };
    const habitCheckIns = checkIns.filter((checkIn) => checkIn.habit_id === habit.id);
    values.scheduled += habitCheckIns.length;
    values.completed += habitCheckIns.filter(isMomentumCompletion).length;
    counts.set(habit.time_block, values);
  }
  const ranked = [...counts.entries()]
    .filter(([, value]) => value.scheduled >= 3)
    .sort((left, right) => right[1].completed / right[1].scheduled - left[1].completed / left[1].scheduled);
  if (!ranked[0]) return null;
  const [timeBlock, value] = ranked[0];
  const percentage = Math.round((value.completed / value.scheduled) * 100);
  return {
    key: 'reliable_time_block',
    title: `${capitalize(timeBlock)} habits are supporting your rhythm.`,
    detail: `You complete habits most often in the ${timeBlock} block.`,
    evidence: `${value.completed} of ${value.scheduled} recorded check-ins were completed (${percentage}%).`,
  };
}

export function frictionInsight(entries: FrictionEntry[]): ExplainableInsight | null {
  if (entries.length < 3) return null;
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  const [reason, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return {
    key: 'friction_pattern',
    title: 'Your friction has a pattern.',
    detail: `${capitalize(reason.replaceAll('_', ' '))} comes up most often, so a smaller or better-timed version may help.`,
    evidence: `${count} of ${entries.length} friction notes used this reason.`,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
