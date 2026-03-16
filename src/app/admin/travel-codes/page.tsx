import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import TravelCodesClient from './travel-codes-client';

export default async function TravelCodesPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">權限不足</h1>
        <p className="mt-2 text-sm text-slate-600">此頁面僅管理者可使用。</p>
      </div>
    );
  }

  const result = await query<{
    id: string;
    code_name: string;
    is_open: boolean;
    is_destroyed: boolean;
  }>('select id, code_name, is_open, is_destroyed from travel_codes where is_destroyed = false order by created_at desc');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">旅遊代碼管理</h1>
      <p className="mt-1 text-sm text-slate-600">新增、編輯或刪除旅遊代碼。</p>
      </div>
      <TravelCodesClient initialCodes={result.rows} />
    </div>
  );
}
