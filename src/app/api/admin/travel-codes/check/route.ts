import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: '請提供代碼 ID' }, { status: 400 });
  }

  const result = await query<{ count: string }>(
    'select count(*) from travel_entries where travel_code_id = $1 and is_destroyed = false',
    [id]
  );

  return NextResponse.json({ count: Number(result.rows[0]?.count ?? 0) });
}
