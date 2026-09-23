# EcoRoute ai-service

Python + FastAPI. Wraps the carbon calculation engine, candidate
generation, NSGA-II optimization, and the LLM explanation layer.

## Setup

**Requires Python 3.11+** — `pip install -r requirements.txt` will fail
on older versions (the pinned `numpy==2.4.6` has no wheel for Python
3.9/3.10). Check with `python3 --version`; if it's older, install 3.11
(macOS: `brew install python@3.11`, then use `python3.11` below) before
continuing.

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
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

## Optimization (Phase 6)

`app/core/optimizer.py` runs NSGA-II (via pymoo) over the candidate set's
precomputed objectives (carbon, cost, duration, −preference_score), then
re-applies non-dominated sorting to guarantee a true Pareto front, and
picks 5 representative itineraries labeled `LOW_CARBON`, `BALANCED`,
`LOW_COST`, `TIME_EFFICIENT`, `PREFERENCE_FOCUSED` (`BALANCED` is the
front's knee point — closest to the ideal/utopia point in normalized
objective space).

| Method | Path | Description |
| --- | --- | --- |
| POST | `/v1/optimize` | Takes `{ candidates: [...] }` (the output of `/v1/itineraries/generate`), returns `{ pareto_set: [...] }` with 5 labeled itineraries |

```bash
curl -X POST http://localhost:8000/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{"candidates": [ ...output of /v1/itineraries/generate... ]}'
```

```bash
python -m pytest tests/test_optimizer.py -v
```

## LLM recommendation + explanation (Phase 7)

`app/core/llm_client.py` calls Google's Gemini API (free tier via
[Google AI Studio](https://aistudio.google.com/apikey) — `GEMINI_API_KEY`
from `.env`, never hardcoded) to turn already-computed numbers into a 2-3
sentence explanation. The prompt passes only carbon/cost/duration figures
computed by `carbon_engine.py` and `optimizer.py` (plus their deltas
against a "conventional" baseline — the highest-carbon candidate) and
explicitly instructs the model not to invent, estimate, or recalculate
any figure.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/v1/recommend` | Takes `{ candidates: [...] }`, runs `/v1/optimize` internally, and returns `{ baseline_id, recommendations: [...] }` — each of the 5 Pareto options plus its LLM explanation |

```bash
curl -X POST http://localhost:8000/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"candidates": [ ...output of /v1/itineraries/generate... ]}'
```

**Requires a real `GEMINI_API_KEY` in `ai-service/.env`** to return real
explanations — get one free at https://aistudio.google.com/apikey (no
credit card required). `.env` is loaded automatically (`python-dotenv`)
on startup.

**One LLM call per `/v1/recommend` request, not five.** All 5 options are
explained in a single batched call (`explain_recommendations`, JSON
response mode keyed by strategy label) rather than one call per option —
Gemini's free tier is rate- and quota-limited per model, and 5 calls per
trip plan burns through a free-tier daily quota almost immediately (hit
this for real in testing: `gemini-3.6-flash`'s free tier caps at 20
requests/*day*, exhausted after light testing). Transient `503`
"overloaded" errors (Google's shared free-tier capacity) are retried
twice with a short delay before giving up.

Model: `gemini-3.1-flash-lite` — the `-lite` tier carries a much more
generous free-tier daily allowance than `gemini-3.6-flash` and worked
reliably in testing, unlike `gemini-flash-latest` (empirically
overloaded, 503, during testing) or `gemini-3.5-flash-lite` /
`gemini-flash-lite-latest` (400 on this account). Uses
`thinking_config=ThinkingConfig(thinking_budget=0)` — this model reasons
by default, which for a "rephrase these numbers into a couple of
sentences" task just burns output-token budget on hidden thinking tokens
for no benefit.

Verified against the **real** API end-to-end (not just mocked): every
recommendation in a live `/v1/recommend` response used exactly the
numbers computed by `carbon_engine.py` and `optimizer.py`, with no
invented figures. Example (abbreviated):

```json
{
  "label": "LOW_CARBON",
  "carbon": { "total_co2e": 86.5 },
  "cost_usd": 344.0,
  "duration_hrs": 6.92,
  "explanation": "Choosing the low-carbon option allows you to generate just 86.5 kg CO2e in total carbon, which is a reduction of -154.0 kg CO2e compared to the conventional baseline option. You will also save money with a total cost of $344.00, representing a cost difference of -42.00 USD. In exchange for these savings, the trip has a total duration of 6.9 hours, adding a duration difference of +2.4 hours compared to the baseline."
}
```

Also verified without a real key (for CI and anyone without one yet):
`tests/test_llm_client.py` mocks the Gemini client and asserts: the
built prompt contains only the given numbers (never invented ones) and
exactly one call is made for any number of options; a safety-blocked
response (`finish_reason == SAFETY`) raises rather than returning empty
text; a transient `ServerError` (503) is retried and a subsequent
success is returned; retries are exhausted (and the error re-raised)
after 3 total attempts.

```bash
python -m pytest tests/test_llm_client.py -v
```

Node ↔ FastAPI wiring is added in Phase 8.
