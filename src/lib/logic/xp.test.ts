import { describe, expect, it } from 'vitest';
import { levelForXp, progressToNextLevel, xpForCheckIn, xpRequiredForLevel } from './xp';

describe('xpRequiredForLevel / levelForXp', () => {
  it('level 1 requires 0 xp', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(levelForXp(0)).toBe(1);
  });

  it('required xp increases monotonically with level', () => {
    for (let l = 1; l < 20; l++) {
      expect(xpRequiredForLevel(l + 1)).toBeGreaterThan(xpRequiredForLevel(l));
    }
  });

  it('levelForXp is the inverse of xpRequiredForLevel at exact boundaries', () => {
    const xpAtLevel5 = xpRequiredForLevel(5);
    expect(levelForXp(xpAtLevel5)).toBe(5);
    expect(levelForXp(xpAtLevel5 - 1)).toBe(4);
  });
});

describe('xpForCheckIn', () => {
  it('gives base xp with no bonuses', () => {
    expect(xpForCheckIn({ newStreak: 1, isPerfectDay: false })).toBe(10);
  });

  it('adds streak bonus every 7 days', () => {
    expect(xpForCheckIn({ newStreak: 7, isPerfectDay: false })).toBe(10 + 25);
    expect(xpForCheckIn({ newStreak: 14, isPerfectDay: false })).toBe(10 + 25);
    expect(xpForCheckIn({ newStreak: 8, isPerfectDay: false })).toBe(10);
  });

  it('adds perfect day bonus', () => {
    expect(xpForCheckIn({ newStreak: 1, isPerfectDay: true })).toBe(10 + 15);
  });

  it('stacks streak and perfect day bonuses', () => {
    expect(xpForCheckIn({ newStreak: 7, isPerfectDay: true })).toBe(10 + 25 + 15);
  });
});

describe('progressToNextLevel', () => {
  it('reports progress within the current level band', () => {
    const p = progressToNextLevel(10);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(10);
    expect(p.xpForNextLevel).toBe(xpRequiredForLevel(2));
  });
});
