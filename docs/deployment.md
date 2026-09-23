# Deployment notes

EcoRoute has three independently deployable apps plus two managed data
stores. None of this has been deployed from this sandbox (no cloud
credentials here) — these are the steps to follow, written against each
provider's current CLI/dashboard flow.

## 1. Managed Postgres + Redis

Provision both before the backend, since it needs their connection
strings at deploy time.

- **Railway**: `New Project` → `Provision PostgreSQL` and `Provision
  Redis` as separate services in the same project. Railway exposes
  `DATABASE_URL` and `REDIS_URL` on each service automatically; reference
  them from the backend service via Railway's variable references
  (`${{Postgres.DATABASE_URL}}`, `${{Redis.REDIS_URL}}`) rather than
  copy-pasting.
- **Render**: create a **PostgreSQL** instance and a **Redis** instance
  from the dashboard (Render's managed Redis is called "Key Value").
  Both give you an internal connection string — use the *internal* one
  if the backend is also on Render (free, lower latency), the *external*
  one otherwise.

Either way, run the Prisma migration against the new database once
before or right after first deploy:

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
DATABASE_URL="<production-url>" npx prisma db seed
```

`migrate deploy` (not `migrate dev`) is the non-interactive command
meant for CI/production — it applies committed migrations without
trying to generate new ones or touch a shadow database.

## 2. ai-service (FastAPI) — Railway or Render

Both platforms build from a `Dockerfile` or auto-detect Python via
`requirements.txt`. Point the service root at `ai-service/`.

- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables**: `GEMINI_API_KEY` (required — the
  `/v1/recommend` endpoint fails without it, per Phase 7; free at
  https://aistudio.google.com/apikey)
- **Health check path**: none is defined yet; use `/docs` (FastAPI's
  built-in Swagger UI, always 200) as the platform health check target,
  or add a dedicated `/health` route before deploying if the platform
  requires a lightweight one.
- Railway: `railway up` from `ai-service/`, or connect the GitHub repo
  and set the service's root directory to `ai-service`.
- Render: **New → Web Service**, root directory `ai-service`, build
  command `pip install -r requirements.txt`, start command as above.

## 3. backend (Express) — Railway or Render

Point the service root at `backend/`.

- **Build command**: `npm ci && npx prisma generate && npm run build`
- **Start command**: `npm start` (runs `node dist/index.js`)
- **Environment variables**: `DATABASE_URL`, `JWT_SECRET` (a long random
  value, not the dev placeholder), `AI_SERVICE_URL` (the ai-service's
  deployed URL from step 2), `REDIS_URL`, `PORT` (most platforms inject
  this automatically — don't hardcode 4000)
- After first deploy, run `npx prisma migrate deploy` against the
  production `DATABASE_URL` if it wasn't already done in step 1 (Railway
  and Render both support running one-off commands against a deployed
  service).
- **Health check path**: `/health`

## 4. frontend (Next.js) — Vercel

- Import the GitHub repo into Vercel, set the project **root directory**
  to `frontend/`.
- **Environment variable**: `NEXT_PUBLIC_API_BASE_URL` = the backend's
  deployed URL from step 3 (e.g. `https://ecoroute-backend.up.railway.app`).
  This must be set at build time (`NEXT_PUBLIC_*` vars are inlined into
  the client bundle), so set it in Vercel's project settings before the
  first deploy, not just at runtime.
- Vercel auto-detects Next.js — no build/start command overrides needed.
- CORS: the backend's `cors()` middleware currently allows all origins
  (fine for this project's scope); restrict it to the Vercel domain
  before treating this as a real production deployment.

## Order of operations for a first deploy

1. Provision Postgres + Redis (step 1), note both connection strings.
2. Deploy ai-service (step 2) with `GEMINI_API_KEY` set; note its URL.
3. Deploy backend (step 3) with `DATABASE_URL`, `REDIS_URL`,
   `AI_SERVICE_URL` (from step 2), and a real `JWT_SECRET`; run
   `prisma migrate deploy` + `prisma db seed` against it.
4. Deploy frontend (step 4) with `NEXT_PUBLIC_API_BASE_URL` (from step 3).
5. Smoke-test the deployed flow the same way Phase 9/10 did locally:
   plan a trip → itinerary → compare.

## CI

`.github/workflows/ci.yml` runs on every push/PR: `pytest` for
ai-service, typecheck + `npm test` for backend, and lint + `next build`
for frontend. None of these steps deploy anything — wiring CI to
auto-deploy on green (Vercel does this natively for the frontend;
Railway/Render can be configured to redeploy on push) is a follow-up,
not done here.

## Known gaps before a real production deployment

- No backend test coverage for the trip-planning pipeline itself (only
  validation/auth paths — see `backend/tests/health.test.ts`); the
  happy path was verified manually (Phase 8/9) against real Postgres,
  Redis, and a mocked LLM call, not by an automated integration test.
- `next@14.2.35` has known CVEs whose fix requires the Next 16 major
  line — see `frontend/README.md`.
- No rate limiting, no CORS allowlist. Gemini's free tier has its own
  request-per-minute/day caps (see Google AI Studio) — no app-level cap
  is enforced here.
