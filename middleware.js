import { NextResponse } from 'next/server';

const TOKEN_NAME = 'mino_token';

// Paths accessible sans authentification
const PUBLIC = ['/login.html', '/api/auth'];
// Assets publics nécessaires à la page de login
const PUBLIC_ASSETS = ['/fonts/', '/LOGO_MINO_VERT.png'];

async function makeToken(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('mino-auth-v1'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (PUBLIC_ASSETS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const secret = process.env.MINO_SECRET;
  if (!secret) return NextResponse.next(); // pas encore configuré → laisse passer

  const cookie = req.cookies.get(TOKEN_NAME)?.value;
  const expected = await makeToken(secret);

  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL('/login.html', req.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
