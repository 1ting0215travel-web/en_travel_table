import { NextResponse } from next/server;
import { getSession } from @/lib/auth;
import { query } from @/lib/db;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: Forbidden }, { status: 403 });
  }

  const id = String(params.id || ).trim();
  if (!id) {
    return NextResponse.json({ error: Invalid