"""Loads emission factor data. Plain Python — no FastAPI or LLM imports."""

import json
from pathlib import Path
from typing import TypedDict

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "emission_factors.json"


class EmissionFactor(TypedDict):
    value: float
    unit: str
    source: str
    year: int
    assumption: str


def _load_factors() -> dict[str, dict[str, EmissionFactor]]:
    with open(_DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


_FACTORS = _load_factors()


def get_factor(category: str, mode: str) -> EmissionFactor:
    try:
        return _FACTORS[category][mode]
    except KeyError as exc:
        raise ValueError(f"No emission factor for category={category!r}, mode={mode!r}") from exc
