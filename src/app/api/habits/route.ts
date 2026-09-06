import { createClient } from '@/lib/supabase/server';
import { habitInputSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('include_archived') === 'true';

  let query = supabase
    .from('habits')
    .select('*, habit_labels(label_id, labels(*))')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (!includeArchived) query = query.eq('is_archived', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habits: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const parsed = habitInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const { label_ids, ...habitFields } = parsed.data;

  const { data: habit, error } = await supabase
    .from('habits')
    .insert({ ...habitFields, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (label_ids.length > 0) {
    const rows = label_ids.map((label_id) => ({ habit_id: habit.id, label_id }));
    const { error: labelError } = await supabase.from('habit_labels').insert(rows);
    if (labelError) {
      // Habit was created; surface the label failure without rolling back, since the
      // habit itself is valid and RLS on habit_labels already scoped it to this user.
      return NextResponse.json({ habit, warning: `Labels not attached: ${labelError.message}` }, { status: 201 });
    }
  }

  return NextResponse.json({ habit }, { status: 201 });
}
