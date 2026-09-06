import type { Habit } from '@/lib/types/database';
import { differenceInCalendarWeeks, isAfter, isBefore, parseISO, startOfWeek } from 'date-fns';

/**
 * Determines whether `habit` is scheduled to appear on `date`.
 * `weekStart` follows the DB convention: 0=Sunday..6=Saturday.
 *
 * Note: `times_per_week` habits are schedule-agnostic per calendar day - they are
 * considered "available every day" and satisfied once N check-ins land in the
 * ISO week; use `isTimesPerWeekSatisfied` alongside this for completion state.
 */
export function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  const start = parseISO(habit.start_date);
  if (isBefore(date, startOfDay(start))) return false;
  if (habit.end_date && isAfter(date, endOfDay(parseISO(habit.end_date)))) return false;
  if (habit.is_archived || habit.is_paused) return false;

  switch (habit.recurrence_type) {
    case 'daily':
      return true;
    case 'weekdays': {
      const day = date.getDay(); // 0=Sun..6=Sat
      return day >= 1 && day <= 5;
    }
    case 'custom_days': {
      const day = date.getDay();
      return (habit.recurrence_days ?? []).includes(day);
    }
    case 'times_per_week':
      // Available every day; "scheduled" in the sense the user can act on it any day of the week.
      return true;
    default:
      return false;
  }
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Counts completions already logged within the ISO week (respecting weekStart) containing `date`. */
export function timesPerWeekProgress(
  checkInDatesForHabit: string[], // entry_date strings, YYYY-MM-DD, status=complete/streak_saved
  date: Date,
  weekStart = 1
): number {
  const weekStartDate = startOfWeek(date, { weekStartsOn: weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  return checkInDatesForHabit.filter((d) => {
    const parsed = parseISO(d);
    return (
      differenceInCalendarWeeks(date, parsed, { weekStartsOn: weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6 }) === 0 &&
      !isBefore(parsed, weekStartDate)
    );
  }).length;
}

export function isTimesPerWeekSatisfied(
  habit: Habit,
  checkInDatesForHabit: string[],
  date: Date,
  weekStart = 1
): boolean {
  if (habit.recurrence_type !== 'times_per_week' || !habit.times_per_week) return false;
  return timesPerWeekProgress(checkInDatesForHabit, date, weekStart) >= habit.times_per_week;
}
