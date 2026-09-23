# EcoRoute backend

Node.js + TypeScript + Express + Prisma (PostgreSQL).

## Setup

```bash
npm install
cp .env.example .env   # then adjust DATABASE_URL if needed
docker compose up -d   # from repo root: starts postgres:16 + redis:7
npm run prisma:migrate # applies migrations
npm run prisma:seed    # seeds 5 emission factors
```

## Prisma models

`User`, `Trip`, `Itinerary`, `TransportOption`, `Accommodation`, `Activity`,
`Destination`, `EmissionFactor`, `Recommendation` — see
[`prisma/schema.prisma`](./prisma/schema.prisma).

`EmissionFactor` rows are the source of truth mirrored from
`ai-service/app/data/emission_factors.json` and seeded via
[`prisma/seed.ts`](./prisma/seed.ts) with 5 real, sourced values (car,
train, bus, flight, hotel-night).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run prisma:migrate` | Create/apply a migration from schema changes |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:seed` | Run `prisma/seed.ts` |
| `npm run prisma:studio` | Open Prisma Studio |

## Running the server

```bash
npm run dev     # ts-node + nodemon, watches src/
# or
npm run build && npm start
```

`JWT_SECRET` must be set (see `.env.example`) — the server refuses to start
without it.

## Endpoints (Phase 3)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Returns `{ "status": "ok" }` |
| POST | `/api/v1/auth/signup` | `{ email, password, name? }` → `{ token, user }` |
| POST | `/api/v1/auth/login` | `{ email, password }` → `{ token, user }` |

Passwords are hashed with bcrypt (12 rounds); tokens are JWTs signed with
`JWT_SECRET`, expiring after 7 days.

## Trip planning (Phase 8)

`src/services/aiService.client.ts` is a typed HTTP client for all four
ai-service endpoints (`/v1/carbon/estimate`, `/v1/itineraries/generate`,
`/v1/optimize`, `/v1/recommend`), reading `AI_SERVICE_URL` from `.env`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/trips/plan` | Bearer token | Plans a trip end-to-end |

`POST /api/v1/trips/plan`:
1. Validates the request body (`origin`, `destination` with lat/lon, `distanceKm`, `startDate`/`endDate`, `travelers`, optional `budgetUsd`/`preference`/`activityHours`).
2. Finds-or-creates the `Destination` row, cached in Redis (`src/services/cache.service.ts`) by name+country to skip repeated DB lookups.
3. Saves a `Trip` row via Prisma.
4. Calls the ai-service pipeline in order: generate → optimize → recommend.
5. Saves the resulting `Itinerary` + `Recommendation` rows.
6. Returns the 5 ranked, explained options as JSON.

```bash
curl -X POST http://localhost:4000/api/v1/trips/plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "origin": "London",
    "destination": {"name": "Paris", "country": "France", "latitude": 48.8566, "longitude": 2.3522},
    "distanceKm": 350, "startDate": "2026-10-01", "endDate": "2026-10-04",
    "travelers": 2, "preference": "balanced", "activityHours": 4
  }'
```

## Tests

```bash
npm test   # Node's built-in test runner + supertest, tests/health.test.ts
```

Covers `/health`, auth validation (short password / invalid email ->
400), and the trips/plan auth guard (no token -> 401). No database
connection is required — none of these paths touch Prisma.

Verified locally with both servers running: 201 with 5 labeled,
explained itineraries; Trip/Itinerary/Recommendation rows persisted
correctly; a second request for the same destination reused the cached
`Destination` row (confirmed no duplicate row was created); missing
auth returns 401; invalid body returns 400. Since this sandbox has no
real `GEMINI_API_KEY`, the ai-service's LLM call was mocked
in-process for this end-to-end run — the committed code is unchanged;
see ai-service's README for the Phase 7 details.
