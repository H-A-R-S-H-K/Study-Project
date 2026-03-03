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

| Phase | Scope                                            | Status         |
| ----- | ------------------------------------------------ | -------------- |
| 1     | Setup, architecture, folder structure, DB schema | ✅ this phase  |
| 2     | Authentication (phone OTP, JWT, refresh)         | pending        |
| 3     | Role management                                  | pending        |
| 4     | Maps (nearby, pins, tracking)                    | pending        |
| 5     | Requests                                         | pending        |
| 6     | Offers                                           | pending        |
| 7     | Chat (Socket.IO)                                 | pending        |
| 8     | Notifications (FCM)                              | pending        |
| 9     | Ratings                                          | pending        |
| 10    | Admin dashboard                                  | pending        |
| 11    | Testing                                          | pending        |
| 12    | Deployment                                       | pending        |

See `docs/DATABASE_SCHEMA.md` for the full data model.
