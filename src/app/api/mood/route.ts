import { createClient } from '@/lib/supabase/server';
import { moodLogInputSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase.from('mood_logs').select('*').eq('user_id', user.id).order('entry_date', { ascending: true });
  if (from) query = query.gte('entry_date', from);
  if (to) query = query.lte('entry_date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ moodLogs: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const parsed = moodLogInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('mood_logs')
    .upsert(
      { user_id: user.id, entry_date: parsed.data.entry_date, values: parsed.data.values, reflection: parsed.data.reflection ?? null },
      { onConflict: 'user_id,entry_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ moodLog: data });
}
