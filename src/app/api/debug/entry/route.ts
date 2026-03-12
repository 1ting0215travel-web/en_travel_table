import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ ok: false, message: 'id_required' }, { status: 400 });
  }

  try {
    const result = await query(
      'select id, travel_code_id, is_destroyed from travel_entries where id = $1',
      [id]
    );
    return NextResponse.json({ ok: true, rows: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message, code: error?.code },
      { status: 500 }
    );
  }
}
