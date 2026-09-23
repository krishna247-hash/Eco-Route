# EcoRoute frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Setup

```bash
npm install
cp .env.local.example .env.local   # points at the backend, default http://localhost:4000
npm run dev
```

## Pages (Phase 9)

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/plan` | `PreferenceForm` — destination, dates, travelers, budget, sustainability preference. Calls `planTrip()` and redirects to `/itinerary/[tripId]` |
| `/itinerary/[id]` | Recommended (`BALANCED`) option: `ItineraryTimeline` (day-by-day outline) + `CarbonDashboard` (transport/accommodation/activity/total CO2e bar chart) |
| `/compare/[id]` | `ComparisonTable` — all 5 ranked options side by side (carbon, cost, time, preference match) with each option's LLM explanation |

`lib/api-client.ts` calls the backend's `POST /api/v1/trips/plan`. That
route is JWT-protected but the build guide never adds a login page, so
`planTrip()` transparently creates a guest account on first use and
reuses its token from `localStorage` — no invented login UI.

There is no backend "get trip by id" route yet, so `/itinerary/[id]` and
`/compare/[id]` read the result `planTrip()` already returned, persisted
to `sessionStorage` by `lib/tripStore.ts`. Visiting either URL directly
(without having planned a trip in this browser session) shows a
"trip not found" state with a link back to `/plan`.

Verified in a real headless-Chromium run against all three services
running together (see backend/ai-service READMEs for their pieces):
landing → plan form → submit → itinerary page (correct carbon/cost/
duration, working day-by-day outline, working bar chart) → compare
page (all 5 options + explanations). No console errors besides the
missing favicon.

## Legacy prototype

`../legacy/frontend-prototype/` holds the original single-app pages
(landing, `/planner`, `/dashboard`, `/travel-pass`) from before this
monorepo rebuild. They imported from a `src/lib/` module that was never
actually committed to the repo, so they never built; they're kept only
for reference, not part of the running app.

## Known issue: Next.js dependency vulnerabilities

`npm audit` reports vulnerabilities in `next@14.2.35` (the latest 14.2.x
patch) that only have a fix in the Next.js 16 major line — a breaking
upgrade outside this guide's "Next.js 14" scope. Most of the advisories
concern the Image Optimization API, custom servers, and advanced
middleware/rewrites, none of which this app uses. Worth revisiting
before a real deployment (see Phase 10).
