import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const adminUsername = String(body.adminUsername || '').trim();
  const adminPassword = String(body.adminPassword || '');
  const memberPassword = String(body.memberPassword || '');

  if (!adminUsername || !adminPassword || !memberPassword) {
    return NextResponse.json({ error: '請填寫完整資訊' }, { status: 400 });
  }

  const adminResult = await query<{ count: string }>(
    'select count(*) from app_users where is_destroyed = false'
  );
  const adminCount = Number(adminResult.rows[0]?.count ?? 0);

  const settingsResult = await query<{ member_login_password_hash: string }>(
    'select member_login_password_hash from app_settings where id = 1'
  );
  const memberHash = settingsResult.rows[0]?.member_login_password_hash;
  const needsSetup = adminCount === 0 || !memberHash || memberHash === 'CHANGE_ME';

  if (!needsSetup) {
    return NextResponse.json({ error: '已完成初始化' }, { status: 400 });
  }

  const adminHash = await hashPassword(adminPassword);
  const memberHashNew = await hashPassword(memberPassword);

  try {
    await withTransaction(async (client) => {
      await client.query(
        'insert into app_users (username, password_hash, role) values ($1, $2, $3)',
        [adminUsername, adminHash, 'admin']
      );
      await client.query('update app_settings set member_login_password_hash = $1 where id = 1', [
        memberHashNew,
      ]);
    });
  } catch (error) {
    return NextResponse.json({ error: '初始化失敗' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
