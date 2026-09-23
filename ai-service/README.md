# EcoRoute ai-service

Python + FastAPI. Wraps the carbon calculation engine, candidate
generation, NSGA-II optimization, and the LLM explanation layer.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Carbon engine (Phase 4)

`app/core/carbon_engine.py` and `app/core/emission_factors.py` are plain
Python — no FastAPI or LLM imports — so they're testable and auditable in
isolation. Factors are loaded from `app/data/emission_factors.json`.

```bash
python -m pytest tests/ -v
```

## FastAPI service (Phase 5)

```bash
uvicorn app.main:app --reload --port 8000
```

| Method | Path | Description |
| --- | --- | --- |
| POST | `/v1/carbon/estimate` | Wraps `carbon_engine.calculate_trip_co2e` — takes transport legs, nights, accommodation category, activities; returns the CO2e breakdown |
| POST | `/v1/itineraries/generate` | Wraps `candidate_generator.generate_candidates` — takes trip parameters; returns 12 mock candidates (4 transport modes × 3 accommodation tiers) with computed carbon, cost, duration, and a preference-alignment score |

Example:

```bash
curl -X POST http://localhost:8000/v1/carbon/estimate \
  -H "Content-Type: application/json" \
  -d '{"transport_legs":[{"distance_km":350,"mode":"train","passengers":2}],"nights":3,"activities":[{"hours":4,"activity_type":"outdoor"}]}'

curl -X POST http://localhost:8000/v1/itineraries/generate \
  -H "Content-Type: application/json" \
  -d '{"origin":"London","destination":"Paris","distance_km":350,"nights":3,"travelers":2,"preference":"eco","activity_hours":4}'
```

Interactive docs at `http://localhost:8000/docs`.

Optimization (NSGA-II Pareto ranking) is added in Phase 6.
