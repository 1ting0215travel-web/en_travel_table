'use client';

import { useState } from 'react';

interface TravelCode {
  id: string;
  code_name: string;
  is_open: boolean;
  is_destroyed: boolean;
}

export default function TravelCodesClient({ initialCodes }: { initialCodes: TravelCode[] }) {
  const [codes, setCodes] = useState<TravelCode[]>(initialCodes);
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function createCode() {
    setError(null);
    const response = await fetch('/api/admin/travel-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code_name: newCode }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '新增失敗');
      return;
    }

    const data = await response.json();
    setCodes([data.data, ...codes]);
    setNewCode('');
  }

  async function updateCode(code: TravelCode, patch: Partial<TravelCode>) {
    setError(null);
    const response = await fetch('/api/admin/travel-codes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: code.id,
        code_name: patch.code_name ?? code.code_name,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '更新失敗');
      return;
    }

    const data = await response.json();
    setCodes(codes.map((item) => (item.id === code.id ? data.data : item)));
  }

  async function deleteCode(id: string) {
    setError(null);
    const response = await fetch('/api/admin/travel-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '刪除失敗');
      return;
    }

    setCodes(codes.filter((item) => item.id !== id));
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={newCode}
          onChange={(event) => setNewCode(event.target.value)}
          placeholder="新增場次代碼"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="button"
          onClick={createCode}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          新增
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {codes.length === 0 && (
          <p className="text-sm text-slate-500">尚未建立代碼。</p>
        )}
        {codes.map((code) => (
          <div key={code.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              value={code.code_name}
              onChange={(event) =>
                setCodes(
                  codes.map((item) =>
                    item.id === code.id ? { ...item, code_name: event.target.value } : item
                  )
                )
              }
              onBlur={(event) => updateCode(code, { code_name: event.target.value })}
            />
            <button
              type="button"
              onClick={() => deleteCode(code.id)}
              className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
