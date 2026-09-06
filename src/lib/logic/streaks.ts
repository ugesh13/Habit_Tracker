import type { CheckIn, Habit } from '@/lib/types/database';
import { isHabitScheduledOn } from './recurrence';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0..1 over scheduled days from start_date..asOf
  perfectDays: number;
}

interface StreakInput {
  habit: Habit;
  /** All check-ins for this habit (any status), most-recent-first or unordered - order doesn't matter. */
  checkIns: CheckIn[];
  asOf: Date;
  weekStart?: number;
}

/**
 * Computes streak + completion stats for a single habit as of `asOf` (inclusive).
 *
 * Rules:
 * - A day counts toward the streak if the habit was scheduled that day AND has a
 *   check-in with status 'complete' or 'streak_saved'.
 * - A scheduled day with no check-in and no streak-saver breaks the current streak.
 * - Unscheduled days never break or extend a streak - they're skipped entirely.
 * - `times_per_week` habits are evaluated at the week granularity elsewhere
 *   (see recurrence.ts) and are treated as "satisfied that day" only if a
 *   check-in exists for that specific day, matching the log-per-day model.
 */
export function computeHabitStreak({ habit, checkIns, asOf }: StreakInput): StreakResult {
  const satisfiedDates = new Set(
    checkIns
      .filter((c) => c.status === 'complete' || c.status === 'streak_saved')
      .map((c) => c.entry_date)
  );

  const start = parseISO(habit.start_date);
  const totalDays = Math.max(0, differenceInCalendarDays(asOf, start)) + 1;

  let scheduledCount = 0;
  let satisfiedCount = 0;
  let perfectDays = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let currentStreak = 0;

  // Walk chronologically so "longest" and "current" (trailing from asOf) both fall out naturally.
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const dateStr = toDateStr(day);

    if (!isHabitScheduledOn(habit, day)) continue;

    scheduledCount++;
    const satisfied = satisfiedDates.has(dateStr);

    if (satisfied) {
      satisfiedCount++;
      perfectDays++;
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  // Current streak = trailing run ending at the most recent *scheduled* day <= asOf.
  currentStreak = 0;
  for (let i = totalDays - 1; i >= 0; i--) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    if (!isHabitScheduledOn(habit, day)) continue;
    const dateStr = toDateStr(day);
    if (satisfiedDates.has(dateStr)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
    completionRate: scheduledCount === 0 ? 0 : satisfiedCount / scheduledCount,
    perfectDays,
  };
}

/**
 * Given a set of habits and check-ins across those habits for a single day,
 * determines whether every habit *scheduled* that day was satisfied by that
 * habit itself OR by a linked alternative (see habit_links / habit_link_members).
 * Used for the "perfect day" celebration and achievement.
 */
export function isPerfectDay(
  habitsScheduledToday: Habit[],
  satisfiedHabitIdsToday: Set<string>,
  linkGroups: string[][] // each inner array = habit_ids that satisfy each other
): boolean {
  if (habitsScheduledToday.length === 0) return false;

  const linkedSatisfied = new Set(satisfiedHabitIdsToday);
  for (const group of linkGroups) {
    if (group.some((id) => satisfiedHabitIdsToday.has(id))) {
      group.forEach((id) => linkedSatisfied.add(id));
    }
  }

  return habitsScheduledToday.every((h) => linkedSatisfied.has(h.id));
}

/**
 * Applies a streak saver to a missed day: returns the updated credit count and
 * whether the save was allowed. Callers persist the resulting check-in row
 * (status='streak_saved') and a streak_saver_events audit row.
 */
export function calculateStreakSaver(creditsAvailable: number): { allowed: boolean; creditsRemaining: number } {
  if (creditsAvailable <= 0) return { allowed: false, creditsRemaining: creditsAvailable };
  return { allowed: true, creditsRemaining: creditsAvailable - 1 };
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
