import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import TravelForm from '../travel-form';

export default async function NewTravelPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const codesResult = await query<{
    id: string;
    code_name: string;
  }>(
    `select id, code_name from travel_codes
     where is_destroyed = false
     ${session.role === 'member' ? 'and is_open = true' : ''}
     order by created_at desc`
  );

  if (codesResult.rows.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">目前沒有可用代碼</h1>
        <p className="mt-2 text-sm text-slate-600">請先由管理者建立旅遊代碼。</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">新增旅遊資料</h1>
      <div className="mt-6">
        <TravelForm
          mode="create"
          role={session.role}
          codes={codesResult.rows}
          initialData={
            session.role === 'member'
              ? {
                  travel_code_id: codesResult.rows[0].id,
                  person_name: session.name || '',
                  depart_datetime: '',
                  depart_location: '',
                  has_transfer: false,
                  arrival_datetime: '',
                  arrival_location: '',
                  hotel_name: '',
                  lodging_status: 'needs_partner',
                  return_depart_datetime: '',
                  return_depart_location: '',
                  return_has_transfer: false,
                  return_transfer_location: '',
                  return_arrival_datetime: '',
                  return_arrival_location: '',
                  transfers: [{ location: '' }],
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
