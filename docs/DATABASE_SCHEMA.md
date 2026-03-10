# Database Schema — Village Transport Connect

MongoDB (Mongoose). 11 collections. Money and distance are deliberately **not**
modelled anywhere except a manually-entered `price` on an Offer.

## Entity-relationship overview

```
                       ┌─────────────┐
                       │    User     │  role: customer | vehicle_owner | driver | admin
                       └─────┬───────┘
        ┌────────────────────┼───────────────────────────┐
        │ 1:n                │ 1:1 (driver)               │ 1:n (customer)
        ▼                    ▼                            ▼
   ┌─────────┐          ┌─────────┐                 ┌──────────┐
   │ Vehicle │          │ Driver  │                 │ Request  │
   └────┬────┘          └────┬────┘                 └────┬─────┘
        │                    │                           │ 1:n
        │ registrationDoc    │ licenseDoc                ▼
        ▼                    ▼                      ┌──────────┐
   ┌──────────┐         ┌──────────┐                │  Offer   │ price (manual)
   │ Document │◀────────┤ Document │                └────┬─────┘
   └──────────┘         └──────────┘                     │ accepted → opens
                                                          ▼
                                                    ┌──────────┐   1:n   ┌──────────┐
                                                    │   Chat   │────────▶│ Message  │
                                                    └────┬─────┘         └──────────┘
                                                         │ after completion
                                                         ▼
                                                    ┌──────────┐
                                                    │  Rating  │ (both directions)
                                                    └──────────┘

   Notification ── recipient ──▶ User        RefreshToken ── user ──▶ User
```

## Collections

### 1. Users
Single identity collection for all roles. Holds phone (unique login), profile,
last known `location` (GeoJSON Point, `2dsphere`), FCM tokens, and a
denormalised `ratingSummary { average, count }`.
Indexes: `phone` (unique), `location` (2dsphere), `{ role, status, createdAt }`.

### 2. Vehicles
Owned by a vehicle-owner User (1:n). Type, plate, images, availability,
`location`, link to a registration `Document`.
Indexes: `location` (2dsphere), `{ type, isAvailable, isActive }`,
`{ owner, registrationNumber }` (unique).

### 3. Drivers
1:1 profile for driver-role Users. Licence, experience, `vehicleCategories`
(which vehicle types they can drive), availability, `location`.
Indexes: `user` (unique), `location` (2dsphere), `{ vehicleCategories, isAvailable }`.

### 4. Requests
Demand side. Pickup/destination (`Place` = address + Point), optional
`vehicleType`, `serviceType`, `scheduledAt`, `status`, denormalised
`offersCount`, and — once matched — `acceptedOffer`, `selectedProvider`, `chat`.
**No price field.** Indexes: `pickup.location` (2dsphere),
`{ status, vehicleType, scheduledAt }`, `{ customer, status, createdAt }`.

### 5. Offers
A provider's priced response to a Request. `price` is manually entered,
validated only for sanity bounds (≥ 0). `providerType` decides whether a
`vehicle` ref is required. Partial-unique index guarantees one active offer per
provider per request.
Indexes: `{ request, status, createdAt }`, `{ provider, createdAt }`,
`{ request, provider }` unique (partial: status ∈ {pending, accepted}).

### 6. Chats
One per request (`request` unique), exactly two participants. Denormalised
`lastMessage*` for the conversation list; `unread` map per participant.
Index: `{ participants, lastMessageAt }`.

### 7. Messages
Text / image / location messages. `readBy[]` powers read receipts. Typing and
presence are transient (Socket.IO), not stored.
Index: `{ chat, createdAt }`.

### 8. Ratings
Post-completion, bidirectional (`direction`). One per (request, rater). Writing
one updates the ratee's `User.ratingSummary`.
Indexes: `{ request, rater }` unique, `{ ratee, createdAt }`.

### 9. Notifications
Durable in-app inbox mirroring push (FCM). Typed `data` payload for deep-links.
Indexes: `{ recipient, isRead, createdAt }`, TTL on `createdAt` (60 days).

### 10. Documents
KYC artefacts (licence, registration) on Cloudinary. Admin verification flips
`status` and cascades to the owning Driver/Vehicle.
Index: `{ status, createdAt }` (verification queue).

### 11. RefreshTokens
SHA-256 **hash** of each issued refresh token (never the raw value) for
rotation, revocation and reuse detection. TTL index auto-deletes expired rows.
Indexes: `tokenHash` unique, `expiresAt` TTL, `user`.

## Design notes

- **Geo-first.** All "nearby" features are `$near` queries on `2dsphere`
  indexes — the server never computes distances in JS, and there is no fare math.
- **Denormalised counters/summaries** (`offersCount`, `ratingSummary`,
  `lastMessage*`, `unread`) keep hot list screens to a single query.
- **Soft state, hard invariants.** Unique/partial indexes enforce the rules that
  matter (one plate per owner, one active offer per provider per request, one
  chat per request, one rating per job) at the database level, not just in code.
