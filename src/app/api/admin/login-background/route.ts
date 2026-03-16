import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const file = formData.get('image');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: '請提供圖片' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '檔案格式不正確' }, { status: 400 });
  }

  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: '圖片大小請小於 1MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  await query('update app_settings set login_background = $1 where id = 1', [dataUrl]);

  return NextResponse.json({ ok: true, image: dataUrl });
}
