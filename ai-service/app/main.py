from fastapi import FastAPI

from app.routers import carbon, itineraries, optimize

app = FastAPI(title="EcoRoute AI Service")

app.include_router(carbon.router)
app.include_router(itineraries.router)
app.include_router(optimize.router)
