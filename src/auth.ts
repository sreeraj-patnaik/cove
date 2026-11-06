export type Session = { token: string; user: { id: string; username: string; displayName: string; admin?: boolean } };

export async function authenticate(mode: 'login' | 'register', input: { username: string; password: string; displayName?: string }): Promise<Session> {
  const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Login needs the Cloudflare runtime. Run npm run build, then npm run dev:cloudflare — not npm run dev.');
  const body = await response.json() as Session & { error?: string };
  if (!response.ok || !body.token) throw new Error(body.error || 'Could not authenticate.');
  sessionStorage.setItem('cove-session', JSON.stringify(body));
  return body;
}

export function savedSession(): Session | null { try { return JSON.parse(sessionStorage.getItem('cove-session') || 'null') as Session | null; } catch { return null; } }
