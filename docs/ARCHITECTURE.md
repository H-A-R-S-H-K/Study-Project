# Architecture — Village Transport Connect

## Backend: layered clean architecture

```
routes → middlewares → controllers → services → repositories → models(Mongoose) → MongoDB
```

- **routes** — declare endpoints, attach auth/validation/rate-limit middleware.
- **middlewares** — cross-cutting: auth (Phase 2), Zod validation, rate limiting,
  error translation, request logging.
- **controllers** — HTTP only. Parse the request, call one service, send a
  uniform `ApiResponse`. No business logic, no DB.
- **services** — business rules, orchestration, transactions, and the socket/
  push side effects. Depend on repository *interfaces*, never on Mongoose.
- **repositories** — the only layer that touches Mongoose (`BaseRepository<T>`
  + concrete repos). Makes services unit-testable with a fake repo.
- **models** — schema + indexes only.

**Why this shape:** business logic is isolated from both HTTP and the database,
so it can be tested in memory and the persistence layer can change without
touching rules. This is what makes the "unit-test friendly" requirement real.

### Request lifecycle
`HTTP → route → [rate-limit → auth → validate] → controller → service → repository → model`
Errors thrown anywhere bubble to `errorHandler`, which renders a consistent
`{ success:false, message, details? }` body.

## Frontend: feature-based architecture

Each domain folder (`auth`, `customer`, `driver`, `vehicleOwner`, `chat`,
`notifications`, `profile`, `maps`) is self-contained (screens + hooks +
components). Shared concerns live in `common/`, `redux/`, `services/`,
`navigation/`, `theme/`.

### State ownership (deliberate split)
- **Redux Toolkit + Redux Persist (MMKV)** — *client/session* state only: auth
  tokens, current user, theme, language. Small and persisted.
- **TanStack Query** — *all server state*: requests, offers, chats, profiles.
  Gives caching, retries, background refetch; never duplicated into Redux.

**Why:** avoids the "everything in Redux" anti-pattern. Server data has its own
lifecycle (staleness, refetch) that Query models far better than reducers.

## Realtime & notifications
- **Socket.IO** (Phase 7) attaches to the same HTTP server for chat, typing,
  read receipts, and live location — transient events, not persisted except
  Messages.
- **FCM** (Phase 8) for push; every push has a durable `Notification` row so the
  in-app inbox is the source of truth.

## Security posture
Helmet, CORS allow-list, `express-mongo-sanitize`, Zod validation on every
input, JWT access tokens (short-lived) + rotating refresh tokens (hashed,
revocable), role-based authorization middleware, global + auth-specific rate
limits, secrets only via validated env.

## Scalability seams (future-proofing, no refactor needed)
- **Payments** — an Offer already carries `price`/`currency`; a payment service
  can attach to the accept flow without schema surgery.
- **Scheduling** — `Request.scheduledAt` + `expiresAt` already exist.
- **i18n** — `ui.language` in state; strings externalised from Phase 3.
- **SOS / live tracking** — GeoJSON points + socket channel already present.
- **AI recommendations** — the geo + ratings data model supports ranking later.
```
