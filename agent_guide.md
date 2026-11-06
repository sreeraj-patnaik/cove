# COVE
## Product Requirements Document & AI Agent Development Guide

**Version:** 1.0  
**Status:** Approved baseline for implementation  
**Date:** 6 November 2026  
**Product:** Private, local-first, distributed messaging application  
**Brand line:** *A little closer.*

> **Product principle:** A private world shared between friends. COVE is a small, invitation-based communication space where groups shape their own identity and conversations remain locally owned and synchronised across trusted devices.

---

cove

A little closer.

PRODUCT REQUIREMENTS DOCUMENT
&
AI AGENT DEVELOPMENT GUIDE

Version 1.0  |  Approved baseline  |  6 November 2026

> PRODUCT PRINCIPLE
> A private world shared between friends. COVE is a small, invitation-based communication space where groups shape their own identity and conversations remain locally owned and synchronised across trusted devices.

Prepared as the source of truth for product design, implementation and AI-assisted development.

# Document control

| Field | Value |
| --- | --- |
| Product | COVE |
| Document | Product Requirements Document and AI Agent Development Guide |
| Version | 1.0 |
| Status | Approved baseline for implementation |
| Initial audience | Private friend network, approximately 5–20 people |
| Platforms | Responsive web, installable PWA, Android application |
| Frontend | React + TypeScript + Vite |
| Hosting target | Cloudflare Free plan, subject to current quotas and terms |
| Architecture | Hybrid peer-to-peer, local-first, encrypted replication |
| Primary signature features | Echo, Afterglow and Orbit |

## How to use this document

Part I defines the product and its user-facing requirements. Part II defines the technical architecture. Part III is the operating guide for an AI coding agent. Part IV defines the staged implementation and acceptance criteria.

This document is the approved baseline. The agent may refine implementation details, but must not silently change product scope, introduce central message persistence, or replace the selected technology stack.

# Contents

PART I — Product Requirements

1. Product vision and objectives

2. Scope and users

3. Core messaging and group functionality

4. Group DNA customisation

5. Signature experiences: Echo, Afterglow and Orbit

6. Notifications and presence

7. Visual identity and UX requirements

8. Platform requirements

PART II — Technical Architecture

9. Architecture principles

10. Approved technology stack

11. Local data and storage model

12. Peer networking and signalling

13. Synchronisation and replication

14. Security and privacy

15. Hosting and deployment

16. Android and PWA distribution

17. Reliability, performance and accessibility

PART III — AI Agent Development Guide

18. Agent role and non-negotiable rules

19. Repository structure

20. Module responsibilities

21. Agent workflow and change discipline

22. Testing and reporting

PART IV — Delivery

23. Phased roadmap

24. Acceptance criteria

25. Out-of-scope items

26. Final engineering directives

# PART I — PRODUCT REQUIREMENTS

## 1. Product vision and objectives

COVE is a private, personalised messaging environment for small, trusted groups of friends. It combines everyday messaging, group-level customisation, local-first data ownership and a small set of distinctive shared experiences.

> POSITIONING
> COVE is not another public social network. It is a private place for a small circle to communicate, coordinate and preserve shared moments.

### 1.1 Product objectives

- Provide dependable one-to-one and group messaging.
- Avoid centralised persistent storage of message content and private media.
- Store conversation data locally on participating devices and replicate encrypted records to trusted peers where possible.
- Let each group configure its identity, permissions, privacy and experience.
- Deliver three signature experiences: Echo, Afterglow and Orbit.
- Provide a polished, intentional interface across desktop and mobile.
- Support an installable PWA and a downloadable Android application from a shared frontend codebase.
- Keep infrastructure simple and operate within free hosting allowances where practical.
### 1.2 Product principles

| Principle | Meaning |
| --- | --- |
| Private by design | Invite-only, minimal central metadata, encrypted content. |
| Local-first | The client is the primary place where conversation history is stored and rendered. |
| Honest delivery | Never claim a message is delivered or replicated until the relevant acknowledgement exists. |
| Small-network focus | Optimise for 5–20 trusted users, not mass-market scale. |
| Intentional design | Every visual and interactive element must serve a purpose. |
| Moderate complexity | Use proven components; avoid distributed-systems machinery that the use case does not need. |

## 2. Scope and users

### 2.1 Initial audience

The initial deployment is a private friend network of approximately 5–20 people. Access is invitation-based. Public discovery, public registration and large open communities are excluded from version 1.

### 2.2 Supported platforms

- Desktop and mobile web browsers.
- Installable Progressive Web App (PWA).
- Android application packaged with Capacitor.
- Future iOS compatibility should not be blocked by architectural decisions, but iOS distribution is not a version 1 deliverable.
### 2.3 User roles

| Role | Responsibilities |
| --- | --- |
| Founder | Initial group governance and ownership controls. |
| Administrator | Membership, group settings and permissions. |
| Curator | Optional group role for managing selected group content and memories. |
| Member | Normal participation in conversations and enabled experiences. |
| Guest | Optional restricted access if explicitly enabled by a group. |

## 3. Core messaging and group functionality

### 3.1 Identity and onboarding

- Create a user profile with display name, unique username, avatar and optional status.
- Generate or register a device identity using cryptographic keys.
- Support invitation links and QR-based friend onboarding.
- Verify invitations and peer identity to reduce impersonation.
- Allow a user to review and revoke trusted devices.
- Provide a recovery/export path for identity and locally stored data; explain that recovery is not guaranteed if all copies and backups are lost.
### 3.2 Friend management

- Send, accept and reject friend invitations.
- View friends and their privacy-respecting availability.
- Open direct conversations.
- Remove or block a friend.
- Review trusted devices and invitation status.
### 3.3 Direct messaging

- Send and receive text messages.
- Reply to a message and react to it.
- Edit or delete messages using authenticated events.
- Share images, files and voice notes.
- Display timestamps and truthful delivery states.
- Support optional read receipts and typing indicators.
- Search locally available conversation history.
- Queue outgoing messages while offline and clearly mark them as pending.
- Handle duplicate delivery and reconnection without duplicating visible messages.
### 3.4 Group messaging

- Create, rename, customise and archive groups.
- Invite, approve, remove and manage members.
- Assign group roles and permissions.
- Pin messages and inspect member lists.
- Configure group-specific identity, appearance, privacy and social modules.
- Rotate group encryption keys when membership changes.
### 3.5 Message states

| State | Meaning |
| --- | --- |
| Draft | Message exists only in the composer. |
| Queued | Stored locally and waiting for a connection. |
| Sending | A transmission attempt is in progress. |
| Sent to peer | A connected peer acknowledged receipt. |
| Replicated | One or more additional devices acknowledged durable storage. |
| Delivered | The intended recipient device acknowledged receipt. |
| Read | A read acknowledgement exists and the conversation permits receipts. |
| Failed | Delivery could not be completed; retry or recovery action is available. |

The UI must distinguish sender-local persistence, peer receipt, replica acknowledgement and recipient delivery. These are not interchangeable states.

## 4. Group DNA customisation

Every group has a Group DNA configuration object. Group modules and settings must be data-driven rather than implemented as separate hardcoded group types.

### 4.1 Identity

- Group name and description.
- Avatar and optional cover image.
- Accent colour and theme variant.
- Group introduction or welcome message.
- Member-specific group nicknames.
- Group-specific wallpaper and visual identity.
### 4.2 Permissions

- Who may invite members.
- Who may edit group details.
- Who may pin messages.
- Who may create Echo sessions.
- Who may create Afterglow capsules.
- Who may change group settings.
- Whether new members require approval.
### 4.3 Privacy and experience

- Read receipts and typing indicators.
- Message and media retention preferences.
- Membership visibility.
- Group invitation policy.
- Custom reactions and sound preferences.
- Group-specific accent, wallpaper and selected motion preferences.
- Individual notification preferences that do not override group governance.
### 4.4 Feature modules

| Module | Purpose | Version 1 |
| --- | --- | --- |
| Echo | Anonymous group prompts and collective response reveal. | Included |
| Afterglow | Locked shared time capsules. | Included |
| Orbit | Visual friend/group presence. | Included |
| Additional social modules | New experiences beyond the approved three. | Excluded unless separately approved |

## 5. Signature experiences

### 5.1 Echo

Echo lets an eligible group member create a question or prompt. Other eligible members submit responses. Responses remain hidden until the reveal condition is met, then appear together.

### Echo functional requirements

1. Create an Echo session in a selected group.
1. Set a prompt, eligible participants and closing/reveal condition.
1. Configure whether one or multiple responses are permitted.
1. Allow eligible members to submit a response.
1. Prevent duplicate submissions when the session is configured for one response per participant.
1. Keep responses hidden until the configured reveal condition.
1. Reveal responses together and allow permitted reactions.
1. Expire or retain the session according to group policy.
### Echo privacy requirements

- Ordinary group members must not see the identity of a respondent.
- Use temporary pseudonymous participation credentials or an equivalent privacy-preserving mechanism.
- Do not store a plaintext identity-to-response mapping accessible to group administrators.
- Encrypt response content and authenticate submissions.
- Clearly explain the limits of anonymity, including device compromise and collusion.
- Do not claim cryptographic anonymity until the implementation has been reviewed.
### Echo UI requirements

- Dedicated Echo list and creation flow.
- Prompt card and participation deadline.
- Submission state and confirmation.
- Locked/reveal-pending state.
- Collective reveal animation.
- Readable response cards and reactions.
- Empty, expired and unavailable states.
### 5.2 Afterglow

Afterglow is a shared digital time capsule. Participants contribute supported content while the capsule is open. Contributions remain locked until the configured opening time.

### Afterglow functional requirements

1. Create a capsule with title, description and opening date/time.
1. Select a group and eligible participants.
1. Allow eligible members to submit text, images and supported media.
1. Encrypt contributions before transmission and storage on peers.
1. Hide contributions from participants until the reveal condition.
1. Display a countdown and contribution status without exposing locked content.
1. Reveal the capsule after the configured opening time.
1. Allow permitted reactions and local preservation after opening.
### Afterglow states

| State | Meaning |
| --- | --- |
| Draft | Created but not yet opened for contributions. |
| Open | Eligible participants can contribute. |
| Locked | Contribution window has closed; content remains hidden. |
| Ready to reveal | Opening time has passed, subject to trusted-time validation. |
| Revealed | Participants can access the capsule contents. |
| Archived | Preserved according to group and local retention rules. |

Use a trusted time source when available and account for offline devices and clock manipulation. A client must not reveal content merely because its local clock says the opening time has passed. Define and document the exact trust model before implementation.

### 5.3 Orbit

Orbit is a visual representation of friend and group presence. It should communicate availability and social activity without tracking location or collecting invasive behavioural data.

- Display members as avatars in a circular or orbital composition.
- Support online, away, offline and custom status states.
- Allow each user to control presence visibility.
- Show limited recent group activity where permitted.
- Allow a member profile/status to be opened from the visualisation.
- Respect mute, block and privacy settings.
- Do not collect GPS or infer physical location.
## 6. Notifications and presence

### 6.1 Notification events

- New direct message.
- New group message or mention.
- Friend invitation and group invitation.
- Echo opened, deadline approaching and reveal available.
- Afterglow contribution reminder and capsule opening.
- Relevant group announcements.
### 6.2 Notification requirements

- Support per-user and per-conversation notification preferences.
- Allow muting of individual conversations and groups.
- Use deep links to open the relevant conversation or experience.
- Do not place plaintext message content in push payloads by default.
- Respect browser and Android notification permissions.
- Treat push as a wake-up or navigation signal, not as durable message transport.
### 6.3 Presence

Presence is ephemeral coordination data. It should be short-lived, privacy-controlled and excluded from durable conversation history. Do not promise that a device is online merely because a stale presence record exists.

## 7. Visual identity and UX requirements

### 7.1 Brand direction

Product name: COVE. The name evokes a sheltered, intimate place. Brand line: “A little closer.” Product description: “A private world shared between friends.”

### 7.2 Visual direction

| Element | Direction |
| --- | --- |
| Primary dark theme | Deep plum/charcoal rather than pure black. |
| Primary accent | Muted violet/lavender. |
| Secondary accents | Soft blue and restrained mint for status. |
| Light theme | Warm ivory with muted sage/lavender accents. |
| Typography | Geist or Inter for interface text; optional complementary editorial serif for selected headings. |
| Surfaces | Layered, restrained surfaces with subtle borders. |
| Corners | Consistent rounded geometry, approximately 12–20 px where appropriate. |
| Icons | Lucide icon set. |
| Motion | Short, restrained transitions that communicate state. |

### 7.3 Visual reference direction

The approved visual reference is a dark plum mobile messaging interface with a personalised greeting, rounded search field, horizontal active-friends row, compact conversation cards and a restrained bottom navigation. Use it as inspiration for the visual language, not as a pixel-for-pixel template.

### 7.4 Navigation

| Platform | Layout |
| --- | --- |
| Desktop | Three-column structure: primary navigation/conversations, main content, contextual details. |
| Mobile | Bottom navigation, conversation list, full-screen chat and contextual sheets. |
| Primary sections | Home, Chats, Moments, Memories and Profile. |
| Moments | Contains Echo and Afterglow. |
| Orbit | Accessible from friend/group context. |

### 7.5 Motion specifications

| Interaction | Target duration |
| --- | --- |
| Button feedback | 100–150 ms |
| Message arrival | 160–220 ms |
| Modal entrance | 200–260 ms |
| Sidebar transition | 220–300 ms |
| Theme transition | 300–400 ms |
| Echo reveal | 400–700 ms |

Respect prefers-reduced-motion and equivalent native accessibility settings. Motion must not block interaction or materially harm battery life.

### 7.6 Required UI states

- Loading and skeleton states.
- Empty states with useful guidance.
- Offline and reconnecting states.
- Pending, sent, delivered and failed message states.
- Permission denied.
- Expired content.
- Unavailable replicas.
- Sync in progress and sync failure.
- Feature disabled by group policy.
## 8. Platform requirements

### 8.1 Web and PWA

- Responsive browser application over HTTPS.
- Installable PWA with app manifest and service worker.
- Offline application shell and local history access.
- Browser push where supported and permission granted.
- Graceful handling of browser storage limits and eviction.
### 8.2 Android application

- Package the shared React application using Capacitor.
- Generate a testable APK for private distribution.
- Provide app icon, splash screen and deep links.
- Use native push integration where configured.
- Request camera, media and notification permissions only when needed.
- Handle Android lifecycle and background suspension correctly.
### 8.3 iOS readiness

Keep shared application logic platform-neutral where practical. Native iOS builds and public distribution are not required for version 1.

# PART II — TECHNICAL ARCHITECTURE

## 9. Architecture principles

- Local-first: each device stores its own usable copy of conversations.
- Hybrid P2P: peers exchange content directly when connectivity permits.
- Minimal coordination server: signalling, presence and push dispatch only.
- No central persistent message database.
- Encrypted replication: peers store ciphertext, not plaintext content.
- Explicit consistency: distinguish local persistence, peer receipt, replication and recipient delivery.
- Graceful degradation: the app remains useful when peers are unavailable, while explaining what cannot synchronise.
> IMPORTANT LIMITATION
> A peer device cannot serve data while it is offline or suspended. If all devices holding a record are unavailable, a newly connected device cannot retrieve it. Replication improves availability; it does not guarantee permanent availability.

## 10. Approved technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + TypeScript | UI and application logic. |
| Build | Vite | Development and production build. |
| Styling | Tailwind CSS | Design tokens and responsive styling. |
| Animation | Framer Motion | Controlled interface transitions. |
| Icons | Lucide | Consistent iconography. |
| State | Zustand | Client state management. |
| Local storage | IndexedDB + Dexie.js | Persistent local records and media references/blobs. |
| P2P transport | WebRTC DataChannels | Direct peer communication. |
| Signalling | Cloudflare Workers + WebSockets | Connection negotiation and routing of signalling messages. |
| Coordination | Cloudflare Durable Objects | Room coordination and ephemeral presence. |
| Cryptography | libsodium or a maintained audited implementation | Established cryptographic primitives. |
| PWA | Vite PWA tooling | Installable web experience. |
| Android | Capacitor | Native application packaging and plugins. |
| Hosting | Cloudflare | Frontend and coordination deployment. |
| Version control | GitHub | Repository and CI/deployment integration. |

Django is not selected for the version 1 runtime. It is capable software, but a separate Python backend would add deployment and integration complexity without solving the browser-side P2P, local storage or PWA requirements. Python may still be used for development scripts and test utilities.

## 11. Local data and storage model

### 11.1 Local persistence

Use IndexedDB through Dexie.js. Treat local storage as the primary persistence layer for each device. Do not store sensitive cryptographic secrets in ordinary unprotected localStorage.

### 11.2 Suggested local stores

| Store | Purpose |
| --- | --- |
| profiles | Local profile and friend metadata. |
| devices | Device identity and trusted-device metadata. |
| conversations | Conversation metadata and local indexes. |
| groups | Group configuration and metadata. |
| memberships | Signed membership records and roles. |
| messages | Encrypted message envelopes and local status metadata. |
| message_events | Append-only edits, reactions and deletion events. |
| media_objects | Encrypted media blobs or local references. |
| sync_state | Peer checkpoints, inventory summaries and acknowledgements. |
| protected_keys | Encrypted or platform-protected key material; never raw secrets without protection. |
| echo_sessions | Echo session metadata. |
| echo_responses | Encrypted Echo response records. |
| afterglow_capsules | Afterglow capsule metadata and state. |
| afterglow_contributions | Encrypted capsule contributions. |
| presence_cache | Short-lived presence cache. |
| settings | Local user and device preferences. |

### 11.3 Storage rules

- Use versioned schema migrations.
- Make repository operations transactional where supported.
- Handle quota errors and storage eviction explicitly.
- Do not assume browser storage is a backup.
- Provide a documented encrypted export/recovery mechanism when implemented.
- Never log plaintext messages, private keys or sensitive content.
## 12. Peer networking and signalling

### 12.1 WebRTC

Use WebRTC DataChannels for direct peer communication where possible. Establish connections through authenticated signalling and use STUN-assisted connectivity. DataChannels provide transport encryption, but application-level end-to-end encryption and authenticated message envelopes remain required by the product security model.

### 12.2 Signalling responsibilities

- WebSocket signalling exchange.
- Peer discovery for authorised users/devices.
- Connection negotiation metadata.
- Short-lived room coordination.
- Ephemeral presence.
- Push dispatch or wake-up hints.
### 12.3 Signalling exclusions

- No plaintext message persistence.
- No central conversation history.
- No durable media repository for private conversation content.
- No claim that signalling metadata is zero-knowledge; minimise and document metadata that the service can observe.
### 12.4 TURN

Direct WebRTC connections may fail behind restrictive NATs or mobile networks. The initial prototype may use STUN-assisted direct connections. Add TURN relay support when real-device testing demonstrates the need. TURN bandwidth may not be available indefinitely at zero cost; document any provider, limits and fallback behaviour.

## 13. Synchronisation and replication

### 13.1 Replication target

Aim for up to three encrypted copies where eligible devices are available: sender device, recipient device and an additional trusted device. This is a best-effort replication target, not a guaranteed quorum or durability promise.

### 13.2 Message envelope

- Unique message ID.
- Conversation/group ID.
- Sender device ID.
- Creation timestamp and ordering metadata.
- Message type.
- Encrypted payload.
- Expiry/retention metadata where applicable.
- Authentication/integrity information.
- Protocol version.
### 13.3 Synchronisation flow

1. Establish an authenticated peer connection.
1. Exchange protocol version and authorised conversation metadata.
1. Exchange compact inventory summaries or sequence checkpoints.
1. Identify missing record IDs.
1. Request missing encrypted records in bounded batches.
1. Validate envelope structure, authenticity and integrity.
1. Store records locally using idempotent operations.
1. Update checkpoints and issue acknowledgements.
1. Record replica status separately from recipient delivery status.
### 13.4 Event model

Use an append-only event model for message edits, reactions, deletion requests and membership changes. Do not silently overwrite history. Deletion should create authenticated tombstone events and trigger propagation to known replicas.

### 13.5 Conflict handling

- Use deterministic ordering metadata and stable IDs.
- Reject invalid or unauthenticated events.
- Make operations idempotent.
- Do not introduce consensus algorithms for the initial network.
- Document edit/edit and delete/edit precedence.
- Treat deletion as best-effort propagation, not a guarantee against screenshots, exports or offline copies.
### 13.6 Peer availability

A peer may be online in the UI but unable to serve a requested record, or may disconnect during transfer. Use bounded retries, resumable batches and clear unavailable-replica states. Never claim complete synchronisation unless the relevant records have been acknowledged.

## 14. Security and privacy

### 14.1 Security requirements

- Generate and protect device identity keys.
- Authenticate peer identity and invitation claims.
- Encrypt content before it leaves the originating client.
- Authenticate message envelopes and prevent replay.
- Use established cryptographic protocols and maintained libraries.
- Rotate group keys when membership changes.
- Protect local key material using platform-appropriate mechanisms.
- Encrypt media before replication.
- Keep push payloads free of plaintext message content by default.
- Define a threat model before claiming production-grade security.
### 14.2 Group membership and key rotation

Membership changes must be authenticated. When a member is removed, rotate the group key so that the removed member cannot decrypt future content. Historical access must follow an explicit group policy. The implementation must document how devices belonging to the same user are authorised.

### 14.3 Echo anonymity

Echo anonymity is a product promise that requires careful protocol design. The implementation must not rely on merely hiding a username in the UI. Document the trust assumptions, metadata exposure, administrator visibility and collusion limitations before release.

### 14.4 Afterglow timing

Afterglow requires a defined trust model for opening times. Client clocks are not authoritative. Use signed session metadata and a trusted time source where available. Explain offline and clock-manipulation limitations.

### 14.5 Privacy boundaries

- No GPS tracking.
- No unnecessary analytics or behavioural profiling.
- No plaintext content in server logs.
- No plaintext message content in push payloads by default.
- No promise that deleted content is erased from every offline device.
- No claim of perfect anonymity or guaranteed availability.
## 15. Hosting and deployment

### 15.1 Selected hosting

Cloudflare Free is the approved initial deployment target. It is selected for static asset delivery, Workers and Durable Objects in one platform. The free plan is subject to current provider pricing, limits, fair-use policies and future changes.

### 15.2 Responsibilities

| Service | Responsibility |
| --- | --- |
| Workers Static Assets or Pages | Serve the React application and PWA assets. |
| Cloudflare Workers | HTTP APIs, invitation validation, push dispatch and lightweight coordination endpoints. |
| Durable Objects | WebSocket coordination, room state and ephemeral presence. |
| GitHub | Source control, review and deployment integration. |

### 15.3 Free-tier discipline

- Monitor request, compute and storage usage.
- Minimise unnecessary presence heartbeats.
- Clean up inactive WebSocket sessions and ephemeral state.
- Batch synchronisation requests.
- Apply rate limits to invitations and signalling.
- Implement graceful behaviour when quotas are reached.
- Do not claim the platform will remain free forever.
### 15.4 Cost assumptions

The target is ₹0/month during small private testing, assuming usage stays within free allowances and no paid domain, TURN relay, app-store distribution or other paid service is selected. This is a target, not a contractual guarantee.

## 16. Android and PWA distribution

### 16.1 Shared codebase

Use one React + TypeScript application. Deliver it as a web application/PWA and package the same frontend with Capacitor for Android. Keep platform-specific integrations behind well-defined adapters.

### 16.2 PWA

- Web app manifest and icons.
- Service worker and offline application shell.
- Installability over HTTPS.
- Local conversation access where data is available.
- Browser push where supported.
- Graceful handling of browser storage limits and background restrictions.
### 16.3 Android

- Capacitor Android project.
- APK build for private distribution.
- App icon and splash screen.
- Native push integration when configured.
- Deep links and notification navigation.
- Runtime permission handling.
- Lifecycle-aware connection and sync behaviour.
A Capacitor app is not automatically an always-on peer relay. Android may suspend background work. Use native platform capabilities responsibly and do not promise permanent WebRTC connectivity while the app is closed.

## 17. Reliability, performance and accessibility

### 17.1 Performance

- Fast initial load and lazy loading for nonessential features.
- Efficient conversation rendering and list virtualisation where needed.
- Bounded sync batches and backpressure.
- Media size limits and appropriate compression.
- Avoid excessive animation and unnecessary polling.
### 17.2 Reliability

- Preserve locally committed messages.
- Recover from network interruptions.
- Retry safely and idempotently.
- Expose failed and pending states.
- Do not discard unsent messages silently.
- Explain when records cannot be recovered because all replicas are unavailable.
### 17.3 Accessibility

- Keyboard navigation and visible focus.
- Screen-reader labels.
- Adequate colour contrast.
- Reduced-motion support.
- Touch targets suitable for mobile use.
- Clear error messages and non-colour-only status indicators.
# PART III — AI AGENT DEVELOPMENT GUIDE

## 18. Agent role and non-negotiable rules

The AI coding agent acts as the principal implementation engineer. It is responsible for inspecting the repository, planning changes, writing maintainable code, testing behaviour and keeping documentation current.

### 18.1 Non-negotiable rules

1. Inspect before modifying. Read the existing repository, package files and documentation first.
1. Do not overwrite working code without understanding dependencies and behaviour.
1. Implement in small, testable increments.
1. Use strict TypeScript and explicit interfaces.
1. Do not introduce unnecessary dependencies.
1. Do not present mock UI as completed functionality.
1. Do not fake successful network operations or delivery acknowledgements.
1. Do not store messages or private media in a central persistent database.
1. Do not hardcode secrets, tokens or private keys.
1. Never log plaintext messages or sensitive key material.
1. Do not invent cryptographic algorithms or protocols.
1. Write tests alongside implementation.
1. Update documentation when architecture or behaviour changes.
1. Preserve existing functionality during refactoring.
1. Ask for approval before changing product scope or a non-negotiable technology decision.
### 18.2 Development philosophy

| Prefer | Avoid |
| --- | --- |
| Correctness over speed | Large unreviewed code dumps. |
| Simple proven components | Premature abstraction. |
| Explicit states and errors | Silent failure or optimistic false success. |
| Feature modules | Monolithic components and tangled services. |
| Measured performance | Decorative complexity. |
| Documented security assumptions | Unverified security claims. |

## 19. Repository structure

Use a feature-based monorepo. The following is the intended logical structure; refine only when implementation evidence supports a change.

> cove/
> ├── apps/
> │   ├── web/
> │   │   ├── src/
> │   │   │   ├── app/
> │   │   │   ├── components/
> │   │   │   ├── features/
> │   │   │   │   ├── auth/
> │   │   │   │   ├── friends/
> │   │   │   │   ├── chats/
> │   │   │   │   ├── groups/
> │   │   │   │   ├── echo/
> │   │   │   │   ├── afterglow/
> │   │   │   │   ├── orbit/
> │   │   │   │   ├── memories/
> │   │   │   │   └── profile/
> │   │   │   ├── hooks/
> │   │   │   ├── services/
> │   │   │   ├── stores/
> │   │   │   └── styles/
> │   │   └── public/
> │   └── signaling/
> │       ├── src/
> │       │   ├── api/
> │       │   ├── objects/
> │       │   ├── presence/
> │       │   └── notifications/
> │       └── wrangler.jsonc
> ├── packages/
> │   ├── shared/
> │   ├── messaging/
> │   ├── storage/
> │   ├── encryption/
> │   ├── p2p/
> │   ├── synchronization/
> │   ├── groups/
> │   └── ui/
> ├── docs/
> │   ├── PRD.md
> │   ├── AGENT_GUIDE.md
> │   ├── ARCHITECTURE.md
> │   ├── SECURITY.md
> │   ├── SYNC_PROTOCOL.md
> │   ├── DATA_MODEL.md
> │   └── DEPLOYMENT.md
> ├── tests/
> ├── package.json
> └── pnpm-workspace.yaml

Use pnpm workspaces unless the repository already has a sound package-management setup. Do not create packages merely to satisfy the diagram; introduce package boundaries when there is a real reuse or isolation benefit.

## 20. Module responsibilities

| Module/agent | Responsibilities | Boundary |
| --- | --- | --- |
| Frontend | Navigation, design system, chat and feature screens, responsive states, accessibility. | Must not embed networking or cryptographic protocols directly in UI components. |
| Messaging | Message models, validation, replies, reactions, edits, deletion events and delivery state. | Must preserve authenticated event semantics. |
| Storage | Dexie schemas, migrations, repositories, local persistence and retention. | Must not silently discard locally committed records. |
| Networking | WebRTC, signalling client, peer lifecycle, STUN, DataChannels and reconnects. | Must expose typed transport interfaces. |
| Synchronisation | Inventory exchange, missing-record detection, replica transfer, checkpoints and conflict handling. | All operations must be idempotent. |
| Security | Identity, encryption integration, key lifecycle, membership authentication and replay protection. | Cryptographic changes require documented review. |
| Cloudflare | Workers, Durable Objects, WebSockets, presence, push dispatch and deployment. | Must not become a central message database. |
| UI/UX | Tokens, reusable components, feature-specific visual identity and interaction states. | Every visible control must have a real action or be clearly disabled. |

## 21. Agent workflow and change discipline

### 21.1 Phase 0 — Repository inspection

1. Inspect the repository tree and existing documentation.
1. Read package.json, lockfiles, TypeScript configuration and build scripts.
1. Identify existing frameworks, dependencies and deployment files.
1. Run the existing tests and build before making changes where feasible.
1. Identify incomplete or broken behaviour.
1. Report the current architecture and risks.
1. Produce a small implementation plan for approval.
### 21.2 Implementation loop

1. Restate the requirement and acceptance conditions.
1. Identify affected modules and dependencies.
1. Propose the smallest coherent change.
1. Implement the change.
1. Add or update unit and integration tests.
1. Run lint, type-check, tests and build.
1. Inspect the diff for accidental changes and secrets.
1. Update relevant documentation.
1. Report completion, test results and remaining limitations.
### 21.3 UI/UX agent instructions

- Use the approved dark plum/violet reference direction as visual inspiration, not a pixel-copy target.
- Build a coherent design-token system for colour, typography, spacing, radius, borders and motion.
- Use realistic sample conversations and group names in mock states.
- Test mobile widths of 360px and 390px, tablet 768px, laptop 1024px and desktop 1440px.
- Ensure every button, menu, tab and visible action has a defined behaviour.
- Provide loading, empty, offline, error and disabled states.
- Give Echo, Afterglow and Orbit distinct interaction patterns while preserving the shared brand.
- Do not use motion that blocks interaction or ignores reduced-motion preferences.
### 21.4 Change control

- Do not add a new signature feature without explicit approval.
- Do not replace Cloudflare, React, TypeScript, WebRTC or IndexedDB without a documented technical reason and approval.
- Do not add a central persistent message database.
- Do not introduce a paid service without explaining the need, alternatives and cost.
- Do not claim end-to-end encryption, anonymity or reliable background delivery until verified.
- Record protocol and data-model changes in the appropriate documentation.
## 22. Testing and reporting

### 22.1 Unit tests

- Message validation and state transitions.
- Storage repositories and migrations.
- Group permission evaluation.
- Echo session and response validation.
- Afterglow state transitions and time validation.
- Presence state expiry.
- Synchronisation inventory and idempotency.
- Cryptographic wrapper interfaces and error handling.
### 22.2 Integration tests

- Two-device authenticated connection.
- Direct messaging and acknowledgements.
- Multi-member group messaging.
- Offline queue and reconnect.
- Replica transfer and duplicate suppression.
- Membership removal and key rotation.
- Echo submission and reveal.
- Afterglow locked and reveal states.
- Notification dispatch without plaintext leakage.
### 22.3 UI tests

- Navigation and responsive layouts.
- Group creation and Group DNA settings.
- Message composition and error states.
- Echo participation and reveal.
- Afterglow capsule creation and opening.
- Orbit privacy and presence states.
- Theme switching and reduced motion.
### 22.4 Security tests

- Invalid and expired invitations.
- Unauthenticated or impersonated peers.
- Tampered message envelopes.
- Replay attempts.
- Removed-member access to future group content.
- Key rotation failures.
- Local data exposure and secret logging.
- Plaintext notification payload leakage.
- Echo identity leakage through metadata or administrator views.
### 22.5 Agent completion report

After each meaningful phase, report:

1. What was implemented.
1. Files created and modified.
1. Architecture decisions made.
1. Tests executed and their results.
1. Known limitations and unresolved risks.
1. Deployment or configuration impact.
1. Remaining tasks and next recommended step.
A feature is not complete because its screen exists. It is complete only when the required logic, persistence, networking, error handling, permissions and tests are implemented.

# PART IV — DELIVERY AND ACCEPTANCE

## 23. Phased roadmap

| Phase | Scope | Exit condition |
| --- | --- | --- |
| 0. Inspect | Repository audit, architecture report, implementation plan. | Existing state understood and baseline recorded. |
| 1. Foundation | React, TypeScript, Vite, routing, design tokens, responsive shell, PWA shell. | Navigable, polished application using realistic mock data. |
| 2. Identity and groups | Profiles, invitations, device identity, group creation, membership, Group DNA. | Users can create and manage local groups. |
| 3. Local messaging | Dexie, message models, local conversations, replies, reactions and events. | Messages persist across application restarts on one device. |
| 4. Direct networking | Signalling, WebRTC, authenticated peers, direct messaging and reconnect. | Two real devices communicate over different networks. |
| 5. Distributed sync | Group connections, inventories, replication, offline recovery and conflict handling. | Multiple devices recover available missing records without central message persistence. |
| 6. Security | Device identity, encryption, group keys, rotation and secure media. | Security flows tested and documented; no unsupported security claims. |
| 7. Signature features | Echo, Afterglow and Orbit. | All three features work with permissions, storage, sync and error states. |
| 8. Distribution | PWA, Web Push, Capacitor, Android build and deep links. | Installable web app and testable Android APK. |
| 9. Validation | Cross-device, network, privacy, performance and quota tests. | Private test release meets acceptance criteria. |

A 6–8 week part-time estimate may be used for planning, but it is not a delivery guarantee. Distributed synchronisation, security review and real-device testing may extend the schedule.

## 24. Acceptance criteria

1. Users can create identities and exchange authenticated invitations.
1. Two devices can establish authenticated peer connections.
1. Direct messages work between actual devices.
1. Group messaging works with multiple members.
1. Messages persist locally after application restart.
1. Offline messages synchronise after reconnection when a valid replica is available.
1. Encrypted records can be replicated to trusted devices.
1. No plaintext conversation history is stored centrally.
1. Group configurations are independent and enforce permissions.
1. Echo supports anonymous submissions and collective reveal under a documented threat model.
1. Afterglow supports contributions, locked state and time-validated opening.
1. Orbit displays privacy-respecting presence.
1. Notifications work in supported environments without plaintext content by default.
1. The PWA is installable on supported browsers.
1. An Android APK can be built and tested.
1. The interface works at the specified mobile and desktop widths.
1. Offline, reconnecting, failed and unavailable-replica states are visible and accurate.
1. Security and synchronisation tests pass.
1. Deployment stays within configured free-tier budgets during the private test period.
1. Documentation reflects the implemented architecture and known limitations.
## 25. Out of scope for version 1

- Video calling.
- Public communities or public group discovery.
- Blockchain or token systems.
- AI assistants inside groups.
- Complex multi-hop routing.
- Social media feeds or recommendation algorithms.
- Payments.
- Large-scale CDN architecture.
- Complex distributed consensus.
- Additional signature experiences beyond Echo, Afterglow and Orbit.
- Guaranteed always-on mobile background relay.
- Guaranteed permanent free hosting.
## 26. Final engineering directives

| Decision | Approved baseline |
| --- | --- |
| Product name | COVE |
| Brand line | A little closer. |
| Product statement | A private world shared between friends. |
| Frontend | React + TypeScript + Vite |
| Styling and motion | Tailwind CSS + Framer Motion |
| State | Zustand |
| Local storage | IndexedDB + Dexie.js |
| Peer transport | WebRTC DataChannels |
| Coordination | Cloudflare Workers + Durable Objects |
| Encryption | libsodium or maintained audited implementation |
| PWA | Vite PWA tooling |
| Android | Capacitor |
| Hosting | Cloudflare Free plan, within current limits |
| Source control | GitHub |
| Initial audience | 5–20 invited friends |
| Signature features | Echo, Afterglow and Orbit |
| Message persistence | Local-first encrypted records; no central persistent message database |

> FINAL PRODUCT PRINCIPLE
> The technology should be invisible to the user. The design should be intentional. Groups should feel different from one another. Conversations should remain under the control of their participants. COVE should stay small enough to maintain and ambitious enough to be interesting.

COVE  •  A little closer.

---

## Agent startup instruction

Before modifying the repository, inspect its current structure, package files, configuration, documentation and tests. Report the existing architecture and risks. Then propose a small Phase 0/Phase 1 implementation plan. Do not begin a full rewrite or implement all phases in one pass.
