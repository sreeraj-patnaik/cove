export interface Env {
  ASSETS: Fetcher;
  SIGNAL_ROOM: DurableObjectNamespace;
  AUTH_SERVICE: DurableObjectNamespace;
  AUTH_SECRET: string;
  ADMIN_USERNAME: string;
}

type Signal = { type: 'offer' | 'answer' | 'candidate' | 'presence' | 'message' | 'receipt'; from: string; to?: string; payload?: unknown };

const roomName = (candidate: string | null) => candidate && /^[a-zA-Z0-9_-]{3,64}$/.test(candidate) ? candidate : null;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, service: 'cove-coordination', persistence: 'none' });
    if (url.pathname.startsWith('/api/auth/')) return env.AUTH_SERVICE.getByName('accounts').fetch(request);
    if (url.pathname === '/api/socket') {
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'WebSocket upgrade required.' }, 426);
      const room = roomName(url.searchParams.get('room'));
      if (!room) return json({ error: 'A room identifier of 3–64 letters, numbers, _ or - is required.' }, 400);
      const verification = await env.AUTH_SERVICE.getByName('accounts').fetch(new Request('https://auth.internal/api/auth/verify', { headers: { authorization: `Bearer ${url.searchParams.get('token') || ''}` } }));
      if (!verification.ok) return json({ error: 'Authenticated session required.' }, 401);
      const user = await verification.json() as { user: { id: string } };
      const headers = new Headers(request.headers); headers.set('x-cove-user', user.user.id);
      return env.SIGNAL_ROOM.getByName(room).fetch(new Request(request, { headers }));
    }
    return env.ASSETS.fetch(request);
  }
};

export class SignalRoom {
  constructor(private readonly state: DurableObjectState) {}

  fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket upgrade required.', { status: 426 });
    if (this.state.getWebSockets().length >= 20) return new Response('Room capacity reached.', { status: 503 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ userId: request.headers.get('x-cove-user') || '' });
    server.send(JSON.stringify({ type: 'ready', persistence: 'none', message: 'Signalling and ephemeral presence only.' }));
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== 'string' || message.length > 16_384) return socket.close(1009, 'Invalid signal size');
    let signal: Signal;
    try { signal = JSON.parse(message) as Signal; } catch { return socket.send(JSON.stringify({ type: 'error', error: 'Invalid JSON.' })); }
    const attachment = socket.deserializeAttachment() as { userId?: string } | null;
    if (!['offer', 'answer', 'candidate', 'presence', 'message', 'receipt'].includes(signal.type) || signal.from !== attachment?.userId) return socket.send(JSON.stringify({ type: 'error', error: 'Invalid signal shape.' }));
    const envelope = JSON.stringify({ ...signal, at: Date.now() });
    for (const peer of this.state.getWebSockets()) if (peer !== socket) peer.send(envelope);
  }

  webSocketClose(_socket: WebSocket, _code: number, _reason: string): void {
  // The socket is already closed. Do not call close() again.
}
  webSocketError(socket: WebSocket): void { socket.close(1011, 'Socket error'); }
}

type Account = { id: string; username: string; displayName: string; salt: string; verifier: string; createdAt: number };
type Credentials = { username?: unknown; password?: unknown; displayName?: unknown };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const encoded = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decoded = (value: string) => { const normalized = value.replaceAll('-', '+').replaceAll('_', '/'); return Uint8Array.from(atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=')), char => char.charCodeAt(0)); };
const reply = (body: unknown, status = 200) => json(body, status);
const validUsername = (value: string) => /^[a-z0-9_]{3,24}$/.test(value);
async function passwordVerifier(password: string, salt: string, secret: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(`${password}:${secret}`), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decoded(salt), iterations: 310_000, hash: 'SHA-256' }, material, 256);
  return encoded(bits);
}
async function signedSession(account: Account, secret: string): Promise<string> {
  const payload = encoded(encoder.encode(JSON.stringify({ sub: account.id, username: account.username, displayName: account.displayName, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${payload}.${encoded(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))}`;
}
async function verifiedSession(token: string, secret: string): Promise<{ sub: string; username: string; displayName: string } | null> {
  const [payload, signature] = token.split('.'); if (!payload || !signature) return null;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('HMAC', key, decoded(signature), encoder.encode(payload))) return null;
  try { const decodedPayload = JSON.parse(decoder.decode(decoded(payload))) as { sub: string; username: string; displayName: string; exp: number }; return decodedPayload.exp > Math.floor(Date.now() / 1000) ? decodedPayload : null; } catch { return null; }
}

export class AuthService {
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const claims = await verifiedSession(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '', this.env.AUTH_SECRET);
    const admin = claims?.username === this.env.ADMIN_USERNAME;
    if (url.pathname === '/api/auth/verify') return claims ? reply({ user: { id: claims.sub, username: claims.username, displayName: claims.displayName, admin } }) : reply({ error: 'Invalid session.' }, 401);
    if (url.pathname === '/api/admin/users') { if (!admin) return reply({ error: 'Administrator access required.' }, 403); const records = await this.state.storage.list<Account>({ prefix: 'account:' }); return reply({ users: [...records.values()].map(account => ({ id: account.id, username: account.username, displayName: account.displayName, createdAt: account.createdAt })) }); }
    if (url.pathname === '/api/admin/reset-password' || url.pathname === '/api/admin/delete-user') {
      if (!admin || request.method !== 'POST') return reply({ error: 'Administrator access required.' }, 403);
      const input = await request.json() as { username?: string; password?: string }; const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
      if (!validUsername(username) || username === this.env.ADMIN_USERNAME) return reply({ error: 'Invalid target account.' }, 400);
      const key = `account:${username}`; const account = await this.state.storage.get<Account>(key); if (!account) return reply({ error: 'Account not found.' }, 404);
      if (url.pathname.endsWith('delete-user')) { await this.state.storage.delete(key); return reply({ ok: true }); }
      if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) return reply({ error: 'New passwords require at least 12 characters.' }, 400);
      const salt = encoded(crypto.getRandomValues(new Uint8Array(16)).buffer); await this.state.storage.put(key, { ...account, salt, verifier: await passwordVerifier(input.password, salt, this.env.AUTH_SECRET) }); return reply({ ok: true });
    }
    if (request.method !== 'POST' || !['/api/auth/register', '/api/auth/login'].includes(url.pathname)) return reply({ error: 'Not found.' }, 404);
    let input: Credentials;
    try { input = await request.json() as Credentials; } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (!validUsername(username) || password.length < 12 || password.length > 128) return reply({ error: 'Use a 3–24 character lowercase username and a password of at least 12 characters.' }, 400);
    const key = `account:${username}`;
    const existing = await this.state.storage.get<Account>(key);
    if (url.pathname.endsWith('/register')) {
      if (existing) return reply({ error: 'Username is already in use.' }, 409);
      const displayName = typeof input.displayName === 'string' ? input.displayName.trim().slice(0, 48) : '';
      if (!displayName) return reply({ error: 'A display name is required.' }, 400);
      const salt = encoded(crypto.getRandomValues(new Uint8Array(16)).buffer);
      const account: Account = { id: crypto.randomUUID(), username, displayName, salt, verifier: await passwordVerifier(password, salt, this.env.AUTH_SECRET), createdAt: Date.now() };
      await this.state.storage.put(key, account);
      return reply({ user: { id: account.id, username, displayName, admin: username === this.env.ADMIN_USERNAME }, token: await signedSession(account, this.env.AUTH_SECRET) }, 201);
    }
    if (!existing) return reply({ error: 'Incorrect username or password.' }, 401);
    const supplied = await passwordVerifier(password, existing.salt, this.env.AUTH_SECRET);
    if (supplied !== existing.verifier) return reply({ error: 'Incorrect username or password.' }, 401);
    return reply({ user: { id: existing.id, username, displayName: existing.displayName, admin: username === this.env.ADMIN_USERNAME }, token: await signedSession(existing, this.env.AUTH_SECRET) });
  }
}
