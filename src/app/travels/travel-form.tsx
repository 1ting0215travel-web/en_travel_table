'use client';

import { useEffect, useState } from 'react';
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
  return_depart_datetime: string;
  return_depart_location: string;
  return_has_transfer: boolean;
  return_transfer_location: string;
  return_arrival_datetime: string;
  return_arrival_location: string;
  transfers: Transfer[];
}

export default function TravelForm({
  mode,
  role,
  codes,
  initialData,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  role: 'admin' | 'member';
  codes: TravelCode[];
  initialData?: EntryData;
  onSuccess?: () => void;
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
      return_depart_datetime: '',
      return_depart_location: '',
      return_has_transfer: false,
      return_transfer_location: '',
      return_arrival_datetime: '',
      return_arrival_location: '',
      transfers: [],
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showPicker = (event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget as HTMLInputElement;
    if (typeof (input as any).showPicker === 'function') {
      (input as any).showPicker();
    }
  };

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setData(initialData);
    }
  }, [initialData, mode]);

  function updateField<K extends keyof EntryData>(key: K, value: EntryData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...data,
      transfers: data.has_transfer
        ? data.transfers.filter((item) => item.location.trim()).slice(0, 1)
        : [],
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

    if (onSuccess) {
      onSuccess();
      setLoading(false);
      return;
    }

    router.push('/travels');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-blue-700">去程</p>
        </div>
        <div>
          <label className="text-sm font-medium">場次代碼</label>
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
          <label className="text-sm font-medium">
            姓名 <span className="text-xs text-slate-400">(社群內名字非真名)</span>
          </label>
          <input
            value={data.person_name}
            onChange={(event) => updateField('person_name', event.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">出發時間</label>
          <input
            type="datetime-local"
            value={data.depart_datetime}
            onChange={(event) => updateField('depart_datetime', event.target.value)}
            onClick={showPicker}
            onFocus={showPicker}
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
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.has_transfer}
              onChange={(event) => updateField('has_transfer', event.target.checked)}
            />
            需要轉機
          </label>
        </div>
        <div className="sm:col-span-2">
          {data.has_transfer && (
            <div className="space-y-2">
              <p className="text-sm font-medium">轉機地點</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={data.transfers[0]?.location || ''}
                  placeholder="轉機地點"
                  onChange={(event) =>
                    updateField('transfers', [{ location: event.target.value }])
                  }
                  className="rounded-md border px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">抵達時間</label>
          <input
            type="datetime-local"
            value={data.arrival_datetime}
            onChange={(event) => updateField('arrival_datetime', event.target.value)}
            onClick={showPicker}
            onFocus={showPicker}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-blue-700">回程</p>
        </div>
        <div>
          <label className="text-sm font-medium">出發時間</label>
          <input
            type="datetime-local"
            value={data.return_depart_datetime}
            onChange={(event) => updateField('return_depart_datetime', event.target.value)}
            onClick={showPicker}
            onFocus={showPicker}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            出發地點 <span className="text-xs text-slate-400">(ex.桃園機場)</span>
          </label>
          <input
            value={data.return_depart_location}
            onChange={(event) => updateField('return_depart_location', event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.return_has_transfer}
              onChange={(event) => updateField('return_has_transfer', event.target.checked)}
            />
            需要轉機
          </label>
        </div>
        {data.return_has_transfer && (
          <div className="sm:col-span-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">轉機地點</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={data.return_transfer_location}
                  placeholder="轉機地點"
                  onChange={(event) =>
                    updateField('return_transfer_location', event.target.value)
                  }
                  className="rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">抵達時間</label>
          <input
            type="datetime-local"
            value={data.return_arrival_datetime}
            onChange={(event) => updateField('return_arrival_datetime', event.target.value)}
            onClick={showPicker}
            onFocus={showPicker}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            抵達地點 <span className="text-xs text-slate-400">(ex.桃園機場)</span>
          </label>
          <input
            value={data.return_arrival_location}
            onChange={(event) => updateField('return_arrival_location', event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
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
