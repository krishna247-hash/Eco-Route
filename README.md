# EcoRoute

[![CI](https://github.com/krishna247-hash/Eco-Route/actions/workflows/ci.yml/badge.svg)](https://github.com/krishna247-hash/Eco-Route/actions/workflows/ci.yml)

**EcoRoute** is an AI-driven sustainable travel planning platform. It formulates
itinerary generation as a multi-objective optimization problem — balancing
carbon footprint, cost, travel time, and traveler preference — and explains
its recommendations in plain language.

This repository is a monorepo with three applications that are built and run
independently:

| App | Path | Stack | Role |
| --- | --- | --- | --- |
| **frontend** | [`frontend/`](./frontend) | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Trip planner UI, itinerary/carbon dashboard, comparison view |
| **backend** | [`backend/`](./backend) | Node.js + Express + Prisma | REST API, auth, persistence, orchestrates the ai-service pipeline |
| **ai-service** | [`ai-service/`](./ai-service) | Python + FastAPI | Carbon calculation engine, candidate generation, NSGA-II Pareto optimization, LLM explanation layer |

Supporting infra: **PostgreSQL 16** (primary datastore, via Prisma) and
**Redis 7** (caching), both run locally via [`docker-compose.yml`](./docker-compose.yml).

## Why three apps

Keeping the carbon-calculation/optimization code (deterministic, unit-tested
Python) in its own service, separate from the LLM-driven explanation layer and
the Node API, keeps the boundary between deterministic logic and AI-generated
output explicit and auditable — the `ai-service/app/core/` modules never
import FastAPI or an LLM client, so they can be tested and reasoned about as
plain functions.

## Repository layout

```
ecoroute/
├── frontend/        # Next.js + TypeScript + Tailwind
├── backend/          # Node.js + Express + Prisma (Postgres)
├── ai-service/        # Python + FastAPI (carbon engine, optimizer, LLM explain)
├── docs/              # Architecture diagrams and design notes
├── legacy/            # Earlier single-app prototype, kept for reference only
├── docker-compose.yml # Postgres 16 + Redis 7 for local dev
└── README.md
```

`legacy/python-optimizer/` holds a standalone NSGA-II script and FastAPI
prototype from an earlier iteration of this project; it is not part of the
running system but is kept as a reference while `ai-service/` is built out.

## Pinned versions

| Tool | Version used in this repo |
| --- | --- |
| Node.js | v22.22.2 |
| Python | 3.11.15 |
| Next.js | 14.2.x |
| FastAPI | 0.115.x (added in Phase 5) |

Pinning these early avoids drift between phases built in different sessions —
see the build log below.

## Local development

Each app has its own README with setup instructions. Shared local
infrastructure:

```bash
docker compose up -d   # starts postgres:16 on :5432 and redis:7 on :6379
```

Then, in three terminals:

```bash
cd ai-service && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
cd backend && npm run dev
cd frontend && npm run dev
```

Full end-to-end flow: open `http://localhost:3000`, click **Plan a trip**,
submit the form, and you land on the itinerary page (carbon dashboard +
day-by-day outline), with a link to compare all 5 ranked options. See
[`docs/deployment.md`](./docs/deployment.md) for deploying this stack
(Vercel + Railway/Render + managed Postgres/Redis).

## CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every
push/PR: `pytest` for ai-service, typecheck + tests for backend, lint +
build for frontend.

## Build status

This project is being built in phases (see the original build guide). Status:

- [x] Phase 1 — Repo & tooling
- [x] Phase 2 — Database schema
- [x] Phase 3 — Backend skeleton
- [x] Phase 4 — Carbon calculation engine
- [x] Phase 5 — FastAPI service
- [x] Phase 6 — Optimization engine
- [x] Phase 7 — LLM recommendation layer
- [x] Phase 8 — Node ↔ FastAPI wiring
- [x] Phase 9 — Frontend
- [x] Phase 10 — Integration, seed data, deploy

## License

MIT
