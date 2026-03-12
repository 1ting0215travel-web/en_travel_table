import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query<{ ok: number }>('select 1 as ok');
    return NextResponse.json({ ok: true, result: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || 'db_error',
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
      },
      { status: 500 }
    );
  }
}
