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
}: {
  role: 'admin' | 'member';
  codes: TravelCode[];
  entries: TravelEntry[];
}) {
  const [items, setItems] = useState(entries);
  const [codeFilter, setCodeFilter] = useState('all');
  const [departFilter, setDepartFilter] = useState('');
  const [lodgingFilter, setLodgingFilter] = useState('all');

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

  if (codes.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-slate-600 shadow-sm">
        尚未建立可用的旅遊代碼。請先由管理者建立代碼。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">旅遊代碼</label>
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

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">操作</th>
              <th className="px-3 py-2">旅遊代碼</th>
              <th className="px-3 py-2">姓名</th>
              <th className="px-3 py-2">出發日期</th>
              <th className="px-3 py-2">出發地點</th>
              <th className="px-3 py-2">抵達日期</th>
              <th className="px-3 py-2">抵達地點</th>
              <th className="px-3 py-2">是否轉機</th>
              <th className="px-3 py-2">住宿飯店</th>
              <th className="px-3 py-2">住宿狀態</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={10}>
                  沒有符合條件的資料
                </td>
              </tr>
            ) : (
              filteredItems.map((entry) => {
                const code = codeMap.get(entry.travel_code_id);
                return (
                  <tr key={entry.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/travels/${entry.id}/edit`}
                          className="rounded-md border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          編輯
                        </Link>
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
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{code?.code_name || '未知'}</span>
                        {!code?.is_open && role === 'admin' && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                            關閉
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">{entry.person_name}</td>
                    <td className="px-3 py-2">{formatDate(entry.depart_datetime)}</td>
                    <td className="px-3 py-2">{entry.depart_location}</td>
                    <td className="px-3 py-2">{formatDate(entry.arrival_datetime)}</td>
                    <td className="px-3 py-2">{entry.arrival_location}</td>
                    <td className="px-3 py-2">{entry.has_transfer ? '是' : '否'}</td>
                    <td className="px-3 py-2">{entry.hotel_name || '未填寫'}</td>
                    <td className="px-3 py-2">
                      {lodgingLabels[entry.lodging_status] || entry.lodging_status}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
