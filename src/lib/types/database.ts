// Hand-authored typed models matching supabase/migrations/0001_init.sql.
// If you have the Supabase CLI, prefer generating this with:
//   supabase gen types typescript --local > src/lib/types/database.generated.ts

export type HabitKind = 'build' | 'quit';
export type GoalType = 'yes_no' | 'count' | 'duration' | 'numeric';
export type RecurrenceType = 'daily' | 'weekdays' | 'custom_days' | 'times_per_week';
export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type CheckinStatus = 'complete' | 'skipped' | 'streak_saved';
export type CompletionMode = 'primary' | 'fallback' | 'rescheduled';
export type EnergyLevel = 'low' | 'steady' | 'high';
export type FrictionReason = 'not_enough_time' | 'too_tired' | 'forgot' | 'too_difficult' | 'not_motivated' | 'other';
export type RecoveryActionType = 'resume' | 'smaller_version' | 'reschedule' | 'pause';
export type Theme = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_status: string | null;
  timezone: string;
  week_start: number; // 0=Sun..6=Sat
  daily_reset_time: string; // 'HH:MM:SS'
  gamification_enabled: boolean;
  theme: Theme;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  kind: HabitKind;
  goal_type: GoalType;
  goal_target: number | null;
  goal_unit: string | null;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null;
  times_per_week: number | null;
  time_block: TimeBlock;
  start_date: string; // date
  end_date: string | null;
  notes: string | null;
  is_archived: boolean;
  is_paused: boolean;
  streak_saver_credits: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  time_block: TimeBlock;
  is_done: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  habit_id: string;
  entry_date: string; // date
  status: CheckinStatus;
  completion_mode?: CompletionMode;
  fallback_for_habit_id?: string | null;
  value: number | null;
  note: string | null;
  created_at: string;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  time_block: TimeBlock;
  created_at: string;
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  habit_id: string | null;
  task_id: string | null;
  position: number;
}

export interface MoodLog {
  id: string;
  user_id: string;
  entry_date: string;
  values: Record<string, number>;
  reflection: string | null;
  created_at: string;
}

export interface TrackedState {
  id: string;
  user_id: string;
  key: string;
  label: string;
  icon: string;
  scale_min: number;
  scale_max: number;
  is_custom: boolean;
  created_at: string;
}

export interface UserProgress {
  user_id: string;
  xp: number;
  level: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
}

export interface Template {
  id: string;
  category: string;
  name: string;
  description: string | null;
  estimated_minutes: number | null;
  benefits: string[] | null;
  definition: { habits: Partial<Habit>[] };
}

export interface HabitWithRelations extends Habit {
  labels: Label[];
  linked_habit_ids: string[];
}

export interface HabitFallback {
  id: string;
  user_id: string;
  primary_habit_id: string;
  fallback_habit_id: string;
  position: number;
  created_at: string;
}

export interface DailyEnergy {
  id: string;
  user_id: string;
  entry_date: string;
  level: EnergyLevel;
  dismissed_suggestions: boolean;
  override_mode: EnergyLevel | null;
  created_at: string;
  updated_at: string;
}

export interface FrictionEntry {
  id: string;
  user_id: string;
  habit_id: string;
  entry_date: string;
  reason: FrictionReason;
  note: string | null;
  created_at: string;
}

export interface RecoveryAction {
  id: string;
  user_id: string;
  habit_id: string;
  entry_date: string;
  action: RecoveryActionType;
  scheduled_for: string | null;
  created_at: string;
}
