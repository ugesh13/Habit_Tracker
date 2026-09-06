import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const { data: template, error } = await supabase.from('templates').select('*').eq('id', params.id).single();
  if (error || !template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const definition = template.definition as { habits: Record<string, unknown>[] };
  const today = new Date().toISOString().slice(0, 10);

  const rows = (definition.habits ?? []).map((h) => ({
    ...h,
    user_id: user.id,
    start_date: today,
    color: h.color ?? '#4F6F52',
    icon: h.icon ?? 'sparkle',
  }));

  if (rows.length > 0) {
    await supabase.from('habits').insert(rows);
  }

  return NextResponse.redirect(new URL('/today', request.url));
}
