import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = process.env.AUTH_SECRET;
const key = secret ? new TextEncoder().encode(secret) : null;
const cookieName = 'travel_auth';

export type SessionRole = 'admin' | 'member';

export interface SessionPayload {
  role: SessionRole;
  username?: string;
  name?: string;
}

export async function createSession(payload: SessionPayload) {
  if (!key) {
    throw new Error('AUTH_SECRET is not set');
  }
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);

  cookies().set({
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSession() {
  if (!key) return;
  cookies().set({
    name: cookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getSession() {
  if (!key) return null;
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
