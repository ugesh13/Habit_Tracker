import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/export?format=json|csv
 * Exports everything the current user owns. RLS guarantees this can never
 * leak another user's rows even if a client sends a manipulated request.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';

  const [{ data: habits }, { data: checkIns }, { data: routines }, { data: moodLogs }, { data: labels }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('check_ins').select('*').eq('user_id', user.id),
    supabase.from('routines').select('*, routine_items(*)').eq('user_id', user.id),
    supabase.from('mood_logs').select('*').eq('user_id', user.id),
    supabase.from('labels').select('*').eq('user_id', user.id),
  ]);

  await supabase.from('data_export_log').insert({ user_id: user.id, format });

  if (format === 'json') {
    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      habits: habits ?? [],
      check_ins: checkIns ?? [],
      routines: routines ?? [],
      mood_logs: moodLogs ?? [],
      labels: labels ?? [],
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rhythm-export-${payload.exported_at.slice(0, 10)}.json"`,
      },
    });
  }

  // CSV: flatten check-ins joined with habit titles - the most useful single-table view for spreadsheets.
  const habitTitleById = new Map((habits ?? []).map((h) => [h.id, h.title]));
  const header = ['entry_date', 'habit_title', 'status', 'value', 'note'];
  const rows = (checkIns ?? []).map((c) =>
    [c.entry_date, csvEscape(habitTitleById.get(c.habit_id) ?? ''), c.status, c.value ?? '', csvEscape(c.note ?? '')].join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="rhythm-checkins-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
