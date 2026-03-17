import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const memberPassword = String(body.member_password || '').trim();
  const currentAdminPassword = String(body.current_admin_password || '');
  const newAdminPassword = String(body.new_admin_password || '');
  const siteTitle = String(body.site_title || '').trim();

    if (!memberPassword && !newAdminPassword && !siteTitle) {
      return NextResponse.json({ error: '沒有需要更新的欄位' }, { status: 400 });
    }

  try {
    await withTransaction(async (client) => {
      if (memberPassword) {
        const memberHash = await hashPassword(memberPassword);
        await client.query('update app_settings set member_login_password_hash = $1 where id = 1', [
          memberHash,
        ]);
      }

      if (siteTitle) {
        await client.query('update app_settings set site_title = $1 where id = 1', [siteTitle]);
      }

      if (newAdminPassword) {
        if (!currentAdminPassword) {
          throw new Error('需要提供目前密碼');
        }

        const adminResult = await client.query<{ password_hash: string }>(
          'select password_hash from app_users where username = $1 and is_destroyed = false',
          [session.username]
        );
        const admin = adminResult.rows[0];
        if (!admin || !(await verifyPassword(currentAdminPassword, admin.password_hash))) {
          throw new Error('目前密碼錯誤');
        }

        const newHash = await hashPassword(newAdminPassword);
        await client.query('update app_users set password_hash = $1 where username = $2', [
          newHash,
          session.username,
        ]);
      }
    });
  } catch (error: any) {
    const message = error?.message || '更新失敗';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
