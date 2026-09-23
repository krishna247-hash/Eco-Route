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
`JWT_SECRET`, expiring after 7 days. Trip/itinerary routes are added in
Phase 8.
