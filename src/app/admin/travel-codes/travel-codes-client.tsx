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
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TravelCode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function createCode() {
    setError(null);
    setMessage(null);
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
    setMessage(null);
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
    setMessage('代碼已更新');
  }

  async function deleteCode(id: string) {
    setError(null);
    setMessage(null);
    setDeleteLoading(true);
    const response = await fetch('/api/admin/travel-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '刪除失敗');
      setDeleteLoading(false);
      return;
    }

    setCodes(codes.filter((item) => item.id !== id));
    setDeleteLoading(false);
  }

  async function requestDelete(code: TravelCode) {
    setError(null);
    setMessage(null);
    const response = await fetch('/api/admin/travel-codes/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: code.id }),
    });

    if (!response.ok) {
      setError('檢查失敗');
      return;
    }

    const data = await response.json().catch(() => ({}));
    if ((data?.count ?? 0) > 0) {
      setPendingDelete(code);
      return;
    }

    await deleteCode(code.id);
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
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

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
            />
            <button
              type="button"
              onClick={() => updateCode(code, { code_name: code.code_name })}
              className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              修改儲存
            </button>
            <button
              type="button"
              onClick={() => requestDelete(code)}
              className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              刪除
            </button>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">確認刪除</h3>
            <p className="mt-2 text-sm text-slate-600">
              此代碼已有資料，確認是否要刪除？
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                }}
                className="flex-1 rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                disabled={deleteLoading}
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = pendingDelete.id;
                  setPendingDelete(null);
                  await deleteCode(id);
                }}
                className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                disabled={deleteLoading}
              >
                確定要刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
