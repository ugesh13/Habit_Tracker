import { createClient } from '@/lib/supabase/server';
import { importPayloadSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

/**
 * POST /api/import
 * Body: the exact JSON shape produced by GET /api/export?format=json.
 *
 * Conflict handling: habits are matched by (title, start_date) to avoid
 * duplicate re-imports; check-ins are upserted on (habit_id, entry_date) so
 * re-importing the same backup twice is safe (idempotent) rather than
 * creating duplicate rows.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid backup file', issues: parsed.error.flatten() }, { status: 422 });
  }
  const payload = parsed.data;

  const summary = { habits_imported: 0, habits_skipped: 0, check_ins_imported: 0, mood_logs_imported: 0, errors: [] as string[] };

  const { data: existingHabits } = await supabase.from('habits').select('id, title, start_date').eq('user_id', user.id);
  const existingKey = new Set((existingHabits ?? []).map((h) => `${h.title}::${h.start_date}`));

  // Map old habit id (from the backup) -> new/kept habit id, so check-ins can be re-pointed.
  const habitIdMap = new Map<string, string>();

  for (const raw of payload.habits) {
    const title = String(raw.title ?? '').trim();
    const start_date = String(raw.start_date ?? '');
    if (!title || !start_date) {
      summary.errors.push(`Skipped a habit with missing title/start_date`);
      continue;
    }
    const key = `${title}::${start_date}`;
    if (existingKey.has(key)) {
      summary.habits_skipped++;
      const match = existingHabits?.find((h) => h.title === title && h.start_date === start_date);
      if (match && typeof raw.id === 'string') habitIdMap.set(raw.id, match.id);
      continue;
    }

    const oldId = typeof raw.id === 'string' ? raw.id : undefined;
    const rest = { ...(raw as Record<string, unknown>) };
    delete rest.id;
    delete rest.user_id;
    delete rest.created_at;
    delete rest.updated_at;
    const { data: inserted, error } = await supabase
      .from('habits')
      .insert({ ...rest, title, start_date, user_id: user.id })
      .select('id')
      .single();

    if (error) {
      summary.errors.push(`Habit "${title}": ${error.message}`);
      continue;
    }
    summary.habits_imported++;
    if (typeof oldId === 'string') habitIdMap.set(oldId, inserted.id);
  }

  for (const raw of payload.check_ins) {
    const oldHabitId = String(raw.habit_id ?? '');
    const newHabitId = habitIdMap.get(oldHabitId);
    const entry_date = String(raw.entry_date ?? '');
    if (!newHabitId || !entry_date) continue;

    const { error } = await supabase.from('check_ins').upsert(
      {
        user_id: user.id,
        habit_id: newHabitId,
        entry_date,
        status: raw.status ?? 'complete',
        value: raw.value ?? null,
        note: raw.note ?? null,
      },
      { onConflict: 'habit_id,entry_date' }
    );
    if (!error) summary.check_ins_imported++;
  }

  for (const raw of payload.mood_logs) {
    const entry_date = String(raw.entry_date ?? '');
    if (!entry_date) continue;
    const { error } = await supabase.from('mood_logs').upsert(
      { user_id: user.id, entry_date, values: raw.values ?? {}, reflection: raw.reflection ?? null },
      { onConflict: 'user_id,entry_date' }
    );
    if (!error) summary.mood_logs_imported++;
  }

  const status = summary.errors.length === 0 ? 'success' : summary.habits_imported + summary.check_ins_imported > 0 ? 'partial' : 'failed';
  await supabase.from('data_import_log').insert({ user_id: user.id, status, summary });

  return NextResponse.json({ status, summary });
}
