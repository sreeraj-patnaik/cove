# Administrator account management

Set the administrator's username before deployment:

```powershell
npx wrangler secret put ADMIN_USERNAME
```

Use the exact lowercase username of the founding administrator. That account can use the following authenticated API actions:

- `GET /api/admin/users` — list account metadata only.
- `POST /api/admin/reset-password` with `{ "username": "friend", "password": "new 12+ character password" }`.
- `POST /api/admin/delete-user` with `{ "username": "friend" }`.

The service never exposes, reads, or logs passwords. A reset creates a replacement salted password verifier. Deleting an account removes its server-side login record only; it cannot erase local messages already stored on members' devices.

These controls are intentionally API-only for now. Use them only after signing in as the configured administrator and sending the session bearer token. Before exposing the service beyond friends, add an in-app admin panel, audit logs, password-reset notifications, rate limiting, and an independent security review.
