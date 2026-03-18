import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await query('select id, code_name, is_open, is_destroyed from travel_codes where is_destroyed = false order by created_at desc');
  return NextResponse.json({ data: result.rows });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const codeName = String(body?.code_name || '').trim();
  if (!codeName) {
    return NextResponse.json({ error: '代碼名稱不可空白' }, { status: 400 });
  }

  const result = await query(
    'insert into travel_codes (code_name, is_open) values ($1, true) returning id, code_name, is_open, is_destroyed',
    [codeName]
  );

  return NextResponse.json({ data: result.rows[0] });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id || '').trim();
  const codeName = String(body?.code_name || '').trim();
  if (!id || !codeName) {
    return NextResponse.json({ error: '請提供完整資訊' }, { status: 400 });
  }

  const result = await query(
    'update travel_codes set code_name = $1 where id = $2 returning id, code_name, is_open, is_destroyed',
    [codeName, id]
  );

  return NextResponse.json({ data: result.rows[0] });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: '請提供代碼 ID' }, { status: 400 });
  }

  await withTransaction(async (client) => {
    await client.query('delete from travel_entries where travel_code_id = $1', [id]);
    await client.query('delete from travel_codes where id = $1', [id]);
  });
  return NextResponse.json({ ok: true });
}
