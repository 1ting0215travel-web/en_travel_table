import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import TravelForm from '../../travel-form';

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export default async function EditTravelPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const entryResult = await query<{
    id: string;
    travel_code_id: string;
    person_name: string;
    depart_datetime: string;
    depart_location: string;
    has_transfer: boolean;
    arrival_datetime: string;
    arrival_location: string;
    hotel_name: string | null;
    lodging_status: string;
    is_open: boolean;
  }>(
    `select te.id, te.travel_code_id, te.person_name, te.depart_datetime, te.depart_location,
            te.has_transfer, te.arrival_datetime, te.arrival_location, te.hotel_name, te.lodging_status,
            tc.is_open
     from travel_entries te
     join travel_codes tc on tc.id = te.travel_code_id
     where te.id = $1 and te.is_destroyed = false`,
    [params.id]
  );

  const entry = entryResult.rows[0];
  if (!entry) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">找不到資料</h1>
        <p className="mt-2 text-sm text-slate-600">這筆資料可能已被刪除。</p>
      </div>
    );
  }

  if (session.role === 'member' && !entry.is_open) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">代碼已關閉</h1>
        <p className="mt-2 text-sm text-slate-600">此旅遊代碼已關閉，無法編輯。</p>
      </div>
    );
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

  const transfersResult = await query<{
    seq: number;
    transfer_location: string;
    transfer_datetime: string | null;
  }>(
    `select seq, transfer_location, transfer_datetime
     from travel_transfers
     where travel_entry_id = $1
     order by seq asc`,
    [params.id]
  );

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">編輯旅遊資料</h1>
      <div className="mt-6">
        <TravelForm
          mode="edit"
          role={session.role}
          codes={codesResult.rows}
          initialData={{
            id: entry.id,
            travel_code_id: entry.travel_code_id,
            person_name: entry.person_name,
            depart_datetime: toLocalInput(entry.depart_datetime),
            depart_location: entry.depart_location,
            has_transfer: entry.has_transfer,
            arrival_datetime: toLocalInput(entry.arrival_datetime),
            arrival_location: entry.arrival_location,
            hotel_name: entry.hotel_name || '',
            lodging_status: entry.lodging_status,
            transfers: transfersResult.rows.map(
              (transfer: {
                seq: number;
                transfer_location: string;
                transfer_datetime: string | null;
              }) => ({
              location: transfer.transfer_location,
            })
            ),
          }}
        />
      </div>
    </div>
  );
}
