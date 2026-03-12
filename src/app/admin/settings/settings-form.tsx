'use client';

import { useState } from 'react';

export default function SettingsForm() {
  const [memberPassword, setMemberPassword] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_password: memberPassword,
        current_admin_password: currentAdminPassword,
        new_admin_password: newAdminPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '更新失敗');
      return;
    }

    setMessage('設定已更新');
    setMemberPassword('');
    setCurrentAdminPassword('');
    setNewAdminPassword('');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium">一般登錄者共用密碼</label>
        <input
          type="password"
          value={memberPassword}
          onChange={(event) => setMemberPassword(event.target.value)}
          placeholder="不修改可留空"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">管理者目前密碼</label>
          <input
            type="password"
            value={currentAdminPassword}
            onChange={(event) => setCurrentAdminPassword(event.target.value)}
            placeholder="不修改可留空"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">管理者新密碼</label>
          <input
            type="password"
            value={newAdminPassword}
            onChange={(event) => setNewAdminPassword(event.target.value)}
            placeholder="不修改可留空"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        更新設定
      </button>
    </form>
  );
}
