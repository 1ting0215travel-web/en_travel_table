import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import LoginForm from './login-form';

export default async function LoginPage() {
  const adminResult = await query<{ count: string }>(
    'select count(*) from app_users where is_destroyed = false'
  );
  const settingsResult = await query<{ member_login_password_hash: string }>(
    'select member_login_password_hash from app_settings where id = 1'
  );

  const adminCount = Number(adminResult.rows[0]?.count ?? 0);
  const memberHash = settingsResult.rows[0]?.member_login_password_hash;
  const needsSetup = adminCount === 0 || !memberHash || memberHash === 'CHANGE_ME';

  if (needsSetup) {
    redirect('/setup');
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">登入</h1>
      <p className="mt-2 text-sm text-slate-600">
        管理者或一般登錄者登入後即可新增與編輯資料。
      </p>
      <LoginForm />
    </div>
  );
}
