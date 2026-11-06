# Deployment guide

## Cloudflare Workers (recommended)

Prerequisites: a Cloudflare account, Node.js 20+, and a project name available on the account.

1. Install dependencies: `npm install`.
2. Authenticate locally: `npx wrangler login`.
3. Create a high-entropy signing secret: `npx wrangler secret put AUTH_SECRET`.
4. Set the founder username permitted to reset and delete accounts: `npx wrangler secret put ADMIN_USERNAME`.
5. Validate the frontend: `npm run build`.
6. Deploy static assets plus the coordination Worker: `npm run deploy:cloudflare`.
5. Visit `/api/health` on the deployed domain. It must return `{"ok":true,...}`.

`wrangler.jsonc` deploys `dist/` as SPA assets and the `SignalRoom` Durable Object as an ephemeral signalling/presence service. It never writes message content to Cloudflare storage.

## Local full-stack run

Create a local-only `.dev.vars` file containing `AUTH_SECRET=a-long-random-development-only-value`, then run `npm run build` followed by `npm run dev:cloudflare`. Open the Workers URL printed by Wrangler (normally `http://localhost:8787`). This serves the built PWA and the account endpoints together. `.dev.vars` is ignored by Git.

Before real private testing, configure a custom domain, HTTPS redirects, allowed origins for the client signalling adapter, Worker rate limits, TURN credentials as Worker secrets, and production error monitoring that excludes message content.

## Other static hosts

Run `npm run build`, then upload the generated `dist/` directory to any static host that provides HTTPS and SPA fallback to `index.html`. The frontend remains usable locally/offline; real-time coordination requires separately deploying the Worker or an equivalent non-persistent coordination service.

Never place private keys, invitation secrets, TURN credentials, passwords or push-provider keys in the frontend build or in `wrangler.jsonc`. Add runtime secrets with `wrangler secret put NAME`.
