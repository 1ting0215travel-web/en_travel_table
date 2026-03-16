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
    return_depart_datetime: string | null;
    return_depart_location: string | null;
    return_arrival_datetime: string | null;
    return_arrival_location: string | null;
  };

  const entriesResult = codeIds.length
    ? await query<{
        id: string;
        travel_code_id: string;
        person_name: string;
        depart_datetime: Date;
        depart_location: string;
        has_transfer: boolean;
        arrival_datetime: Date;
        arrival_location: string;
        hotel_name: string | null;
        lodging_status: string;
        return_depart_datetime: Date | null;
        return_depart_location: string | null;
        return_arrival_datetime: Date | null;
        return_arrival_location: string | null;
      }>(
        `select id, travel_code_id, person_name, depart_datetime, depart_location, has_transfer,
                arrival_datetime, arrival_location, hotel_name, lodging_status,
                return_depart_datetime, return_depart_location, return_arrival_datetime, return_arrival_location
         from travel_entries
         where is_destroyed = false and travel_code_id = any($1)
         order by created_at desc`,
        [codeIds]
      )
    : { rows: [] as EntryRow[] };

  const entryRows = entriesResult.rows.map((entry) => ({
    ...entry,
    depart_datetime: String(entry.depart_datetime),
    arrival_datetime: String(entry.arrival_datetime),
    return_depart_datetime: entry.return_depart_datetime
      ? String(entry.return_depart_datetime)
      : null,
    return_arrival_datetime: entry.return_arrival_datetime
      ? String(entry.return_arrival_datetime)
      : null,
  })) as EntryRow[];
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
      />
    </div>
  );
}
