'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

interface TravelCode {
  id: string;
  code_name: string;
  is_open: boolean;
}

interface TravelEntry {
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
}

interface Transfer {
  travel_entry_id: string;
  seq: number;
  transfer_location: string;
  transfer_datetime: string | null;
}

const lodgingLabels: Record<string, string> = {
  already_has_partner: '已有伴',
  needs_partner: '需徵伴',
  no_partner_needed: '不需徵伴',
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function TravelsClient({
  role,
  codes,
  entries,
  transfers,
}: {
  role: 'admin' | 'member';
  codes: TravelCode[];
  entries: TravelEntry[];
  transfers: Transfer[];
}) {
  const [items, setItems] = useState(entries);
  const transferMap = useMemo(() => {
    const map = new Map<string, Transfer[]>();
    for (const transfer of transfers) {
      if (!map.has(transfer.travel_entry_id)) {
        map.set(transfer.travel_entry_id, []);
      }
      map.get(transfer.travel_entry_id)?.push(transfer);
    }
    return map;
  }, [transfers]);

  async function deleteEntry(id: string) {
    const ok = confirm('確定要刪除這筆資料嗎？');
    if (!ok) return;

    const response = await fetch('/api/travels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      alert('刪除失敗');
      return;
    }

    setItems(items.filter((item) => item.id !== id));
  }

  if (codes.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-slate-600 shadow-sm">
        尚未建立可用的旅遊代碼。請先由管理者建立代碼。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {codes.map((code) => {
        const codeEntries = items.filter((entry) => entry.travel_code_id === code.id);

        return (
          <section key={code.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{code.code_name}</h2>
              {!code.is_open && role === 'admin' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  關閉
                </span>
              )}
            </div>

            {codeEntries.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">此代碼尚無資料。</p>
            ) : (
              <div className="mt-4 space-y-3">
                {codeEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">姓名</p>
                        <p className="font-medium">{entry.person_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/travels/${entry.id}/edit`}
                          className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          編輯
                        </Link>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-slate-500">出發航班</p>
                        <p>{formatDate(entry.depart_datetime)}</p>
                        <p className="text-slate-600">{entry.depart_location}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">抵達航班</p>
                        <p>{formatDate(entry.arrival_datetime)}</p>
                        <p className="text-slate-600">{entry.arrival_location}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">住宿飯店</p>
                        <p>{entry.hotel_name || '未填寫'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">住宿狀態</p>
                        <p>{lodgingLabels[entry.lodging_status] || entry.lodging_status}</p>
                      </div>
                    </div>

                    {entry.has_transfer && (
                      <div className="mt-3 text-sm">
                        <p className="text-slate-500">轉機資訊</p>
                        <ul className="mt-1 list-disc pl-5 text-slate-700">
                          {(transferMap.get(entry.id) || []).map((transfer) => (
                            <li key={`${entry.id}-${transfer.seq}`}>
                              {transfer.transfer_location}
                              {transfer.transfer_datetime
                                ? `（${formatDate(transfer.transfer_datetime)}）`
                                : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
