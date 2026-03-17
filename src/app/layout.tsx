import type { Metadata } from 'next';
import { Noto_Sans_TC } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { query } from '@/lib/db';

const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settingsResult = await query<{ site_title: string | null }>(
    'select site_title from app_settings where id = 1'
  );
  const siteTitle = settingsResult.rows[0]?.site_title || '見了還想見-en';

  return (
    <html lang="zh-Hant" className={notoSans.variable}>
      <head>
        <title>{siteTitle}</title>
        <meta name="description" content="旅遊出發與住宿共用資訊" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-[1280px] px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
