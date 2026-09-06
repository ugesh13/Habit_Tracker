import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkInInputSchema } from '@/lib/validation/schemas';
import { computeHabitStreak, calculateStreakSaver } from '@/lib/logic/streaks';
import { xpForCheckIn } from '@/lib/logic/xp';
import type { Habit } from '@/lib/types/database';
import { NextResponse } from 'next/server';

/**
 * Creates or replaces a check-in for a habit on a given date, then:
 *  1. recomputes that habit's streak from the full check-in history,
 *  2. awards XP (if gamification is enabled for the user),
 *  3. unlocks streak-milestone achievements the user hasn't already earned.
 *
 * Achievement grants use the admin client deliberately (see migration 0001 comment:
 * user_achievements has no client-side insert policy, so users cannot self-grant).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const parsed = checkInInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('*')
    .eq('id', input.habit_id)
    .eq('user_id', user.id)
    .single<Habit>();

  if (habitError || !habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

  // Handle streak-saver credit accounting before writing the check-in row.
  if (input.status === 'streak_saved') {
    const { allowed, creditsRemaining } = calculateStreakSaver(habit.streak_saver_credits);
    if (!allowed) {
      return NextResponse.json({ error: 'No streak saver credits available' }, { status: 409 });
    }
    await supabase.from('habits').update({ streak_saver_credits: creditsRemaining }).eq('id', habit.id);
    await supabase.from('streak_saver_events').insert({
      user_id: user.id,
      habit_id: habit.id,
      entry_date: input.entry_date,
      credits_before: habit.streak_saver_credits,
      credits_after: creditsRemaining,
    });
  }

  const { data: checkIn, error: upsertError } = await supabase
    .from('check_ins')
    .upsert(
      {
        user_id: user.id,
        habit_id: input.habit_id,
        entry_date: input.entry_date,
        status: input.status,
        completion_mode: input.completion_mode,
        fallback_for_habit_id: input.fallback_for_habit_id ?? null,
        value: input.value ?? null,
        note: input.note ?? null,
      },
      { onConflict: 'habit_id,entry_date' }
    )
    .select()
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  // Recompute streak from full history so current/longest streak and completion rate stay authoritative.
  const { data: allCheckIns } = await supabase.from('check_ins').select('*').eq('habit_id', habit.id);
  const streak = computeHabitStreak({ habit, checkIns: allCheckIns ?? [], asOf: new Date(input.entry_date) });

  // XP + achievements (only if the completed/streak_saved and gamification is on).
  const { data: profile } = await supabase
    .from('profiles')
    .select('gamification_enabled')
    .eq('id', user.id)
    .single();

  let xpAwarded = 0;
  const unlockedAchievements: string[] = [];

  if (profile?.gamification_enabled && input.status !== 'skipped') {
    xpAwarded = xpForCheckIn({ newStreak: streak.currentStreak, isPerfectDay: false });

    const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', user.id).single();
    const newXp = (progress?.xp ?? 0) + xpAwarded;
    await supabase.from('user_progress').upsert({ user_id: user.id, xp: newXp, updated_at: new Date().toISOString() });

    const admin = createAdminClient();
    const milestones: Array<{ key: string; threshold: number }> = [
      { key: 'streak_3', threshold: 3 },
      { key: 'streak_7', threshold: 7 },
      { key: 'streak_30', threshold: 30 },
      { key: 'streak_100', threshold: 100 },
    ];
    const reached = milestones.filter((m) => streak.currentStreak >= m.threshold);
    if (allCheckIns && allCheckIns.length === 1) reached.push({ key: 'first_checkin', threshold: 1 });

    const keys = reached.map((m) => m.key);
    if (keys.length > 0) {
      const { data: achievements } = await admin.from('achievements').select('id, key').in('key', keys);
      if (achievements && achievements.length > 0) {
        const toInsert = achievements.map((a) => ({ user_id: user.id, achievement_id: a.id }));
        const { error: grantError } = await admin
          .from('user_achievements')
          .upsert(toInsert, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
        if (!grantError) unlockedAchievements.push(...achievements.map((a) => a.key));
      }
    }
  }

  return NextResponse.json({ checkIn, streak, xpAwarded, unlockedAchievements });
}
