'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      adminUsername: String(formData.get('adminUsername') || ''),
      adminPassword: String(formData.get('adminPassword') || ''),
      memberPassword: String(formData.get('memberPassword') || ''),
    };

    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '初始化失敗，請再試一次。');
      setLoading(false);
      return;
    }

    router.push('/login');
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium">管理者帳號</label>
        <input
          name="adminUsername"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">管理者密碼</label>
        <input
          type="password"
          name="adminPassword"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">一般登入者共用密碼</label>
        <input
          type="password"
          name="memberPassword"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? '設定中...' : '完成初始化'}
      </button>
    </form>
  );
}
