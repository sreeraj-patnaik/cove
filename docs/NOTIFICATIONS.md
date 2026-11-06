# Notification guide

Notifications are not implemented yet. This is deliberate: a private messaging product must not send plaintext conversation content in a push payload.

## Approved design

- Ask browser or Android permission only after a user enables notifications in settings.
- Push payloads contain a generic event identifier, conversation/capsule reference, and no plaintext message text, sender name, media URL, or key material.
- On receipt, the client opens local storage and synchronises from a valid peer when possible before rendering content.
- Respect per-conversation mute preferences, system permission, and group policy.
- Use the Worker only for wake-up dispatch; never persist message content there.

## Required next implementation

Define push-provider credentials as Worker secrets, subscribe devices only after authenticated identity creation, store encrypted/minimal subscription metadata, add an event dispatcher with rate limits, and test denied permission, muted chats, expired endpoints, and offline-device behavior.
