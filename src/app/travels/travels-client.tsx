'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TravelForm from './travel-form';

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
  return_depart_datetime: string | null;
  return_depart_location: string | null;
  return_has_transfer?: boolean | null;
  return_transfer_location?: string | null;
  return_arrival_datetime: string | null;
  return_arrival_location: string | null;
}

const lodgingLabels: Record<string, string> = {
  already_has_partner: '已有伴',
  needs_partner: '需徵伴',
  no_partner_needed: '不需徵伴',
};

function formatDate(value: string) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return { datePart, timePart };
}

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export default function TravelsClient({
  role,
  codes,
  entries,
}: {
  role: 'admin' | 'member';
  codes: TravelCode[];
  entries: TravelEntry[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(entries);
  const [codeFilter, setCodeFilter] = useState('all');
  const [departFilter, setDepartFilter] = useState('');
  const [lodgingFilter, setLodgingFilter] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editData, setEditData] = useState<null | {
    id: string;
    travel_code_id: string;
    person_name: string;
    depart_datetime: string;
    depart_location: string;
    has_transfer: boolean;
    arrival_datetime: string;
    arrival_location: string;
    hotel_name: string;
    lodging_status: string;
    return_depart_datetime: string;
    return_depart_location: string;
    return_has_transfer: boolean;
    return_transfer_location: string;
    return_arrival_datetime: string;
    return_arrival_location: string;
    transfers: { location: string }[];
  }>(null);

  useEffect(() => {
    setItems(entries);
  }, [entries]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    openEdit(editId);
    router.replace('/travels');
  }, [searchParams, router]);

  const codeMap = useMemo(() => {
    const map = new Map<string, TravelCode>();
    for (const code of codes) {
      map.set(code.id, code);
    }
    return map;
  }, [codes]);

  const filteredItems = useMemo(() => {
    return items.filter((entry) => {
      if (codeFilter !== 'all' && entry.travel_code_id !== codeFilter) {
        return false;
      }
      if (lodgingFilter !== 'all' && entry.lodging_status !== lodgingFilter) {
        return false;
      }
      if (
        departFilter &&
        !entry.depart_location.toLowerCase().includes(departFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [items, codeFilter, departFilter, lodgingFilter]);

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

  async function openEdit(id: string) {
    setEditOpen(true);
    setEditLoading(true);
    setEditError(null);
    setEditData(null);

    const response = await fetch(`/api/travels/${id}`);
    if (!response.ok) {
      setEditError('載入失敗，請稍後再試');
      setEditLoading(false);
      return;
    }

    const result = await response.json().catch(() => null);
    if (!result?.entry) {
      setEditError('找不到資料');
      setEditLoading(false);
      return;
    }

    const entry = result.entry as TravelEntry & {
      transfers?: { location: string }[];
    };

    setEditData({
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
      return_depart_datetime: toLocalInput(entry.return_depart_datetime || null),
      return_depart_location: entry.return_depart_location || '',
      return_has_transfer: Boolean(entry.return_has_transfer),
      return_transfer_location: entry.return_transfer_location || '',
      return_arrival_datetime: toLocalInput(entry.return_arrival_datetime || null),
      return_arrival_location: entry.return_arrival_location || '',
      transfers: entry.transfers?.length
        ? [{ location: entry.transfers[0].location }]
        : [{ location: '' }],
    });

    setEditLoading(false);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditData(null);
    setEditError(null);
  }

  if (codes.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-slate-600 shadow-sm">
        尚未建立可用的場次代碼。請先由管理者建立代碼。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">場次代碼</label>
            <select
              value={codeFilter}
              onChange={(event) => setCodeFilter(event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">全部</option>
              {codes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.code_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">出發地點</label>
            <input
              value={departFilter}
              onChange={(event) => setDepartFilter(event.target.value)}
              placeholder="輸入出發地點"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">住宿狀態</label>
            <select
              value={lodgingFilter}
              onChange={(event) => setLodgingFilter(event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">全部</option>
              <option value="already_has_partner">已有伴</option>
              <option value="needs_partner">需徵伴</option>
              <option value="no_partner_needed">不需徵伴</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>可左右滑動查看更多欄位。</span>
        <span>筆數：{filteredItems.length}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-end px-3 py-2 text-xs text-slate-500">
          筆數：{filteredItems.length}
        </div>
        <table
          className="min-w-[1200px] table-fixed border-collapse text-sm"
          style={{
            '--col-op': '120px',
            '--col-code': '7em',
            '--col-name': '130px',
            '--col-date': '130px',
            '--col-short': '5em',
          } as React.CSSProperties}
        >
          <colgroup>
            <col style={{ width: 'var(--col-op)' }} />
            <col style={{ width: 'var(--col-code)' }} />
            <col style={{ width: 'var(--col-name)' }} />
            <col style={{ width: 'var(--col-date)' }} />
            <col style={{ width: 'var(--col-short)' }} />
            <col style={{ width: 'var(--col-date)' }} />
            <col style={{ width: 'var(--col-short)' }} />
            <col style={{ width: 'var(--col-short)' }} />
            <col style={{ width: 'var(--col-short)' }} />
            <col style={{ width: 'var(--col-date)' }} />
            <col style={{ width: 'var(--col-short)' }} />
            <col style={{ width: 'var(--col-date)' }} />
            <col style={{ width: 'var(--col-short)' }} />
          </colgroup>
          <thead className="bg-slate-50 text-left text-sm text-slate-500">
            <tr>
              <th className="box-border bg-slate-50 px-3 py-2">
                操作
              </th>
              <th className="box-border bg-slate-50 px-3 py-2 break-keep">
                場次代碼
              </th>
              <th className="box-border bg-slate-50 px-3 py-2 break-keep">
                姓名
              </th>
              <th className="px-3 py-2 whitespace-nowrap">去程出發時間</th>
              <th className="px-3 py-2 break-keep">去程出發地</th>
              <th className="px-3 py-2 whitespace-nowrap">去程抵達時間</th>
              <th className="px-3 py-2 break-keep">去程抵達地</th>
              <th className="px-3 py-2 break-keep">住宿飯店</th>
              <th className="px-3 py-2 break-keep">住宿狀態</th>
              <th className="px-3 py-2 whitespace-nowrap">回程出發時間</th>
              <th className="px-3 py-2 break-keep">回程出發地</th>
              <th className="px-3 py-2 whitespace-nowrap">回程抵達時間</th>
              <th className="px-3 py-2 break-keep">回程抵達地</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={13}>
                  沒有符合條件的資料
                </td>
              </tr>
            ) : (
              filteredItems.map((entry) => {
                const code = codeMap.get(entry.travel_code_id);
                return (
                  <tr key={entry.id} className="border-t">
                    <td className="box-border px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(entry.id)}
                          className="rounded-md border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          編輯
                        </button>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded-md border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="box-border px-3 py-2 break-words">
                      <div className="flex items-center gap-2">
                        <span>{code?.code_name || '未知'}</span>
                        
                      </div>
                    </td>
                    <td className="box-border px-3 py-2 break-words">
                      {entry.person_name}
                    </td>
                <td className="px-3 py-2">
                  {(() => {
                    const { datePart, timePart } = formatDate(entry.depart_datetime);
                    return (
                      <div className="leading-snug">
                        <div>{datePart}</div>
                        <div className="text-slate-500">{timePart}</div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 w-[5em] break-words">{entry.depart_location}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const { datePart, timePart } = formatDate(entry.arrival_datetime);
                    return (
                      <div className="leading-snug">
                        <div>{datePart}</div>
                        <div className="text-slate-500">{timePart}</div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 w-[5em] break-words">{entry.arrival_location}</td>
                <td className="px-3 py-2 w-[5em] break-words">{entry.hotel_name || ''}</td>
                <td className="px-3 py-2 w-[5em] break-words">
                  {lodgingLabels[entry.lodging_status] || entry.lodging_status}
                </td>
                <td className="px-3 py-2">
                  {entry.return_depart_datetime
                    ? (() => {
                        const { datePart, timePart } = formatDate(entry.return_depart_datetime);
                        return (
                          <div className="leading-snug">
                            <div>{datePart}</div>
                            <div className="text-slate-500">{timePart}</div>
                          </div>
                        );
                      })()
                    : ''}
                </td>
                <td className="px-3 py-2 w-[5em] break-words">{entry.return_depart_location || ''}</td>
                <td className="px-3 py-2">
                  {entry.return_arrival_datetime
                    ? (() => {
                        const { datePart, timePart } = formatDate(entry.return_arrival_datetime);
                        return (
                          <div className="leading-snug">
                            <div>{datePart}</div>
                            <div className="text-slate-500">{timePart}</div>
                          </div>
                        );
                      })()
                    : ''}
                </td>
                <td className="px-3 py-2 w-[5em] break-words">{entry.return_arrival_location || ''}</td>
              </tr>
            );
              })
            )}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">編輯旅遊資料</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                關閉
              </button>
            </div>
            <div className="mt-4">
              {editLoading && (
                <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-600">
                  請稍候，資料載入中...
                </div>
              )}
              {editError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  {editError}
                </div>
              )}
              {editData && (
                <TravelForm
                  mode="edit"
                  role={role}
                  codes={codes}
                  initialData={editData}
                  onSuccess={() => {
                    closeEdit();
                    router.refresh();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
