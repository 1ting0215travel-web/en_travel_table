'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TravelCode {
  id: string;
  code_name: string;
}

interface Transfer {
  location: string;
}

interface EntryData {
  id?: string;
  travel_code_id: string;
  person_name: string;
  depart_datetime: string;
  depart_location: string;
  has_transfer: boolean;
  arrival_datetime: string;
  arrival_location: string;
  hotel_name: string;
  lodging_status: string;
  transfers: Transfer[];
}

export default function TravelForm({
  mode,
  role,
  codes,
  initialData,
}: {
  mode: 'create' | 'edit';
  role: 'admin' | 'member';
  codes: TravelCode[];
  initialData?: EntryData;
}) {
  const router = useRouter();
  const [data, setData] = useState<EntryData>(
    initialData || {
      travel_code_id: codes[0]?.id || '',
      person_name: '',
      depart_datetime: '',
      depart_location: '',
      has_transfer: false,
      arrival_datetime: '',
      arrival_location: '',
      hotel_name: '',
      lodging_status: 'needs_partner',
      transfers: [],
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof EntryData>(key: K, value: EntryData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...data,
      id: initialData?.id,
    };

    const response = await fetch('/api/travels', {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result?.error || '儲存失敗');
      setLoading(false);
      return;
    }

    router.push('/travels');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">旅遊代碼</label>
          <select
            value={data.travel_code_id}
            onChange={(event) => updateField('travel_code_id', event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            {codes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.code_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">姓名</label>
          <input
            value={data.person_name}
            onChange={(event) => updateField('person_name', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">出發日期時間</label>
          <input
            type="datetime-local"
            value={data.depart_datetime}
            onChange={(event) => updateField('depart_datetime', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            出發地點 <span className="text-xs text-slate-400">(ex.桃園機場)</span>
          </label>
          <input
            value={data.depart_location}
            onChange={(event) => updateField('depart_location', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">抵達日期時間</label>
          <input
            type="datetime-local"
            value={data.arrival_datetime}
            onChange={(event) => updateField('arrival_datetime', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            抵達地點 <span className="text-xs text-slate-400">(ex.桃園機場)</span>
          </label>
          <input
            value={data.arrival_location}
            onChange={(event) => updateField('arrival_location', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.has_transfer}
          onChange={(event) => updateField('has_transfer', event.target.checked)}
        />
        需要轉機
      </label>

      {data.has_transfer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">轉機資訊</p>
            <button
              type="button"
              onClick={() =>
                updateField(
                  'transfers',
                  data.transfers.length >= 2
                    ? data.transfers
                    : [...data.transfers, { location: '' }]
                )
              }
              disabled={data.transfers.length >= 2}
              className="rounded-md border px-3 py-1 text-sm"
            >
              新增轉機
            </button>
          </div>
          {data.transfers.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value=""
                placeholder="轉機地點"
                onChange={(event) =>
                  updateField('transfers', [{ location: event.target.value }])
                }
                className="rounded-md border px-3 py-2"
              />
            </div>
          )}
          {data.transfers.map((transfer, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                value={transfer.location}
                placeholder="轉機地點"
                onChange={(event) => {
                  const updated = [...data.transfers];
                  updated[index] = { ...transfer, location: event.target.value };
                  updateField('transfers', updated);
                }}
                className="rounded-md border px-3 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = data.transfers.filter((_, i) => i !== index);
                  updateField('transfers', updated);
                }}
                className="rounded-md border px-3 py-2 text-sm"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">住宿飯店</label>
          <input
            value={data.hotel_name}
            onChange={(event) => updateField('hotel_name', event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">住宿狀態</label>
          <select
            value={data.lodging_status}
            onChange={(event) => updateField('lodging_status', event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="already_has_partner">已有伴</option>
            <option value="needs_partner">需徵伴</option>
            <option value="no_partner_needed">不需徵伴</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">角色：{role === 'admin' ? '管理者' : '一般登錄者'}</p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  );
}
