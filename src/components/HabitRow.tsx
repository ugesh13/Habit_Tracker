'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { GoalType } from '@/lib/types/database';

export interface HabitRowData {
  id: string;
  title: string;
  color: string;
  goal_type: GoalType;
  goal_target: number | null;
  goal_unit: string | null;
  status: 'scheduled' | 'complete' | 'skipped' | 'streak_saved' | 'overdue';
  value: number | null;
  consistency?: number;
}

interface HabitRowProps {
  habit: HabitRowData;
  entryDate: string;
  onToggle: (habitId: string, entryDate: string, nextComplete: boolean, value?: number) => Promise<void>;
  onDelete?: (habitId: string) => Promise<void>;
}

export function HabitRow({ habit, entryDate, onToggle, onDelete }: HabitRowProps) {
  const [pending, setPending] = useState(false);
  const isComplete = habit.status === 'complete' || habit.status === 'streak_saved';
  const isCountLike = habit.goal_type === 'count' || habit.goal_type === 'duration' || habit.goal_type === 'numeric';

  async function handleClick() {
    setPending(true);
    try {
      await onToggle(habit.id, entryDate, !isComplete, isCountLike ? habit.goal_target ?? undefined : undefined);
    } finally {
      setPending(false);
    }
  }

  const getConsistencyEmoji = (cons?: number) => {
    if (cons === undefined) return null;
    if (cons >= 0.8) return '😊';
    if (cons >= 0.5) return '😐';
    if (cons >= 0.2) return '😕';
    return '😢';
  };

  return (
    <div
      className={clsx(
        'group flex items-center gap-3 rounded-card border border-hairline bg-white/70 px-4 py-4 shadow-[0_8px_24px_rgba(41,55,43,0.04)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(41,55,43,0.08)] dark:border-dark-hairline dark:bg-dark-surface/70',
        habit.status === 'overdue' && 'border-clay/30 bg-clay/[0.04]',
        isComplete && 'bg-sage/[0.06]'
      )}
    >
      <button
        onClick={handleClick}
        disabled={pending}
        aria-pressed={isComplete}
        data-no-global-sound="true"
        aria-label={`${isComplete ? 'Mark incomplete' : 'Mark complete'}: ${habit.title}`}
        className={clsx(
          'focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] active:scale-95',
          isComplete ? 'border-transparent bg-sage text-paper' : 'border-hairline dark:border-dark-hairline'
        )}
        style={isComplete ? { backgroundColor: habit.color } : { borderColor: habit.color }}
      >
        {isComplete && (
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={clsx('truncate font-medium', isComplete && 'text-ink/50 line-through decoration-sage/50 dark:text-dark-text/50')}>{habit.title}</p>
          <span className="text-sm opacity-80" title="7-day Consistency">{getConsistencyEmoji(habit.consistency)}</span>
        </div>
        {isCountLike && habit.goal_target && (
          <p className="text-xs text-ink/40 dark:text-dark-text/40">
            {habit.value ?? (isComplete ? habit.goal_target : 0)} / {habit.goal_target} {habit.goal_unit}
          </p>
        )}
      </div>

      {habit.status === 'overdue' && <span className="rounded-full bg-clay/10 px-2 py-1 text-xs text-clay">A gentle retry</span>}
      {habit.status === 'streak_saved' && <span className="rounded-full bg-sage/10 px-2 py-1 text-xs text-sage dark:text-sage-light">Protected rhythm</span>}
      
      {onDelete && (
        <button
          onClick={() => onDelete(habit.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-ink/40 hover:text-clay dark:text-dark-text/40"
          aria-label="Delete habit"
          title="Delete habit"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
