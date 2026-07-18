# Village Transport Connect

A matchmaking marketplace for transport in villages and small towns where ride-hailing
services (Uber/Ola) don't operate. The platform **only connects people** — it does not
calculate fares, take payments, or charge commission. Customers and providers negotiate
price directly and pay offline.

> Think of it as **Uber + Facebook Marketplace + Upwork**, for rural transport.

---

## Monorepo layout

```
village-transport-connect/
├── backend/     Node.js + Express + TypeScript API, Socket.IO realtime, MongoDB
├── mobile/      React Native + TypeScript app (Customer / Vehicle Owner / Driver)
└── admin/       React web dashboard (scaffolded in Phase 10)
```

Each package is independently installable and deployable. They are grouped in one
repository so shared domain concepts (enums, DTO shapes) stay consistent and so a single
PR can evolve API + client together.

---

## Roles

| Role           | Owns vehicle | Drives | Core actions                                              |
| -------------- | ------------ | ------ | -------------------------------------------------------- |
| Customer       | —            | —      | Post requests, view offers, accept one, chat, rate       |
| Vehicle Owner  | ✅ (1..n)    | maybe  | List vehicles, browse requests, send priced offers       |
| Driver         | —            | ✅     | List skills/license, browse requests, send priced offers |
| Admin          | —            | —      | Verify docs, suspend users, view reports (web dashboard)  |

### Service types a customer can request
- `VEHICLE_ONLY` — "I need a tractor."
- `DRIVER_ONLY` — "I have a car but need a driver."
- `VEHICLE_AND_DRIVER` — "I need a car with a driver."

---

## Architecture principles

**Backend — layered clean architecture.** Dependencies point inward only:

```
HTTP request
   │
   ▼
 route ──▶ middleware (auth, validate, rate-limit)
              │
              ▼
         controller        (HTTP concerns only: parse req, send res)
              │
              ▼
          service          (business rules, orchestration, transactions)
              │
              ▼
        repository          (all Mongoose/DB access lives here — nothing above touches Mongo)
              │
              ▼
           model            (schema + indexes)
```

Why: controllers/services never import Mongoose, so business logic is unit-testable with
a fake repository, and the persistence layer can change without touching business rules.

**Frontend — feature-based architecture.** Each domain (`auth`, `customer`, `driver`,
`vehicleOwner`, `chat`, ...) is a self-contained slice with its own screens, hooks, and
components. Cross-cutting concerns live in `common/`, `redux/`, `services/`, `navigation/`.

Why: features are added/removed without ripple, and teams can own a folder each.

**No pricing logic anywhere.** There is deliberately no distance→fare calculation, no
estimation, no surge. Providers type an amount; customers accept or reject. This is a
product invariant, enforced by the absence of any pricing service.

---

## Tech stack

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.IO, JWT + refresh
tokens, Zod validation, Multer + Cloudinary uploads, Firebase Admin (FCM), Helmet,
express-rate-limit, mongo-sanitize, compression, Pino logging.

**Mobile:** React Native, TypeScript, React Navigation, Redux Toolkit + Redux Persist,
TanStack Query, Axios, React Native Maps, react-native-paper (Material Design 3),
React Hook Form + Zod, Socket.IO client, Firebase Cloud Messaging.

---

## Phase plan

| Phase | Scope                                            | Status |
| ----- | ------------------------------------------------ | ------ |
| 1     | Setup, architecture, folder structure, DB schema | ✅     |
| 2     | Authentication (phone OTP, JWT, refresh)         | ✅     |
| 3     | Role management                                  | ✅     |
| 4     | Maps (nearby, pins, tracking)                    | ✅     |
| 5     | Requests                                         | ✅     |
| 6     | Offers                                           | ✅     |
| 7     | Chat (Socket.IO)                                 | ✅     |
| 8     | Notifications (FCM)                              | ✅     |
| 9     | Ratings                                          | ✅     |
| 10    | Admin dashboard                                  | ✅     |
| 11    | Testing                                          | ✅     |
| 12    | Deployment                                       | ✅     |

## Running it

```bash
# Full server-side stack (API + MongoDB + admin dashboard)
cp .env.example .env && docker compose up -d --build
docker compose exec api npm run seed        # create the admin account

# Or run pieces locally
cd backend && npm install && npm run dev     # API on :5000
cd admin   && npm install && npm run dev     # dashboard on :5173
cd mobile  && npm install && npm run android # / run ios
```

## Docs
- `docs/ARCHITECTURE.md` — backend/frontend architecture & scalability seams
- `docs/DATABASE_SCHEMA.md` — full data model & indexes
- `docs/MAPS_SETUP.md`, `docs/NOTIFICATIONS_SETUP.md` — native config
- `docs/TESTING.md` — how to run the test suites
- `docs/DEPLOYMENT.md` — Docker/compose, env, production checklist
