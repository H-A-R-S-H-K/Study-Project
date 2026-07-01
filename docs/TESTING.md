# Testing

## Backend (`backend/`) — Vitest + supertest + in-memory MongoDB

```bash
cd backend
npm test          # run once
npm run test:watch
```

- **Isolation**: `test/setup.ts` boots an ephemeral MongoDB via
  `mongodb-memory-server` (pinned to the local `mongod` with
  `MONGOMS_SYSTEM_BINARY`, so no binary download), connects Mongoose, builds
  indexes (incl. `2dsphere`), attaches Socket.IO to a real server, and wipes all
  collections after each test.
- **Unit** (`test/unit/`): pure functions — duration parsing, pagination, crypto.
- **Integration** (`test/integration/`): exercise the real Express app through
  HTTP (`supertest`):
  - `auth.test.ts` — OTP register/login, refresh rotation + reuse detection,
    admin self-registration block, `/me` guard.
  - `marketplace.test.ts` — the full request → offer → accept → complete → rate
    happy path, auto-reject on accept + double-accept 409, role/ownership rules,
    rating guards.
  - `admin.test.ts` — email/password login, non-admin 403, suspend/reactivate,
    document verification cascade, reject-needs-reason.

Rate limiters are disabled under `NODE_ENV=test` so the suite can register many
users from one IP.

## Mobile (`mobile/`) — Vitest (pure logic)

```bash
cd mobile
npm test
```

Covers the framework-agnostic logic that carries the most regression risk:
- `authSlice.test.ts` — credential storage, token rotation, partial user merge,
  logout reset.
- `utils.test.ts` — distance formatting, API-error extraction, schedule presets,
  status labels.

Component and end-to-end flows (screens, navigation) would use React Native
Testing Library / Detox; the pure units give fast, reliable coverage without a
device or emulator.

## Admin (`admin/`)

```bash
cd admin
npm run typecheck   # tsc --noEmit
npm run build       # tsc + vite build
```

## What's covered
The critical invariants are all under test: **no double-accept**, **offers
auto-reject on match**, **refresh-token reuse detection**, **rating only after
completion / once**, **role + ownership guards**, and the **document
verification cascade**.
