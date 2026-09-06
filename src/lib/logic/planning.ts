import type { EnergyLevel, Habit } from '@/lib/types/database';

export interface EnergyPlan {
  level: EnergyLevel;
  explanation: string;
  prioritizedHabitIds: string[];
  fallbackSuggested: boolean;
}

export function buildEnergyPlan(level: EnergyLevel, habits: Habit[]): EnergyPlan {
  const ordered = [...habits].sort((left, right) => {
    if (level === 'low') return Number(right.goal_type === 'yes_no') - Number(left.goal_type === 'yes_no');
    if (level === 'high') return Number(left.goal_type !== 'yes_no') - Number(right.goal_type !== 'yes_no');
    return left.sort_order - right.sort_order;
  });
  const explanations: Record<EnergyLevel, string> = {
    low: 'Small, meaningful actions are first today. Nothing is hidden; choose what supports you.',
    steady: 'Your usual rhythm is here, in the order you set it.',
    high: 'You have room for a little extra. Optional stretch goals stay optional.',
  };
  return {
    level,
    explanation: explanations[level],
    prioritizedHabitIds: ordered.map((habit) => habit.id),
    fallbackSuggested: level === 'low',
  };
}

export const FRICTION_LABELS = {
  not_enough_time: 'Not enough time',
  too_tired: 'Too tired',
  forgot: 'Forgot',
  too_difficult: 'Too difficult',
  not_motivated: 'Not motivated',
  other: 'Other',
} as const;

export function recoverySuggestion(reason: keyof typeof FRICTION_LABELS): 'smaller_version' | 'reschedule' | 'resume' {
  if (reason === 'not_enough_time' || reason === 'too_tired' || reason === 'too_difficult') return 'smaller_version';
  if (reason === 'forgot') return 'reschedule';
  return 'resume';
}
