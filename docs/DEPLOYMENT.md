# Deployment

Three deployables: **backend** (API + Socket.IO), **admin** (static SPA behind
nginx), and **mobile** (React Native app → app stores). A `docker-compose.yml`
brings up the server side (MongoDB + API + admin) on a single host.

## Quick start (single host, Docker)

```bash
cp .env.example .env         # fill in JWT secrets + any providers
docker compose up -d --build
docker compose exec api npm run seed     # create the admin account
```

- API →  http://localhost:5000/api/v1  (docs at `/api/v1/docs`)
- Admin → http://localhost:8080  (nginx serves the SPA and proxies `/api`)
- Data persists in the `mongo-data` volume.

Generate real secrets:

```bash
openssl rand -hex 64   # JWT_ACCESS_SECRET
openssl rand -hex 64   # JWT_REFRESH_SECRET
```

## Backend image
Multi-stage: compile TS in a build stage, then run `node dist/server.js` on
prod-only deps as the non-root `node` user. The container exposes `5000` and has
a healthcheck against `/api/v1/health`. Graceful shutdown drains connections on
SIGTERM (Compose/K8s stop signal).

## Admin image
Vite build served by nginx with SPA fallback and an `/api` proxy to the `api`
service (including WebSocket upgrade for Socket.IO). Assets are content-hashed
and cached for a year.

## External services (optional, feature-flagged)
| Service | Env | If unset |
| --- | --- | --- |
| MongoDB | `MONGO_URI` | required |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | required (boot fails) |
| Cloudinary | `CLOUDINARY_*` | uploads fall back to local disk |
| Firebase (FCM) | `FIREBASE_SERVICE_ACCOUNT_PATH` | push disabled; in-app + socket only |
| SMS gateway | `SMS_PROVIDER_KEY` | OTP codes are logged, not sent |

Every integration degrades gracefully, so the stack runs end-to-end with only
Mongo + JWT secrets configured.

## Mobile
Point the app at the deployed API by setting `apiBaseUrl` / `socketUrl` in
`mobile/src/config` (or via a build-time env). Apply the native config from
`docs/MAPS_SETUP.md` and `docs/NOTIFICATIONS_SETUP.md`, then build release
binaries with `npm run android` / `npm run ios` (or Fastlane/EAS in CI) and ship
to the Play Store / App Store.

## CI
`.github/workflows/ci.yml` runs on every push/PR: backend (typecheck + lint +
test + build), mobile (typecheck + test), admin (typecheck + build).

## Production checklist
- [ ] Strong, unique `JWT_*` secrets; rotate the seeded admin password.
- [ ] MongoDB with auth + backups (managed Atlas or a secured replica set —
      also enables multi-doc transactions).
- [ ] TLS termination (reverse proxy / load balancer) in front of API + admin.
- [ ] Cloudinary + Firebase + SMS credentials set.
- [ ] Run multiple API replicas behind the LB; move the request-expiry sweep to
      a single scheduled worker and Socket.IO to a Redis adapter for horizontal scale.
- [ ] Centralised logging/metrics; alert on 5xx and healthcheck failures.
