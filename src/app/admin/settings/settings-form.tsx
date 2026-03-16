'use client';

import { useState } from 'react';

export default function SettingsForm({
  initialLoginBackground,
}: {
  initialLoginBackground: string | null;
}) {
  const [memberPassword, setMemberPassword] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    initialLoginBackground
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bgMessage, setBgMessage] = useState<string | null>(null);
  const [bgError, setBgError] = useState<string | null>(null);

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

  async function handleBackgroundSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBgMessage(null);
    setBgError(null);

    if (!backgroundFile) {
      setBgError('請選擇圖片');
      return;
    }

    if (backgroundFile.size > 1024 * 1024) {
      setBgError('圖片大小請小於 1MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', backgroundFile);

    const response = await fetch('/api/admin/login-background', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setBgError(data?.error || '更新失敗');
      return;
    }

    const result = await response.json().catch(() => ({}));
    setBackgroundPreview(result?.image || null);
    setBackgroundFile(null);
    setBgMessage('登入頁底圖已更新');
  }

  return (
    <div className="space-y-8">
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

      <form className="space-y-4 border-t pt-6" onSubmit={handleBackgroundSubmit}>
        <div>
          <p className="text-sm font-semibold text-slate-700">登入頁畫面</p>
          <p className="mt-1 text-xs text-slate-500">
            上傳圖片後會更新登入頁底圖（建議 1MB 以內）。
          </p>
        </div>

        {backgroundPreview && (
          <div className="overflow-hidden rounded-lg border">
            <div className="w-full aspect-[2/1]">
              <img
                src={backgroundPreview}
                alt="登入頁底圖"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <label className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
          選擇圖片
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setBackgroundFile(file);
              if (file) {
                setBackgroundPreview(URL.createObjectURL(file));
              }
            }}
            className="hidden"
          />
        </label>

        {bgError && <p className="text-sm text-red-600">{bgError}</p>}
        {bgMessage && <p className="text-sm text-emerald-600">{bgMessage}</p>}

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          更新登入頁底圖
        </button>
      </form>
    </div>
  );
}
