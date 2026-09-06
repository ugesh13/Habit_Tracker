import { createClient } from '@/lib/supabase/server';
import { recoveryInputSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  let query = supabase.from('recovery_actions').select('*').eq('user_id', user.id).order('entry_date', { ascending: false });
  if (searchParams.get('from')) query = query.gte('entry_date', searchParams.get('from')!);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recovery: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = recoveryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  const { reason, note, ...action } = parsed.data;
  const { data: habit } = await supabase.from('habits').select('id').eq('id', action.habit_id).eq('user_id', user.id).single();
  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
  const { data: recovery, error } = await supabase.from('recovery_actions').insert({ user_id: user.id, ...action }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (reason) await supabase.from('friction_entries').insert({ user_id: user.id, habit_id: action.habit_id, entry_date: action.entry_date, reason, note: note ?? null });
  if (action.action === 'pause') await supabase.from('habits').update({ is_paused: true }).eq('id', action.habit_id).eq('user_id', user.id);
  return NextResponse.json({ recovery }, { status: 201 });
}
