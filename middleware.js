const TOKEN_NAME = 'mino_token';

const PUBLIC = ['/login.html', '/api/auth', '/fonts/', '/LOGO_MINO_VERT.png'];

async function makeToken(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('mino-auth-v1'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function parseCookies(header) {
  const map = {};
  if (!header) return map;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    map[k.trim()] = v.join('=').trim();
  }
  return map;
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (PUBLIC.some(p => path === p || path.startsWith(p))) {
    return; // laisser passer
  }

  const secret = process.env.MINO_SECRET;
  if (!secret) return; // pas encore configuré → accès libre

  const cookies  = parseCookies(req.headers.get('cookie'));
  const token    = cookies[TOKEN_NAME];
  const expected = await makeToken(secret);

  if (token === expected) return; // authentifié

  const loginUrl = new URL('/login.html', req.url);
  loginUrl.searchParams.set('next', path);
  return Response.redirect(loginUrl.toString(), 302);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
