import { createClient } from '@/lib/supabase/server';
import { fallbackInputSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('habit_fallbacks').select('*, fallback_habit:habits!habit_fallbacks_fallback_habit_id_fkey(*)').eq('primary_habit_id', params.id).eq('user_id', user.id).order('position');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fallbacks: data });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = fallbackInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  const { data: primary } = await supabase.from('habits').select('id').eq('id', params.id).eq('user_id', user.id).single();
  const { data: fallback } = await supabase.from('habits').select('id').eq('id', parsed.data.fallback_habit_id).eq('user_id', user.id).single();
  if (!primary || !fallback) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
  const { data, error } = await supabase.from('habit_fallbacks').upsert({ user_id: user.id, primary_habit_id: params.id, ...parsed.data }, { onConflict: 'primary_habit_id,fallback_habit_id' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fallback: data }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fallbackId = new URL(request.url).searchParams.get('fallback_habit_id');
  if (!fallbackId) return NextResponse.json({ error: 'fallback_habit_id is required' }, { status: 400 });
  const { error } = await supabase.from('habit_fallbacks').delete().eq('user_id', user.id).eq('primary_habit_id', params.id).eq('fallback_habit_id', fallbackId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
