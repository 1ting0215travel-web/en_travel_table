import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = process.env.AUTH_SECRET;
const key = secret ? new TextEncoder().encode(secret) : null;

const publicPaths = ['/login', '/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const editMatch = pathname.match(/^\/travels\/([^/]+)\/edit$/);
  if (editMatch) {
    const url = request.nextUrl.clone();
    url.pathname = '/travels';
    url.searchParams.set('edit', editMatch[1]);
    return NextResponse.redirect(url);
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!key) {
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  const token = request.cookies.get('travel_auth')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
