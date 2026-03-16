import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = String(resolvedParams.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const entryResult = await query<{
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
    return_has_transfer: boolean | null;
    return_transfer_location: string | null;
    return_arrival_datetime: Date | null;
    return_arrival_location: string | null;
  }>(
    `select id, travel_code_id, person_name, depart_datetime, depart_location,
            has_transfer, arrival_datetime, arrival_location, hotel_name, lodging_status,
            return_depart_datetime, return_depart_location, return_has_transfer, return_transfer_location,
            return_arrival_datetime, return_arrival_location
     from travel_entries
     where id = $1 and is_destroyed = false`,
    [id]
  );

  const entry = entryResult.rows[0];
  if (!entry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const transfersResult = await query<{ transfer_location: string }>(
    `select transfer_location
     from travel_transfers
     where travel_entry_id = $1
     order by seq asc
     limit 1`,
    [id]
  );

  return NextResponse.json({
    entry: {
      ...entry,
      depart_datetime: entry.depart_datetime.toISOString(),
      arrival_datetime: entry.arrival_datetime.toISOString(),
      return_depart_datetime: entry.return_depart_datetime
        ? entry.return_depart_datetime.toISOString()
        : null,
      return_arrival_datetime: entry.return_arrival_datetime
        ? entry.return_arrival_datetime.toISOString()
        : null,
      transfers: transfersResult.rows.map((row) => ({
        location: row.transfer_location,
      })),
    },
  });
}
