import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';

async function requireSession() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

function normalizeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const travelCodeId = String(body.travel_code_id || '').trim();
  const personName = String(body.person_name || '').trim();
  const departDatetime = normalizeDate(body.depart_datetime);
  const departLocation = String(body.depart_location || '').trim();
  const hasTransfer = Boolean(body.has_transfer);
  const arrivalDatetime = normalizeDate(body.arrival_datetime);
  const arrivalLocation = String(body.arrival_location || '').trim();
  const hotelName = String(body.hotel_name || '').trim() || null;
  const lodgingStatus = String(body.lodging_status || '').trim();
  const transfers = Array.isArray(body.transfers) ? body.transfers.slice(0, 2) : [];

  if (!travelCodeId || !personName || !departDatetime || !departLocation || !arrivalDatetime || !arrivalLocation || !lodgingStatus) {
    return NextResponse.json({ error: '請填寫完整資訊' }, { status: 400 });
  }

  if (!['already_has_partner', 'needs_partner', 'no_partner_needed'].includes(lodgingStatus)) {
    return NextResponse.json({ error: '住宿狀態不正確' }, { status: 400 });
  }

  if (session.role === 'member') {
    const codeResult = await query<{ is_open: boolean }>(
      'select is_open from travel_codes where id = $1 and is_destroyed = false',
      [travelCodeId]
    );
    if (!codeResult.rows[0]?.is_open) {
      return NextResponse.json({ error: '此旅遊代碼已關閉' }, { status: 403 });
    }
  }

  const entry = await withTransaction(async (client) => {
    const result = await client.query(
      `insert into travel_entries
        (travel_code_id, person_name, depart_datetime, depart_location, has_transfer, arrival_datetime, arrival_location, hotel_name, lodging_status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [
        travelCodeId,
        personName,
        departDatetime,
        departLocation,
        hasTransfer,
        arrivalDatetime,
        arrivalLocation,
        hotelName,
        lodgingStatus,
      ]
    );

    const entryId = result.rows[0].id as string;
    if (hasTransfer && transfers.length > 0) {
      for (let i = 0; i < transfers.length; i += 1) {
        const transfer = transfers[i];
        const location = String(transfer.location || '').trim();
        if (!location) continue;
        const transferDatetime = transfer.datetime ? normalizeDate(transfer.datetime) : null;
        await client.query(
          'insert into travel_transfers (travel_entry_id, seq, transfer_location, transfer_datetime) values ($1, $2, $3, $4)',
          [entryId, i + 1, location, transferDatetime]
        );
      }
    }

    return entryId;
  });

  return NextResponse.json({ id: entry });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const id = String(body.id || '').trim();
  const travelCodeId = String(body.travel_code_id || '').trim();
  const personName = String(body.person_name || '').trim();
  const departDatetime = normalizeDate(body.depart_datetime);
  const departLocation = String(body.depart_location || '').trim();
  const hasTransfer = Boolean(body.has_transfer);
  const arrivalDatetime = normalizeDate(body.arrival_datetime);
  const arrivalLocation = String(body.arrival_location || '').trim();
  const hotelName = String(body.hotel_name || '').trim() || null;
  const lodgingStatus = String(body.lodging_status || '').trim();
  const transfers = Array.isArray(body.transfers) ? body.transfers.slice(0, 2) : [];

  if (!id || !travelCodeId || !personName || !departDatetime || !departLocation || !arrivalDatetime || !arrivalLocation || !lodgingStatus) {
    return NextResponse.json({ error: '請填寫完整資訊' }, { status: 400 });
  }

  if (!['already_has_partner', 'needs_partner', 'no_partner_needed'].includes(lodgingStatus)) {
    return NextResponse.json({ error: '住宿狀態不正確' }, { status: 400 });
  }

  if (session.role === 'member') {
    const codeResult = await query<{ is_open: boolean }>(
      'select is_open from travel_codes where id = $1 and is_destroyed = false',
      [travelCodeId]
    );
    if (!codeResult.rows[0]?.is_open) {
      return NextResponse.json({ error: '此旅遊代碼已關閉' }, { status: 403 });
    }
  }

  await withTransaction(async (client) => {
    await client.query(
      `update travel_entries
       set travel_code_id = $1,
           person_name = $2,
           depart_datetime = $3,
           depart_location = $4,
           has_transfer = $5,
           arrival_datetime = $6,
           arrival_location = $7,
           hotel_name = $8,
           lodging_status = $9
       where id = $10`,
      [
        travelCodeId,
        personName,
        departDatetime,
        departLocation,
        hasTransfer,
        arrivalDatetime,
        arrivalLocation,
        hotelName,
        lodgingStatus,
        id,
      ]
    );

    await client.query('delete from travel_transfers where travel_entry_id = $1', [id]);

    if (hasTransfer && transfers.length > 0) {
      for (let i = 0; i < transfers.length; i += 1) {
        const transfer = transfers[i];
        const location = String(transfer.location || '').trim();
        if (!location) continue;
        const transferDatetime = transfer.datetime ? normalizeDate(transfer.datetime) : null;
        await client.query(
          'insert into travel_transfers (travel_entry_id, seq, transfer_location, transfer_datetime) values ($1, $2, $3, $4)',
          [id, i + 1, location, transferDatetime]
        );
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: '請提供 ID' }, { status: 400 });
  }

  await query('update travel_entries set is_destroyed = true where id = $1', [id]);
  return NextResponse.json({ ok: true });
}
