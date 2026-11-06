import { useEffect, useRef, useState } from 'react';
import type { Session } from './auth';

type WireMessage = { type: 'message'; from: string; payload: { id: string; cipher: string; iv: string; sentAt: number } } | { type: 'receipt'; from: string; payload: { id: string } };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const bytes = (value: string) => Uint8Array.from(atob(value), character => character.charCodeAt(0));

async function groupKey(passphrase: string) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: encoder.encode('cove/night-owls/v1'), iterations: 210_000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function seal(plain: string, passphrase: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await groupKey(passphrase), encoder.encode(plain)); return { cipher: base64(cipher), iv: base64(iv.buffer) }; }
export async function open(cipher: string, iv: string, passphrase: string) { const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(iv) }, await groupKey(passphrase), bytes(cipher)); return decoder.decode(plain); }

export function useRoom(session: Session, passphrase: string, receive: (message: { id: number; conversationId: string; from: 'them'; text: string; time: string }) => void, delivered: (id: string) => void) {
  const socket = useRef<WebSocket | null>(null); const [status, setStatus] = useState<'offline' | 'connecting' | 'connected'>('offline');
  useEffect(() => { if (!passphrase) { setStatus('offline'); return; } const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'; const url = `${protocol}//${location.host}/api/socket?room=night-owls&token=${encodeURIComponent(session.token)}`; const ws = new WebSocket(url); socket.current = ws; setStatus('connecting'); ws.onopen = () => setStatus('connected'); ws.onclose = () => setStatus('offline'); ws.onerror = () => setStatus('offline'); ws.onmessage = event => { void (async () => { try { const wire = JSON.parse(event.data) as WireMessage; if (wire.type === 'receipt') { delivered(wire.payload.id); return; } if (wire.from === session.user.id) return; const text = await open(wire.payload.cipher, wire.payload.iv, passphrase); receive({ id: Number(wire.payload.id), conversationId: 'night-owls', from: 'them', text, time: new Date(wire.payload.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }); ws.send(JSON.stringify({ type: 'receipt', from: session.user.id, payload: { id: wire.payload.id } })); } catch { /* ciphertext from another group key is intentionally ignored */ } })(); }; return () => { ws.close(); socket.current = null; }; }, [passphrase, session.token, session.user.id, receive, delivered]);
  return { status, send: async (text: string, id: string = crypto.randomUUID()) => { if (socket.current?.readyState !== WebSocket.OPEN) return false; const payload = { id, ...(await seal(text, passphrase)), sentAt: Date.now() }; socket.current.send(JSON.stringify({ type: 'message', from: session.user.id, payload })); return true; } };
}
