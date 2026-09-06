import { z } from 'zod';

export const timeBlockSchema = z.enum(['morning', 'afternoon', 'evening', 'anytime']);

// Base object (pre-refinement) so callers can derive a `.partial()` version for
// PATCH endpoints - `habitInputSchema` below adds cross-field checks via
// superRefine, and zod does not expose `.partial()` on a ZodEffects.
export const habitObjectSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    description: z.string().max(2000).optional().nullable(),
    icon: z.string().max(60).default('sparkle'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value').default('#4F6F52'),
    kind: z.enum(['build', 'quit']).default('build'),
    goal_type: z.enum(['yes_no', 'count', 'duration', 'numeric']).default('yes_no'),
    goal_target: z.number().positive().optional().nullable(),
    goal_unit: z.string().max(40).optional().nullable(),
    recurrence_type: z.enum(['daily', 'weekdays', 'custom_days', 'times_per_week']).default('daily'),
    recurrence_days: z.array(z.number().int().min(0).max(6)).optional().nullable(),
    times_per_week: z.number().int().min(1).max(7).optional().nullable(),
    time_block: timeBlockSchema.default('anytime'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    label_ids: z.array(z.string().uuid()).optional().default([]),
});

export const habitInputSchema = habitObjectSchema.superRefine((data, ctx) => {
    if (data.goal_type !== 'yes_no' && !data.goal_target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['goal_target'],
        message: 'goal_target is required for count/duration/numeric goals',
      });
    }
    if (data.recurrence_type === 'custom_days' && (!data.recurrence_days || data.recurrence_days.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence_days'],
        message: 'recurrence_days is required for custom_days recurrence',
      });
    }
    if (data.recurrence_type === 'times_per_week' && !data.times_per_week) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['times_per_week'],
        message: 'times_per_week is required for times_per_week recurrence',
      });
    }
    if (data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'end_date cannot be before start_date',
      });
    }
  });

export type HabitInput = z.infer<typeof habitInputSchema>;

export const checkInInputSchema = z.object({
  habit_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['complete', 'skipped', 'streak_saved']).default('complete'),
  value: z.number().nonnegative().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  completion_mode: z.enum(['primary', 'fallback', 'rescheduled']).default('primary'),
  fallback_for_habit_id: z.string().uuid().optional().nullable(),
});

export type CheckInInput = z.infer<typeof checkInInputSchema>;

export const energyInputSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  level: z.enum(['low', 'steady', 'high']),
  dismissed_suggestions: z.boolean().optional().default(false),
  override_mode: z.enum(['low', 'steady', 'high']).optional().nullable(),
});

export const fallbackInputSchema = z.object({
  fallback_habit_id: z.string().uuid(),
  position: z.number().int().min(0).max(20).optional().default(0),
});

export const recoveryInputSchema = z.object({
  habit_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: z.enum(['resume', 'smaller_version', 'reschedule', 'pause']),
  scheduled_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  reason: z.enum(['not_enough_time', 'too_tired', 'forgot', 'too_difficult', 'not_motivated', 'other']).optional(),
  note: z.string().max(1000).optional().nullable(),
});

export type EnergyInput = z.infer<typeof energyInputSchema>;
export type FallbackInput = z.infer<typeof fallbackInputSchema>;
export type RecoveryInput = z.infer<typeof recoveryInputSchema>;

export const moodLogInputSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  values: z.record(z.string(), z.number()),
  reflection: z.string().max(4000).optional().nullable(),
});

export type MoodLogInput = z.infer<typeof moodLogInputSchema>;

export const importPayloadSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  habits: z.array(z.record(z.string(), z.unknown())).default([]),
  check_ins: z.array(z.record(z.string(), z.unknown())).default([]),
  routines: z.array(z.record(z.string(), z.unknown())).default([]),
  mood_logs: z.array(z.record(z.string(), z.unknown())).default([]),
  labels: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
