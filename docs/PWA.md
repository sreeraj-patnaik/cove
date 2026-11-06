# PWA guide

## Install for your friends

1. Deploy COVE to its final HTTPS URL first.
2. Each friend opens the URL in Chrome, Edge, Safari or Android Chrome.
3. Choose **Install app** / **Add to Home Screen**. On Android Chrome this is in the browser menu; on iPhone Safari it is **Share → Add to Home Screen**.
4. Open COVE from its new icon, create an account, and enter the same shared group code in the group settings.

## Current behavior

COVE includes a manifest, maskable SVG icon, standalone display metadata, a theme colour, service-worker registration, and a cache-first worker. After a successful online load, the worker caches the shell and same-origin fetched assets; it falls back to `index.html` for navigations.

## Verification checklist

1. Deploy over HTTPS (or use localhost).
2. Open browser developer tools and confirm the service worker is activated.
3. Reload once online, then test a reload in offline mode.
4. Use the browser install prompt and verify standalone launch.
5. Check storage eviction behavior on a physical mobile browser.

## Remaining work

Branded icons, an offline update prompt, cache-version UX, quota monitoring, background sync policy, and install tests are not yet implemented. Push requires the separate notification architecture and explicit user permission. Authentication requires the deployed Worker, so account creation/sign-in cannot operate on a first-ever fully offline launch.
