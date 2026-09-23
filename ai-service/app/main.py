from fastapi import FastAPI

from app.routers import carbon, itineraries

app = FastAPI(title="EcoRoute AI Service")

app.include_router(carbon.router)
app.include_router(itineraries.router)
