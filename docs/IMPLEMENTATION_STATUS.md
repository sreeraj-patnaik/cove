# COVE implementation status

**Last updated:** 6 November 2026 (implementation pass 7)  
**Source of truth:** `agent_guide.md`

This file is updated at the end of every implementation pass. Percentages measure the approved product requirements, not merely visible screens.

## Pass log

### Pass 7 — Administrator APIs and frosted visual pass

**Completed**

- Added administrator-only account listing, password reset and account deletion endpoints.
- Configured administrator authority through `ADMIN_USERNAME`, a deployment secret.
- Added a frosted, glass-surface treatment and restored serif display headings over compact sans-serif body text.

**Limitation**

- Administrator actions are API-only until a dedicated audited administration screen is implemented. See `docs/ADMIN.md`.

### Pass 6 — Sender-device queue replay and UX correction

**Completed**

- Added sender-side IndexedDB queue replay after the sender's app reconnects.
- Added recipient decrypt-and-receipt acknowledgement, making `Delivered` truthful for messages received by an online friend.
- Improved the local login error so it explains that authentication requires the Cloudflare Worker runtime rather than Vite alone.
- Replaced the editorial serif treatment with a compact sans-serif hierarchy closer to the supplied mobile reference.

**Important limitation**

- Sender-device persistence cannot deliver a message while the sender device is offline. The sender must reconnect first; then the queued message is relayed to currently-online friends. This is the necessary consequence of no central message database.

### Pass 5 — Small-group usable live messaging

**Completed**

- Connected the authenticated browser client to the deployed room socket.
- Added required shared group-code setup and browser-side AES-GCM encryption before live relay.
- Added server-side session verification before entry to a room, with sender identity pinned to the authenticated socket.
- Added live connection status, truthful offline behavior and PWA icon/install guidance.
- Verified `npm run build`, `npm test` and the Cloudflare deployment plan with Wrangler dry run.

**Known operational limitation**

- This is usable for a small group while participants have the app open. It has no offline message delivery, multi-device key management, authenticated invitations, attachments, read receipts, message edits/deletes, push wake-ups or recovery. Do not treat the shared group code as production-grade end-to-end encryption.

### Pass 4 — Account authentication foundation

**Completed**

- Added username/password registration and sign-in UI with per-user UUIDs and stored browser sessions.
- Added a Cloudflare Durable Object account service with validation, per-account salts and derived password verifiers; plaintext passwords are never persisted.
- Added seven-day signed session tokens and the required `AUTH_SECRET` deployment secret instruction.
- Verified the frontend production build, unit-test command and Worker deployment configuration with Wrangler dry run.

**Not completed / release blocker**

- This is an initial account implementation, not a completed production authentication system. It lacks rate limiting, password reset/recovery, email/phone verification, session revocation, MFA, audit trail, CSRF model, security review and authentication of WebSocket room access.
- The current chat content is still local-only and is not connected to authenticated network transport.

### Pass 3 — Deployment and coordination foundation

**Completed**

- Added production Cloudflare Workers configuration that deploys the Vite build as SPA assets.
- Added an ephemeral Cloudflare Durable Object coordination service for room-scoped WebSocket signalling and presence relay.
- Enforced safe room names, socket upgrade requirements, a 20-peer room cap, small signal envelope limits and restricted signalling message types.
- Added deployment, socket, PWA, notification and remaining-pass guides.
- Verified the production frontend build, unit test command and Wrangler `deploy --dry-run` configuration.

**Not completed**

- The UI is not yet connected to the signalling service, and the service deliberately has no identity or invitation authentication.
- WebRTC, encryption, persistent sync, push delivery and Android remain future passes.

### Pass 2 — Durable local data and iOS-inspired interface

**Completed**

- Added Dexie-backed IndexedDB persistence for chat messages and group preferences, including one-time seed data.
- Added local message reactions and reply drafting.
- Added a Group DNA settings sheet with durable accent colour and read-receipt preferences.
- Redesigned surfaces toward the supplied reference: compact deep-violet composition, glass panels, luminous accent controls, soft background blooms and reduced-motion-safe micro-interactions.
- Added cache-first service-worker handling for the app shell and same-origin fetched assets after a successful first load.

**Not completed**

- IndexedDB schema still covers only the MVP conversation and settings; it does not yet cover identities, groups, events, media, retention or migrations beyond version 1.
- All network, security, server, multi-device and native-platform requirements remain unimplemented.

### Pass 1 — Local-first frontend MVP

**Completed**

- React, TypeScript and Vite application foundation.
- Responsive desktop three-column and mobile bottom-navigation shell.
- COVE design tokens and accessible controls, including reduced-motion support.
- Local browser persistence for the current conversation through `localStorage`.
- Truthful offline message state: locally created messages are labelled `Queued`; no peer delivery is claimed.
- Functional local UI flows for Echo response submission, Afterglow contribution draft, Orbit/privacy messaging, profile presence control and notification feedback.
- Basic installability assets: web manifest and minimal service-worker registration.
- Production build and unit-test command configuration.

**Not completed**

- IndexedDB/Dexie storage, migrations, export/recovery and media blob storage.
- Identity keys, invitations, trusted-device management, authentication and block/friend workflows.
- Group creation, membership, roles, permission enforcement and Group DNA persistence.
- Replies, reactions, edits, deletion events, message search, attachments and voice notes.
- WebRTC DataChannels, signalling, WebSockets, peer authentication, reconnects and delivery acknowledgements.
- Cloudflare Worker, Durable Object, TURN/STUN configuration, notifications, push dispatch and rate limiting.
- Encryption, group keys, rotation, replay protection or secure media handling.
- Distributed sync, encrypted replication, conflict handling and unavailable-replica recovery.
- Echo anonymity protocol and collective multi-device reveal.
- Afterglow trusted-time validation and encrypted multi-device capsule storage.
- Capacitor/Android packaging, APK build, deep links and native permission flows.
- Integration, security, responsive-device and real-network test suites.

## Completion estimate

| Area | Done | Status |
| --- | ---: | --- |
| Frontend product interface | 42% | Responsive visual MVP includes account registration/sign-in, local reactions, reply drafting and group preferences; feature completeness remains. |
| Web application foundation / PWA | 40% | Vite shell, manifest and a cache-first shell service worker exist; installation and offline-device verification remain. |
| Local storage and messaging | 18% | Messages and selected group preferences persist through IndexedDB/Dexie; the full data model remains. |
| Backend / coordination server | 22% | A deployable Worker includes ephemeral signalling and account registration/sign-in; user safety and operational protections remain. |
| Networking / sockets / WebRTC | 28% | Authenticated browser WebSocket live relay works for encrypted small-group messages; WebRTC, resilient delivery and sync remain. |
| Synchronisation / replication | 0% | No peer inventory, transfer or conflict protocol exists. |
| Security / encryption | 0% | No identity, encryption or group-key implementation exists. |
| Signature features | 10% | Local interaction prototypes only; no required privacy, timing, permissions or sync guarantees. |
| Android distribution | 0% | No Capacitor project or APK pipeline exists. |
| Test coverage | 2% | One lightweight state-label test; no feature, integration, security or device tests. |

## How to run locally

1. Install Node.js 20 or newer.
2. In `D:\cove`, run:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the localhost address Vite prints (normally `http://localhost:5173`).

For a production build, run `npm run build`. For the available test suite, run `npm test`.

## Current constraints

- The app intentionally runs without a backend. A message remains `Queued` after sending because no trusted peer connection exists.
- Only the seeded chat persists, and it persists only in the browser profile through `localStorage`.
- The service worker is a shell, not an offline cache strategy; first-load offline behavior is not yet supported.
