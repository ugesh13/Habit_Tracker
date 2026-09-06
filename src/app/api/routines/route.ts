import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const routineInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  time_block: z.enum(['morning', 'afternoon', 'evening', 'anytime']).default('anytime'),
  items: z
    .array(
      z.object({
        habit_id: z.string().uuid().optional().nullable(),
        task_id: z.string().uuid().optional().nullable(),
        position: z.number().int().min(0),
      })
    )
    .default([]),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_items(*, habits(id, title, color, icon), tasks(id, title))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ routines: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = routineInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }
  const { items, ...routineFields } = parsed.data;

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ ...routineFields, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items.length > 0) {
    const rows = items.map((item) => ({ ...item, routine_id: routine.id }));
    const { error: itemsError } = await supabase.from('routine_items').insert(rows);
    if (itemsError) return NextResponse.json({ routine, warning: itemsError.message }, { status: 201 });
  }

  return NextResponse.json({ routine }, { status: 201 });
}
