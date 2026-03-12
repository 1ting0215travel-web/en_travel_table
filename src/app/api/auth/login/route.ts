import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const role = body.role === 'admin' ? 'admin' : 'member';
  const password = String(body.password || '');

  if (!password) {
    return NextResponse.json({ error: '密碼不可空白' }, { status: 400 });
  }

  if (role === 'admin') {
    const username = String(body.username || '').trim();
    if (!username) {
      return NextResponse.json({ error: '請輸入帳號' }, { status: 400 });
    }

    const result = await query<{
      password_hash: string;
      username: string;
    }>('select username, password_hash from app_users where username = $1 and is_destroyed = false', [
      username,
    ]);

    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    await createSession({ role: 'admin', username: user.username });
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: '請輸入姓名' }, { status: 400 });
  }

  const settings = await query<{ member_login_password_hash: string }>(
    'select member_login_password_hash from app_settings where id = 1'
  );
  const hash = settings.rows[0]?.member_login_password_hash;
  if (!hash || !(await verifyPassword(password, hash))) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
  }

  await createSession({ role: 'member', name });
  return NextResponse.json({ ok: true });
}
