"""NSGA-II Pareto ranking over a fixed set of candidate itineraries. No
FastAPI or LLM imports — a router wraps this, results feed the LLM
explanation layer in Phase 7."""

import numpy as np
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.core.problem import Problem
from pymoo.optimize import minimize
from pymoo.util.nds.non_dominated_sorting import NonDominatedSorting

LABEL_ORDER = ["LOW_CARBON", "BALANCED", "LOW_COST", "TIME_EFFICIENT", "PREFERENCE_FOCUSED"]


def _extract_objectives(candidates: list[dict]) -> np.ndarray:
    # All four objectives are minimized; preference is negated since a
    # higher preference_score is better.
    return np.array(
        [
            [
                c["carbon"]["total_co2e"],
                c["cost_usd"],
                c["duration_hrs"],
                -c["preference_score"],
            ]
            for c in candidates
        ]
    )


class _CandidateSelectionProblem(Problem):
    """Decision variable is (a continuous relaxation of) which candidate
    index to pick; NSGA-II searches over the fixed, precomputed objective
    table rather than generating new itineraries."""

    def __init__(self, objectives: np.ndarray):
        super().__init__(n_var=1, n_obj=objectives.shape[1], xl=0, xu=len(objectives) - 1)
        self._objectives = objectives

    def _evaluate(self, x, out, *args, **kwargs):
        indices = np.clip(np.round(x[:, 0]).astype(int), 0, len(self._objectives) - 1)
        out["F"] = self._objectives[indices]


def _pareto_indices(candidates: list[dict]) -> list[int]:
    objectives = _extract_objectives(candidates)
    problem = _CandidateSelectionProblem(objectives)
    algorithm = NSGA2(pop_size=min(40, max(10, len(candidates) * 3)))
    result = minimize(problem, algorithm, ("n_gen", 30), seed=42, verbose=False)

    found_indices = sorted({int(np.clip(round(row[0]), 0, len(candidates) - 1)) for row in result.X})

    # Rounding continuous positions to discrete indices can reintroduce
    # dominated points, so re-sort the found set to guarantee a true
    # Pareto front before it's returned.
    front_objectives = objectives[found_indices]
    non_dominated = NonDominatedSorting().do(front_objectives, only_non_dominated_front=True)
    return [found_indices[i] for i in non_dominated]


def _select_labeled_set(candidates: list[dict], pareto_indices: list[int]) -> list[dict]:
    pareto_candidates = [candidates[i] for i in pareto_indices]

    carbon_values = [c["carbon"]["total_co2e"] for c in pareto_candidates]
    cost_values = [c["cost_usd"] for c in pareto_candidates]
    duration_values = [c["duration_hrs"] for c in pareto_candidates]
    utopia = np.array([min(carbon_values), min(cost_values), min(duration_values)])
    nadir = np.array([max(carbon_values), max(cost_values), max(duration_values)])
    span = np.where(nadir - utopia == 0, 1, nadir - utopia)

    def knee_distance(candidate: dict) -> float:
        point = np.array([candidate["carbon"]["total_co2e"], candidate["cost_usd"], candidate["duration_hrs"]])
        return float(np.linalg.norm((point - utopia) / span))

    selections = {
        "LOW_CARBON": min(pareto_candidates, key=lambda c: c["carbon"]["total_co2e"]),
        "BALANCED": min(pareto_candidates, key=knee_distance),
        "LOW_COST": min(pareto_candidates, key=lambda c: c["cost_usd"]),
        "TIME_EFFICIENT": min(pareto_candidates, key=lambda c: c["duration_hrs"]),
        "PREFERENCE_FOCUSED": max(pareto_candidates, key=lambda c: c["preference_score"]),
    }

    return [{**selections[label], "label": label} for label in LABEL_ORDER]


def optimize_candidates(candidates: list[dict]) -> list[dict]:
    if len(candidates) < 2:
        return [{**candidates[0], "label": label} for label in LABEL_ORDER] if candidates else []

    pareto_indices = _pareto_indices(candidates)
    return _select_labeled_set(candidates, pareto_indices)
