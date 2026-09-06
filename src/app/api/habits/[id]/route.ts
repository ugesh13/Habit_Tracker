import { createClient } from '@/lib/supabase/server';
import { habitObjectSchema } from '@/lib/validation/schemas';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  // Partial update: validate only the provided fields against the full schema shape.
  const parsed = habitObjectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const { label_ids, ...habitFields } = parsed.data;

  // RLS also enforces this, but checking explicitly gives a clean 404 vs a silent no-op.
  const { data: existing } = await supabase.from('habits').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: habit, error } = await supabase
    .from('habits')
    .update(habitFields)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (label_ids) {
    await supabase.from('habit_labels').delete().eq('habit_id', params.id);
    if (label_ids.length > 0) {
      await supabase.from('habit_labels').insert(label_ids.map((label_id: string) => ({ habit_id: params.id, label_id })));
    }
  }

  return NextResponse.json({ habit });
}

// Soft delete (archive) by default; pass ?hard=true to permanently delete.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hard = searchParams.get('hard') === 'true';

  if (hard) {
    const { error } = await supabase.from('habits').delete().eq('id', params.id).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  }

  const { data: habit, error } = await supabase
    .from('habits')
    .update({ is_archived: true })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habit });
}
