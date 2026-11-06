import type { Session } from './auth';
export type Group = { id: string; name: string; avatar?: string; ownerId: string; inviteCode: string; createdAt: number };
async function request<T>(session: Session, path: string, init?: RequestInit): Promise<T> { const response = await fetch(path, { ...init, headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json', ...init?.headers } }); const raw = await response.text(); let body: T & { error?: string }; try { body = JSON.parse(raw) as T & { error?: string }; } catch { throw new Error('The server did not return a valid response. Restart the Cloudflare runtime or redeploy the Worker.'); } if (!response.ok) throw new Error(body.error || 'Request failed.'); return body; }
export const listGroups = (session: Session) => request<{ groups: Group[] }>(session, '/api/groups');
export const createGroup = (session: Session, name: string) => request<{ group: Group }>(session, '/api/groups', { method: 'POST', body: JSON.stringify({ name }) });
export const joinGroup = (session: Session, code: string) => request<{ group: Group }>(session, '/api/groups/join', { method: 'POST', body: JSON.stringify({ code }) });
export const deleteGroup = (session: Session, id: string) => request<{ ok: true }>(session, `/api/groups/${id}`, { method: 'DELETE' });
export const groupDetails = (session: Session, id: string) => request<{ group: Group; members: Array<{ id: string; displayName: string; username: string; avatar?: string; owner: boolean }> }>(session, `/api/groups/${id}`);
