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
    if (
      url.pathname.startsWith('/api/auth/') ||
      url.pathname.startsWith('/api/admin/') ||
      url.pathname.startsWith('/api/groups') ||
      url.pathname === '/api/profile' ||
      url.pathname === '/api/password'
    ) {
      return env.AUTH_SERVICE.getByName('accounts').fetch(request);
    }
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

type Account = { id: string; username: string; displayName: string; avatar?: string; salt: string; verifier: string; createdAt: number };
type Group = { id: string; name: string; description?: string; avatar?: string; ownerId: string; inviteCode: string; createdAt: number };
type Credentials = { username?: unknown; password?: unknown; displayName?: unknown };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const encoded = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decoded = (value: string) => { const normalized = value.replaceAll('-', '+').replaceAll('_', '/'); return Uint8Array.from(atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=')), char => char.charCodeAt(0)); };
const reply = (body: unknown, status = 200) => json(body, status);
const validUsername = (value: string) => /^[a-z0-9_]{3,24}$/.test(value);
async function passwordVerifier(password: string, salt: string, secret: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(`${password}:${secret}`), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decoded(salt), iterations: 100_000, hash: 'SHA-256' }, material, 256);
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
    if (url.pathname === '/api/profile' && request.method === 'PATCH') { if (!claims) return reply({ error: 'Authenticated session required.' }, 401); const input = await request.json() as { displayName?: string; avatar?: string }; const displayName = typeof input.displayName === 'string' ? input.displayName.trim().slice(0, 48) : ''; const avatar = typeof input.avatar === 'string' ? input.avatar : undefined; if (!displayName || (avatar && (!avatar.startsWith('data:image/') || avatar.length > 2_000_000))) return reply({ error: 'Use a display name and an image under 1.5 MB.' }, 400); const account = await this.state.storage.get<Account>(`account:${claims.username}`); if (!account) return reply({ error: 'Account not found.' }, 404); await this.state.storage.put(`account:${claims.username}`, { ...account, displayName, ...(avatar ? { avatar } : {}) }); return reply({ user: { id: account.id, username: claims.username, displayName, avatar: avatar || account.avatar, admin } }); }
    if (url.pathname === '/api/password' && request.method === 'POST') { if (!claims) return reply({ error: 'Authenticated session required.' }, 401); const input = await request.json() as { currentPassword?: string; newPassword?: string }; const account = await this.state.storage.get<Account>(`account:${claims.username}`); if (!account || typeof input.currentPassword !== 'string' || typeof input.newPassword !== 'string') return reply({ error: 'Invalid password request.' }, 400); if (input.newPassword.length < 12 || await passwordVerifier(input.currentPassword, account.salt, this.env.AUTH_SECRET) !== account.verifier) return reply({ error: 'Current password is incorrect, or the new password is too short.' }, 400); const salt = encoded(crypto.getRandomValues(new Uint8Array(16)).buffer); await this.state.storage.put(`account:${claims.username}`, { ...account, salt, verifier: await passwordVerifier(input.newPassword, salt, this.env.AUTH_SECRET) }); return reply({ ok: true }); }
    if (url.pathname === '/api/groups') {
      if (!claims) return reply({ error: 'Authenticated session required.' }, 401);
      if (request.method === 'GET') { const memberships = await this.state.storage.list<string>({ prefix: `member:${claims.sub}:` }); const groups = await Promise.all([...memberships.values()].map(id => this.state.storage.get<Group>(`group:${id}`))); return reply({ groups: groups.filter((group): group is Group => Boolean(group)) }); }
      if (request.method === 'POST') { const input = await request.json() as { name?: string; avatar?: string }; const name = typeof input.name === 'string' ? input.name.trim().slice(0, 48) : ''; const avatar = typeof input.avatar === 'string' && input.avatar.startsWith('data:image/') && input.avatar.length <= 180_000 ? input.avatar : undefined; if (!name) return reply({ error: 'A group name is required.' }, 400); const group: Group = { id: crypto.randomUUID(), name, ...(avatar ? { avatar } : {}), ownerId: claims.sub, inviteCode: crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(), createdAt: Date.now() }; await this.state.storage.put(`group:${group.id}`, group); await this.state.storage.put(`invite:${group.inviteCode}`, group.id); await this.state.storage.put(`member:${claims.sub}:${group.id}`, group.id); await this.state.storage.put(`membership:${group.id}:${claims.sub}`, claims.sub); return reply({ group }, 201); }
    }
    if (url.pathname === '/api/groups/join' && request.method === 'POST') { if (!claims) return reply({ error: 'Authenticated session required.' }, 401); const input = await request.json() as { code?: string }; const code = typeof input.code === 'string' ? input.code.trim().toUpperCase() : ''; const id = await this.state.storage.get<string>(`invite:${code}`); const group = id && await this.state.storage.get<Group>(`group:${id}`); if (!group) return reply({ error: 'Invite code not found.' }, 404); await this.state.storage.put(`member:${claims.sub}:${group.id}`, group.id); await this.state.storage.put(`membership:${group.id}:${claims.sub}`, claims.sub); return reply({ group }); }
    if (url.pathname.startsWith('/api/groups/')) { if (!claims) return reply({ error: 'Authenticated session required.' }, 401); const id = url.pathname.split('/').at(-1) || ''; const group = await this.state.storage.get<Group>(`group:${id}`); if (!group) return reply({ error: 'Group not found.' }, 404); const membership = await this.state.storage.get<string>(`membership:${id}:${claims.sub}`); if (!membership) return reply({ error: 'Group membership required.' }, 403); if (request.method === 'GET') { const ids = await this.state.storage.list<string>({ prefix: `membership:${id}:` }); const accounts = await this.state.storage.list<Account>({ prefix: 'account:' }); const members = [...ids.values()].map(userId => [...accounts.values()].find(account => account.id === userId)).filter((member): member is Account => Boolean(member)); return reply({ group, members: members.map(member => ({ id: member.id, displayName: member.displayName, username: member.username, avatar: member.avatar, owner: member.id === group.ownerId })) }); }
      if (request.method === 'PATCH') { if (group.ownerId !== claims.sub) return reply({ error: 'Only the group owner can edit it.' }, 403); const input = await request.json() as { name?: string; description?: string; avatar?: string }; const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0,48) : group.name; const description = typeof input.description === 'string' ? input.description.trim().slice(0,180) : group.description; const avatar = typeof input.avatar === 'string' && input.avatar.startsWith('data:image/') && input.avatar.length <= 180000 ? input.avatar : group.avatar; const next: Group = { ...group, name, description, ...(avatar ? { avatar } : {}) }; await this.state.storage.put(`group:${id}`, next); return reply({ group: next }); }
      if (request.method === 'DELETE') { if (group.ownerId !== claims.sub) return reply({ error: 'Only the group owner can delete it.' }, 403); const members = await this.state.storage.list<string>({ prefix: `membership:${id}:` }); await Promise.all([...members.values()].flatMap(user => [this.state.storage.delete(`member:${user}:${id}`), this.state.storage.delete(`membership:${id}:${user}`)])); await this.state.storage.delete(`group:${id}`); await this.state.storage.delete(`invite:${group.inviteCode}`); return reply({ ok: true }); } }
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
