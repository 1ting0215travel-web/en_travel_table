import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import SettingsForm from './settings-form';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">權限不足</h1>
        <p className="mt-2 text-sm text-slate-600">此頁面僅管理者可使用。</p>
      </div>
    );
  }

  const settingsResult = await query<{ login_background: string | null }>(
    'select login_background from app_settings where id = 1'
  );

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">帳號與密碼設定</h1>
      <p className="mt-2 text-sm text-slate-600">更新一般登錄者共用密碼或管理者密碼。</p>
      <div className="mt-6">
        <SettingsForm initialLoginBackground={settingsResult.rows[0]?.login_background || null} />
      </div>
    </div>
  );
}
