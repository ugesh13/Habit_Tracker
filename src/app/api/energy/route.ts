import { createClient } from '@/lib/supabase/server';
import { energyInputSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === '42P01' || /could not find the table/i.test(error.message ?? ''));
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const date = new URL(request.url).searchParams.get('date');
  let query = supabase.from('daily_energy').select('*').eq('user_id', user.id).order('entry_date', { ascending: false });
  if (date) query = query.eq('entry_date', date);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ energy: [] }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ energy: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = energyInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  const { data, error } = await supabase.from('daily_energy').upsert(
    { user_id: user.id, ...parsed.data },
    { onConflict: 'user_id,entry_date' }
  ).select().single();
  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ energy: null, warning: 'daily_energy table is not yet available in the connected Supabase database.' }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ energy: data });
}
