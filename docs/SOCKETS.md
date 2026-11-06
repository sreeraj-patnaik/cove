# Sockets and signalling guide

## Current service

`GET /api/socket?room=<safe-room-id>` upgrades to a WebSocket and routes to the matching Cloudflare Durable Object. A room is capped at 20 sockets. The object uses hibernatable WebSockets and relays only these validated envelope types:

- `offer`
- `answer`
- `candidate`
- `presence`

The service holds no message history, message payload database, or durable presence record. It only relays connection-negotiation, encrypted live-message envelopes and ephemeral presence data to currently connected peers. A valid account session is now required before a socket enters a room.

## Usable friends-group messaging

When friends sign in and configure the same group code, the browser derives an AES-GCM key through Web Crypto and encrypts message plaintext before sending it through the authenticated room socket. The relay sees only ciphertext. The receiving browser decrypts and saves the message locally.

This is suitable for the initial small group only. A message created while the sender is offline remains queued in that sender's IndexedDB and is replayed automatically when the sender next reconnects. It can then reach any friends currently online, who return a delivery acknowledgement after decryption. If both sender and recipient are offline, no device can deliver the message; central storage would be required for that, and COVE deliberately does not use one. The shared-code approach is not a substitute for per-device keys, invitation verification or group-key rotation.

## Client contract (future pass)

The browser adapter must connect only after authenticated invitation and device verification. It may send a JSON envelope with `type`, `from`, optional `to`, and `payload`. The payload must be a WebRTC SDP/ICE item or minimal presence state; never plaintext COVE message content.

The present worker is intentionally unauthenticated. Do not expose it for public use until the identity/invitation pass adds signed room claims, origin checks, rate limits, recipient routing, and abuse handling. WebRTC DataChannels—not the Worker socket—will carry encrypted application envelopes.

## Local development

Run `npm run dev:cloudflare` after building once. Use `npm run dev` independently for Vite UI work. Durable Object hibernation behavior is only fully representative on Cloudflare.
