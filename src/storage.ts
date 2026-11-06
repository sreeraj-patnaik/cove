import Dexie, { type EntityTable } from 'dexie';

export type StoredMessage = { id: number; conversationId: string; from: 'me' | 'them'; text: string; time: string; state?: 'Queued' | 'Relayed' | 'Delivered'; replyTo?: string; reactions?: string[] };
export type StoredSetting = { key: string; value: string };

const db = new Dexie('cove') as Dexie & { messages: EntityTable<StoredMessage, 'id'>; settings: EntityTable<StoredSetting, 'key'> };
db.version(1).stores({ messages: 'id, conversationId, time', settings: 'key' });

export async function loadMessages(conversationId: string) { return db.messages.where('conversationId').equals(conversationId).sortBy('id'); }
export async function saveMessage(message: StoredMessage) { await db.messages.put(message); }
export async function removeDemoData() { await db.messages.where('id').anyOf([1, 2]).delete(); }
export async function setting(key: string, fallback: string) { return (await db.settings.get(key))?.value ?? fallback; }
export async function saveSetting(key: string, value: string) { await db.settings.put({ key, value }); }
