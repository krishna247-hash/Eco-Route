"""
EcoRoute Python FastAPI Optimization Microservice
Exposes REST endpoints for NSGA-II Multi-Objective Optimization.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from nsga2_optimizer import run_nsga2_optimizer

app = FastAPI(
    title="EcoRoute AI Multi-Objective Optimizer",
    description="NSGA-II Genetic Algorithm microservice for Pareto-optimal carbon itinerary discovery.",
    version="1.0.0"
)

class OptimizeRequest(BaseModel):
    distance_km: float = 500.0
    nights: int = 3
    pop_size: int = 40
    generations: int = 15

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "EcoRoute AI Optimization Engine",
        "framework": "NSGA-II Multi-Objective Pareto Sorting"
    }

@app.post("/optimize")
def optimize_trip(req: OptimizeRequest):
    result = run_nsga2_optimizer(
        distance_km=req.distance_km,
        nights=req.nights,
        pop_size=req.pop_size,
        generations=req.generations
    )
    return {
        "success": True,
        "data": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
