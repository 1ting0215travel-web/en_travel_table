import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function Header() {
  const session = await getSession();
  const settingsResult = await query<{ site_title: string | null }>(
    'select site_title from app_settings where id = 1'
  );
  const title = settingsResult.rows[0]?.site_title || '見了還想見-en';

  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
        <Link href="/travels" className="text-lg font-semibold text-slate-900">
          {title}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/travels" className="hover:text-slate-900">
            航班及住宿列表
          </Link>
          {session?.role === 'admin' && (
            <>
              <Link href="/admin/travel-codes" className="hover:text-slate-900">
                場次代碼
              </Link>
              <Link href="/admin/settings" className="hover:text-slate-900">
                帳號設定
              </Link>
            </>
          )}
          {session ? (
            <form action="/api/auth/logout" method="post">
              <button className="rounded-md border px-3 py-1 text-slate-700 hover:bg-slate-50">
                登出
              </button>
            </form>
          ) : (
            <Link href="/login" className="hover:text-slate-900">
              登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
