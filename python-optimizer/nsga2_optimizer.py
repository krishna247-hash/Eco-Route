"""
EcoRoute: Multi-Objective Carbon Optimization Framework
Implementation of NSGA-II (Non-dominated Sorting Genetic Algorithm II)
for sustainable multimodal travel itinerary planning.

Objectives to minimize:
f1: Total Carbon Emissions (kg CO2e)
f2: Total Financial Cost (USD)
f3: Total Travel Time (hours)
f4: -Preference Score (maximize comfort/user alignment)
"""

import math
import random
from typing import List, Dict, Tuple, Any

# DEFRA & ICAO Standard Factors
EMISSION_FACTORS = {
    'flight': 0.255,  # kg CO2e / pkm (< 700km short-haul)
    'train': 0.032,   # electric high-speed rail
    'bus': 0.055,     # express coach
    'ev': 0.042,      # electric vehicle
    'car': 0.171,     # petrol ICE vehicle
}

SPEEDS_KMH = {
    'flight': 750,
    'train': 180,
    'bus': 80,
    'ev': 95,
    'car': 95,
}

COSTS_PER_KM = {
    'flight': 0.16,
    'train': 0.11,
    'bus': 0.06,
    'ev': 0.08,
    'car': 0.14,
}

HOTEL_FACTORS = {
    'eco_hostel': (7.5, 45),     # (kg CO2e/night, $/night)
    'eco_hotel': (12.0, 120),
    'standard_hotel': (26.5, 140),
    'luxury_resort': (58.0, 320),
}


class ItineraryChromosome:
    """Individual chromosome representing a candidate trip configuration."""
    def __init__(self, mode: str, hotel_tier: str, distance_km: float, nights: int):
        self.mode = mode
        self.hotel_tier = hotel_tier
        self.distance_km = distance_km
        self.nights = nights
        
        # Computed Objectives
        self.carbon: float = 0.0
        self.cost: float = 0.0
        self.time: float = 0.0
        self.rank: int = 0
        self.crowding_distance: float = 0.0
        self.evaluate()

    def evaluate(self):
        # Transport evaluation (round-trip)
        roundtrip_dist = self.distance_km * 2
        mode_factor = EMISSION_FACTORS.get(self.mode, 0.1)
        speed = SPEEDS_KMH.get(self.mode, 100)
        cost_rate = COSTS_PER_KM.get(self.mode, 0.1)
        
        overhead = 2.2 if self.mode == 'flight' else 0.6
        transit_hours = (roundtrip_dist / speed) + (overhead * 2)
        transit_carbon = roundtrip_dist * mode_factor
        transit_cost = 50 + (roundtrip_dist * cost_rate)
        
        # Accommodation evaluation
        hotel_carbon_rate, hotel_cost_rate = HOTEL_FACTORS.get(self.hotel_tier, (20.0, 100.0))
        hotel_carbon = hotel_carbon_rate * self.nights
        hotel_cost = hotel_cost_rate * self.nights
        
        self.carbon = round(transit_carbon + hotel_carbon, 2)
        self.cost = round(transit_cost + hotel_cost, 2)
        self.time = round(transit_hours, 2)

    def dominates(self, other: 'ItineraryChromosome') -> bool:
        """Pareto dominance check."""
        not_worse = (
            self.carbon <= other.carbon and
            self.cost <= other.cost and
            self.time <= other.time
        )
        strictly_better = (
            self.carbon < other.carbon or
            self.cost < other.cost or
            self.time < other.time
        )
        return not_worse and strictly_better


def fast_non_dominated_sort(population: List[ItineraryChromosome]) -> List[List[ItineraryChromosome]]:
    """Fast Non-dominated Sorting algorithm for NSGA-II."""
    fronts: List[List[ItineraryChromosome]] = [[]]
    domination_counts = {p: 0 for p in population}
    dominated_solutions = {p: [] for p in population}

    for p in population:
        for q in population:
            if p.dominates(q):
                dominated_solutions[p].append(q)
            elif q.dominates(p):
                domination_counts[p] += 1
        if domination_counts[p] == 0:
            p.rank = 0
            fronts[0].append(p)

    i = 0
    while len(fronts[i]) > 0:
        next_front = []
        for p in fronts[i]:
            for q in dominated_solutions[p]:
                domination_counts[q] -= 1
                if domination_counts[q] == 0:
                    q.rank = i + 1
                    next_front.append(q)
        i += 1
        fronts.append(next_front)

    return [f for f in fronts if len(f) > 0]


def run_nsga2_optimizer(distance_km: float, nights: int, pop_size: int = 40, generations: int = 15) -> Dict[str, Any]:
    """Runs the evolutionary search to extract the Pareto frontier."""
    modes = ['train', 'ev', 'bus', 'flight', 'car']
    hotel_tiers = ['eco_hostel', 'eco_hotel', 'standard_hotel', 'luxury_resort']

    # Initialize population
    population: List[ItineraryChromosome] = []
    for _ in range(pop_size):
        m = random.choice(modes)
        h = random.choice(hotel_tiers)
        population.append(ItineraryChromosome(m, h, distance_km, nights))

    # Run generations
    for _ in range(generations):
        # Create offspring via crossover and mutation
        offspring: List[ItineraryChromosome] = []
        for _ in range(pop_size // 2):
            parent1 = random.choice(population)
            parent2 = random.choice(population)
            child_mode = parent1.mode if random.random() > 0.5 else parent2.mode
            child_hotel = parent2.hotel_tier if random.random() > 0.5 else parent1.hotel_tier
            
            # Mutation
            if random.random() < 0.2:
                child_mode = random.choice(modes)
            if random.random() < 0.2:
                child_hotel = random.choice(hotel_tiers)
                
            offspring.append(ItineraryChromosome(child_mode, child_hotel, distance_km, nights))

        combined = population + offspring
        fronts = fast_non_dominated_sort(combined)
        
        new_pop = []
        for front in fronts:
            if len(new_pop) + len(front) <= pop_size:
                new_pop.extend(front)
            else:
                needed = pop_size - len(new_pop)
                new_pop.extend(front[:needed])
                break
        population = new_pop

    pareto_front = fast_non_dominated_sort(population)[0]

    # Categorize hallmark solutions
    eco_champion = min(pareto_front, key=lambda x: x.carbon)
    fastest = min(pareto_front, key=lambda x: x.time)
    
    # Balanced knee point (Chebyshev / Utopia distance)
    min_c = min(x.carbon for x in pareto_front)
    max_c = max(x.carbon for x in pareto_front) or 1.0
    min_t = min(x.time for x in pareto_front)
    max_t = max(x.time for x in pareto_front) or 1.0

    balanced = min(
        pareto_front,
        key=lambda x: math.sqrt(
            2.0 * ((x.carbon - min_c) / (max_c - min_c + 1e-5))**2 +
            1.0 * ((x.time - min_t) / (max_t - min_t + 1e-5))**2
        )
    )

    return {
        'total_evaluations': pop_size * generations,
        'frontier_size': len(pareto_front),
        'eco_champion': {
            'mode': eco_champion.mode,
            'hotel': eco_champion.hotel_tier,
            'carbon_kg': eco_champion.carbon,
            'cost_usd': eco_champion.cost,
            'time_hours': eco_champion.time,
        },
        'balanced': {
            'mode': balanced.mode,
            'hotel': balanced.hotel_tier,
            'carbon_kg': balanced.carbon,
            'cost_usd': balanced.cost,
            'time_hours': balanced.time,
        },
        'fastest': {
            'mode': fastest.mode,
            'hotel': fastest.hotel_tier,
            'carbon_kg': fastest.carbon,
            'cost_usd': fastest.cost,
            'time_hours': fastest.time,
        }
    }


if __name__ == '__main__':
    results = run_nsga2_optimizer(distance_km=550, nights=3)
    import json
    print(json.dumps(results, indent=2))
