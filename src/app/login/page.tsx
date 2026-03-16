import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import LoginForm from './login-form';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/travels');
  }
  let loginBackground: string | null = null;
  try {
    const adminResult = await query<{ count: string }>(
      'select count(*) from app_users where is_destroyed = false'
    );
    const settingsResult = await query<{ member_login_password_hash: string }>(
      'select member_login_password_hash, login_background from app_settings where id = 1'
    );

    const adminCount = Number(adminResult.rows[0]?.count ?? 0);
    const memberHash = settingsResult.rows[0]?.member_login_password_hash;
    loginBackground = settingsResult.rows[0]?.login_background || null;
    const needsSetup = adminCount === 0 || !memberHash || memberHash === 'CHANGE_ME';

    if (needsSetup) {
      redirect('/setup');
    }
  } catch (error: any) {
    if (error?.digest === 'NEXT_REDIRECT' || error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">資料庫連線失敗</h1>
        <p className="mt-2 text-sm text-slate-600">
          請確認 <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>{' '}
          是否正確，且本機可連到 Supabase。
        </p>
        <p className="mt-3 text-xs text-slate-500">
          {error?.message || 'unknown_error'}
        </p>
      </div>
    );
  }

  const hasBackground = Boolean(loginBackground);
  return (
    <div
      className={`rounded-xl border shadow-sm ${hasBackground ? 'bg-cover bg-center' : 'bg-white'}`}
      style={hasBackground ? { backgroundImage: `url(${loginBackground})` } : undefined}
    >
      <div
        className={
          hasBackground
            ? 'mx-auto max-w-md rounded-xl bg-white/85 p-6 shadow-sm backdrop-blur'
            : 'mx-auto max-w-md p-6'
        }
      >
        <h1 className="text-2xl font-semibold">登入</h1>
        <p className="mt-2 text-sm text-slate-600">
          管理者或一般登錄者登入後即可新增與編輯資料。
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
