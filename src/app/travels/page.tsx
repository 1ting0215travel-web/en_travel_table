import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import TravelsClient from './travels-client';

export default async function TravelsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const codesResult = await query<{
    id: string;
    code_name: string;
    is_open: boolean;
  }>(
    `select id, code_name, is_open
     from travel_codes
     where is_destroyed = false
     ${session.role === 'member' ? 'and is_open = true' : ''}
     order by created_at desc`
  );

  const codes = codesResult.rows as { id: string; code_name: string; is_open: boolean }[];
  const codeIds = codes.map((code) => code.id);

  type EntryRow = {
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
  };

  const entriesResult = codeIds.length
    ? await query<{
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
      }>(
        `select id, travel_code_id, person_name, depart_datetime, depart_location, has_transfer,
                arrival_datetime, arrival_location, hotel_name, lodging_status
         from travel_entries
         where is_destroyed = false and travel_code_id = any($1)
         order by created_at desc`,
        [codeIds]
      )
    : { rows: [] as EntryRow[] };

  const entryRows = entriesResult.rows as EntryRow[];
  const entryIds = entryRows.map((entry) => entry.id);

  const transfersResult = entryIds.length
    ? await query<{
        travel_entry_id: string;
        seq: number;
        transfer_location: string;
        transfer_datetime: string | null;
      }>(
        `select travel_entry_id, seq, transfer_location, transfer_datetime
         from travel_transfers
         where travel_entry_id = any($1)
         order by seq asc`,
        [entryIds]
      )
    : { rows: [] as {
        travel_entry_id: string;
        seq: number;
        transfer_location: string;
        transfer_datetime: string | null;
      }[] };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">航班及住宿列表</h1>
          <p className="mt-1 text-sm text-slate-600">
            新增並查看出發與住宿資料。
          </p>
        </div>
        <Link
          href="/travels/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          新增資料
        </Link>
      </div>

      <TravelsClient
        role={session.role}
        codes={codes}
        entries={entryRows}
        transfers={transfersResult.rows}
      />
    </div>
  );
}
