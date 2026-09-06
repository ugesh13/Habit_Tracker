import type { CheckIn, CompletionMode, Habit } from '@/lib/types/database';
import { isHabitScheduledOn } from './recurrence';
import { format, parseISO } from 'date-fns';

export interface MomentumDay {
  date: string;
  mode: CompletionMode | 'missed' | 'unscheduled';
  protected: boolean;
}

export function isMomentumCompletion(checkIn: Pick<CheckIn, 'status' | 'completion_mode'>): boolean {
  return (checkIn.status === 'complete' || checkIn.status === 'streak_saved') && checkIn.completion_mode !== 'rescheduled';
}

export function protectedRhythmDays(habit: Habit, checkIns: CheckIn[], from: string, to: string): MomentumDay[] {
  const byDate = new Map(checkIns.map((checkIn) => [checkIn.entry_date, checkIn]));
  const cursor = parseISO(from);
  const end = parseISO(to);
  const days: MomentumDay[] = [];
  while (cursor <= end) {
    const date = format(cursor, 'yyyy-MM-dd');
    const checkIn = byDate.get(date);
    if (!isHabitScheduledOn(habit, cursor)) {
      days.push({ date, mode: 'unscheduled', protected: false });
    } else if (checkIn && isMomentumCompletion(checkIn)) {
      days.push({ date, mode: checkIn.completion_mode ?? 'primary', protected: true });
    } else {
      days.push({ date, mode: 'missed', protected: false });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function momentumStreak(habit: Habit, checkIns: CheckIn[], asOf: Date): number {
  const days = protectedRhythmDays(habit, checkIns, habit.start_date, format(asOf, 'yyyy-MM-dd'));
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (day.mode === 'unscheduled') continue;
    if (!day.protected) break;
    streak += 1;
  }
  return streak;
}

export function momentumLabel(mode: CompletionMode): string {
  if (mode === 'fallback') return 'Protected rhythm';
  if (mode === 'rescheduled') return 'Kept in motion';
  return 'Primary practice';
}
