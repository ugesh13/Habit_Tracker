// Simple, transparent XP/leveling model. Kept deliberately unflashy per the
// brief's "calm, optional gamification" requirement - no randomized loot,
// no pressure mechanics.

export const XP_PER_CHECKIN = 10;
export const XP_STREAK_BONUS_EVERY = 7; // bonus every 7-day streak milestone
export const XP_STREAK_BONUS_AMOUNT = 25;
export const XP_PERFECT_DAY_BONUS = 15;

/** XP required to reach `level` (level 1 starts at 0). Quadratic curve, gentle early on. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * Math.pow(level - 1, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpRequiredForLevel(level + 1)) level++;
  return level;
}

export function xpForCheckIn(opts: { newStreak: number; isPerfectDay: boolean }): number {
  let xp = XP_PER_CHECKIN;
  if (opts.newStreak > 0 && opts.newStreak % XP_STREAK_BONUS_EVERY === 0) {
    xp += XP_STREAK_BONUS_AMOUNT;
  }
  if (opts.isPerfectDay) xp += XP_PERFECT_DAY_BONUS;
  return xp;
}

export function progressToNextLevel(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  const level = levelForXp(xp);
  const floor = xpRequiredForLevel(level);
  const ceiling = xpRequiredForLevel(level + 1);
  return { level, xpIntoLevel: xp - floor, xpForNextLevel: ceiling - floor };
}
