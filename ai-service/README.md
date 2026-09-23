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

FastAPI routes are added starting in Phase 5.
