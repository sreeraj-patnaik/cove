# Remaining implementation passes

## Pass 4 — Identity, invitations and local group model

Device identity wrapper, local user profile, friend/group invitations, trusted-device view, Group DNA persistence, membership roles and permissions.

## Pass 5 — Complete local messaging

Dexie schema migrations, conversations, local search, replies, reactions, edits, deletion events, media/voice metadata, retention and export.

## Pass 6 — Authenticated peer transport

Signed room claims, client signalling adapter, WebRTC DataChannels, device verification, reconnect behavior and truthful receipt states.

## Pass 7 — Encryption and synchronisation

Audited cryptography integration, encrypted event envelopes, group-key rotation, inventory-based replication, idempotency and conflict handling.

## Pass 8 — Signature features, notifications and Android

Multi-device Echo/Afterglow protocols with documented limitations, Orbit privacy, push wake-ups, Capacitor configuration and real-device validation.

Every pass ends by updating `IMPLEMENTATION_STATUS.md`, its relevant guide, tests, and the documentation of known limitations.
