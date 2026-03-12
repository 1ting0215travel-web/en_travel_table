'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      role,
      username: String(formData.get('username') || ''),
      password: String(formData.get('password') || ''),
    };

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error || '登入失敗');
      setLoading(false);
      return;
    }

    window.location.assign('/travels');
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRole('member')}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            role === 'member' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white'
          }`}
        >
          一般登錄者
        </button>
        <button
          type="button"
          onClick={() => setRole('admin')}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            role === 'admin' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white'
          }`}
        >
          管理者
        </button>
      </div>

      {role === 'admin' ? (
        <div>
          <label className="text-sm font-medium">管理者帳號</label>
          <input
            name="username"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium">密碼</label>
        <input
          type="password"
          name="password"
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
        {loading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}
